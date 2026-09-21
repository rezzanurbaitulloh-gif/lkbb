import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSuperAdmin } from "@/lib/event"

async function requireSuperAdmin() {
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
  if (!await isSuperAdmin(user.id)) return { ok: false as const, status: 403 }
  return { ok: true as const, user }
}

// GET /api/admin/financials — super saja.
// Kartu per event (terpisah, tidak campur) + total global. Live dari transactions,
// fallback ke materialized view financial_aggregates bila ada.
export async function GET(req: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("event_id")

  const { data: events } = await service.from("events").select("id,slug,name,status,event_date").order("created_at", { ascending: true })
  const list = (events || []).filter((e: any) => !eventId || e.id === eventId)

  // Coba materialized view dulu (cepat), fallback agregasi live
  let useView = false
  try {
    const probe = await service.from("financial_aggregates").select("event_id").limit(1)
    useView = !probe.error
  } catch {}

  const cards: any[] = []
  for (const ev of list as any[]) {
    let row: any = null
    if (useView) {
      const { data } = await service.from("financial_aggregates").select("*").eq("event_id", ev.id).maybeSingle()
      if (data) {
        row = {
          event_id: ev.id,
          slug: ev.slug,
          name: ev.name,
          status: ev.status,
          event_date: ev.event_date,
          total_transactions: Number((data as any).total_transactions || 0),
          total_revenue: Number((data as any).total_revenue || 0),
          verified_revenue: Number((data as any).verified_revenue || 0),
          pending_revenue: Number((data as any).pending_revenue || 0),
          unique_payers: Number((data as any).unique_payers || 0),
          last_transaction_at: (data as any).last_transaction_at || null,
          source: "view",
        }
      }
    }
    if (!row) {
      // Agregasi live (realtime) — terpisah per event
      const { data: txs } = await service.from("transactions").select("amount,status,user_id,created_at").eq("event_id", ev.id)
      const arr = (txs || []) as any[]
      const ok = arr.filter((t) => t.status === "Success" || t.status === "PAID")
      const pending = arr.filter((t) => t.status === "Pending")
      row = {
        event_id: ev.id,
        slug: ev.slug,
        name: ev.name,
        status: ev.status,
        event_date: ev.event_date,
        total_transactions: arr.length,
        total_revenue: arr.reduce((s, t) => s + Number(t.amount || 0), 0),
        verified_revenue: ok.reduce((s, t) => s + Number(t.amount || 0), 0),
        pending_revenue: pending.reduce((s, t) => s + Number(t.amount || 0), 0),
        unique_payers: new Set(arr.map((t) => t.user_id)).size,
        last_transaction_at: arr.reduce((m: string | null, t: any) => (!m || t.created_at > m ? t.created_at : m), null),
        source: "live",
      }
    }
    cards.push(row)
  }

  const totals = cards.reduce((acc: any, c: any) => ({
    total_transactions: acc.total_transactions + c.total_transactions,
    total_revenue: acc.total_revenue + c.total_revenue,
    verified_revenue: acc.verified_revenue + c.verified_revenue,
    pending_revenue: acc.pending_revenue + c.pending_revenue,
    unique_payers: acc.unique_payers + c.unique_payers,
  }), { total_transactions: 0, total_revenue: 0, verified_revenue: 0, pending_revenue: 0, unique_payers: 0 })

  return NextResponse.json({ totals, events: cards, at: new Date().toISOString() })
}
