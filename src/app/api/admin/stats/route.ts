import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["ADMIN","SUPER_ADMIN"].includes(profile?.role || "")) return { ok: false as const, status: 403 }
  return { ok: true as const, user, supabase }
}

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status })
  const service = createServiceSupabase()
  // Resolve event from host (subdomain) — fallback to default lkbbvote
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  let eventId: string | null = null
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}
  // Query param override: ?event_id=all -> SUPER_ADMIN global, ?event_id=<uuid> -> specific
  const url = new URL(req.url)
  const qEventId = url.searchParams.get("event_id")
  const isSuper = auth.user ? await (await import("@/lib/event")).isSuperAdmin(auth.user.id) : false
  let filterEventId: string | null = eventId
  if (qEventId === "all") {
    if (!isSuper) return NextResponse.json({ error: "SUPER_ADMIN required for all events" }, { status: 403 })
    filterEventId = null // global
  } else if (qEventId && qEventId !== "all") {
    // Strict check: non-super can only query own event
    if (!isSuper) {
      const { isEventAdmin } = await import("@/lib/event")
      if (!await isEventAdmin(qEventId, auth.user.id)) {
        return NextResponse.json({ error: "Forbidden — not admin for this event" }, { status: 403 })
      }
    }
    filterEventId = qEventId
  } else if (filterEventId && !isSuper) {
    // Host-based event: check membership
    const { isEventAdmin } = await import("@/lib/event")
    if (!await isEventAdmin(filterEventId, auth.user.id)) {
      return NextResponse.json({ error: "Forbidden — not admin for this event" }, { status: 403 })
    }
  }

  // Helper to add event filter
  const addEventFilter = (q: any) => filterEventId ? q.eq("event_id", filterEventId) : q

  const [peletons, peletonsSMP, peletonsSMA, users, transactions, supports, ranking, recentTx, eventRow, auditLogs, chartSupports] = await Promise.all([
    addEventFilter(service.from("peletons").select("*", { count: "exact", head: true }).eq("active", true)),
    addEventFilter(service.from("peletons").select("*", { count: "exact", head: true }).eq("category", "SMP").eq("active", true)),
    addEventFilter(service.from("peletons").select("*", { count: "exact", head: true }).eq("category", "SMA").eq("active", true)),
    service.from("profiles").select("*", { count: "exact", head: true }),
    addEventFilter(service.from("transactions").select("*", { count: "exact", head: true })),
    addEventFilter(service.from("supports").select("supports,source")),
    addEventFilter(service.from("team_ranking").select("*").order("total_ballots", { ascending: false }).limit(5)),
    addEventFilter(service.from("transactions").select("*, peletons(name,number,school,category), profiles(public_name,email,role)").order("created_at", { ascending: false }).limit(8)),
    (filterEventId ? service.from("events").select("*").eq("id", filterEventId).maybeSingle() : service.from("events").select("*").eq("slug", "lkbbvote").maybeSingle()),
    addEventFilter(service.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(5)),
    addEventFilter(service.from("supports").select("supports,source,created_at").order("created_at", { ascending: true })),
  ])
  // Fallback to competitions if events empty (migration period)
  let eventData: any = (eventRow as any)?.data || null
  if (!eventData) {
    const { data: comp } = await service.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).single()
    eventData = comp || null
    // Map competitions.state to events.status for frontend
    if (eventData) eventData.state = eventData.state || eventData.status
  }

  const total = (supports.data || []).reduce((a: any, b: any) => a + (b.supports || 0), 0)
  const online = (supports.data || []).filter((x: any) => x.source === "online").reduce((a: any, b: any) => a + b.supports, 0)
  const offline = total - online

  // Build chart data for last 5 days (online vs offline) — use WIB date for label consistency
  const chartMap = new Map<string, { date: string; label: string; online: number; offline: number }>()
  const now = new Date()
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10) // UTC key for grouping
    // WIB label: use Jakarta time
    const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" })
    chartMap.set(key, { date: key, label, online: 0, offline: 0 })
  }
  for (const row of (chartSupports.data || []) as any[]) {
    const key = new Date(row.created_at).toISOString().slice(0, 10)
    if (chartMap.has(key)) {
      const entry = chartMap.get(key)!
      if (row.source === "online") entry.online += row.supports || 0
      else if (row.source === "offline") entry.offline += row.supports || 0
      else entry.online += row.supports || 0
    }
  }
  const chartData = Array.from(chartMap.values())
  const maxVal = Math.max(1, ...chartData.map(c => (c.online + c.offline) || Math.max(c.online, c.offline)))

  return NextResponse.json({
    totalTeams: peletons.count ?? 0,
    smp: peletonsSMP.count ?? 0,
    sma: peletonsSMA.count ?? 0,
    totalUsers: users.count ?? 0,
    totalTransactions: transactions.count ?? 0,
    totalBallots: total,
    onlineBallots: online,
    offlineBallots: offline,
    ranking: ranking.data || [],
    recentTransactions: recentTx.data || [],
    event: eventData || null,
    auditLogs: auditLogs.data || [],
    chartData,
    chartMax: maxVal,
  })
}
