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
  if (profile?.role !== "ADMIN") return { ok: false as const, status: 403 }
  return { ok: true as const, user, supabase }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status })
  const service = createServiceSupabase()
  const [peletons, peletonsSMP, peletonsSMA, users, transactions, supports, ranking, recentTx, competitions, auditLogs, chartSupports] = await Promise.all([
    service.from("peletons").select("*", { count: "exact", head: true }).eq("active", true),
    service.from("peletons").select("*", { count: "exact", head: true }).eq("category", "SMP").eq("active", true),
    service.from("peletons").select("*", { count: "exact", head: true }).eq("category", "SMA").eq("active", true),
    service.from("profiles").select("*", { count: "exact", head: true }),
    service.from("transactions").select("*", { count: "exact", head: true }),
    service.from("supports").select("supports,source"),
    service.from("team_ranking").select("*").order("total_ballots", { ascending: false }).limit(5),
    service.from("transactions").select("*, peletons(name,number,school,category), profiles(public_name,email,role)").order("created_at", { ascending: false }).limit(8),
    service.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).single(),
    service.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(5),
    service.from("supports").select("supports,source,created_at").order("created_at", { ascending: true }),
  ])

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
    event: competitions.data || null,
    auditLogs: auditLogs.data || [],
    chartData,
    chartMax: maxVal,
  })
}
