import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getUserAndRole() {
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
  if (!user) return { user: null, role: null, supabase }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return { user, role: profile?.role || null, supabase }
}

export async function POST(req: Request) {
  try {
    const { user, role } = await getUserAndRole()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN","SUPER_ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { peleton_id, supports, note } = body
    if (!peleton_id || !supports || typeof supports !== "number" || supports === 0) {
      return NextResponse.json({ error: "Invalid peleton_id or supports" }, { status: 400 })
    }
    if (supports < -10000 || supports > 10000) return NextResponse.json({ error: "Supports out of range -10000..10000" }, { status: 400 })
    if (supports !== Math.floor(supports)) return NextResponse.json({ error: "Supports must be integer" }, { status: 400 })

    const service = createServiceSupabase()
    // Validate peleton
    const { data: peleton } = await service.from("peletons").select("id").eq("id", peleton_id).single()
    if (!peleton) return NextResponse.json({ error: "Peleton not found" }, { status: 404 })

    // Price from DB
    const { data: event } = await service.from("competitions").select("settings").order("created_at", { ascending: false }).limit(1).single()
    const offlinePrice = event?.settings?.offline_price ?? 5000
    const amount = Math.abs(supports) * offlinePrice

    const transactionId = crypto.randomUUID()
    const { data: inserted, error } = await service.from("supports").insert({
      peleton_id,
      transaction_id: transactionId,
      amount: supports > 0 ? amount : 0,
      supports,
      source: "offline",
      note: note || null,
      admin_id: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log server-side
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "offline_recap_add",
      target: peleton_id,
      details: { supports, note, amount, peleton_id },
    })

    return NextResponse.json({ ok: true, data: inserted })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { user, role } = await getUserAndRole()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["ADMIN","SUPER_ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const url = new URL(req.url)
  const limit = Math.min(100, parseInt(url.searchParams.get("limit")||"50")||50)
  const all = url.searchParams.get("all") === "true"
  // Isolasi: tiap admin lihat hanya offline miliknya, tidak gabung; ?all=true untuk audit semua
  let query = service.from("supports").select("*, peletons(number,name, category)").eq("source", "offline").order("created_at", { ascending: false }).limit(limit)
  if (!all) query = query.eq("admin_id", user.id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  try {
    const { user, role } = await getUserAndRole()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN","SUPER_ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await req.json()
    const { id, supports, note } = body
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (supports === undefined || supports === null || typeof supports !== "number" || !Number.isInteger(supports) || supports === 0 || supports < -10000 || supports > 10000) {
      return NextResponse.json({ error: "Supports must be integer -10000..10000 and !=0" }, { status: 400 })
    }
    const service = createServiceSupabase()
    const { data: existing } = await service.from("supports").select("id, peleton_id, supports, note, amount, source, admin_id").eq("id", id).eq("source", "offline").single()
    if (!existing) return NextResponse.json({ error: "Offline record not found" }, { status: 404 })
    // Isolasi per-admin: hanya pemilik yang boleh ubah
    if ((existing as any).admin_id && (existing as any).admin_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: bukan milik Anda" }, { status: 403 })
    }
    const { data: event } = await service.from("competitions").select("settings").order("created_at", { ascending: false }).limit(1).single()
    const offlinePrice = event?.settings?.offline_price ?? 5000
    const amount = Math.abs(supports) * offlinePrice
    const { data: updated, error } = await service.from("supports").update({ supports, amount: supports>0 ? amount : 0, note: note ?? existing.note }).eq("id", id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "offline_recap_update",
      target: id,
      details: { before: { supports: existing.supports, note: existing.note }, after: { supports, note }, amount, peleton_id: existing.peleton_id },
    })
    return NextResponse.json({ ok: true, data: updated })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, role } = await getUserAndRole()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN","SUPER_ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const bodyIds = url.searchParams.get("ids")
    // Support ?ids=id1,id2 and JSON body {ids:[]}
    let ids: string[] = []
    if (id) ids = [id]
    else if (bodyIds) ids = bodyIds.split(",").filter(Boolean)
    else {
      try {
        const b = await req.json()
        if (b?.ids) ids = Array.isArray(b.ids) ? b.ids : [b.ids]
        else if (b?.id) ids = [b.id]
      } catch {}
    }
    if (ids.length===0) return NextResponse.json({ error: "Missing id(s)" }, { status: 400 })
    const service = createServiceSupabase()
    // Fetch for audit before delete — isolasi per-admin
    const { data: rows } = await service.from("supports").select("id, peleton_id, supports, note, admin_id").in("id", ids).eq("source","offline")
    if (!rows || rows.length===0) return NextResponse.json({ error: "No offline records found" }, { status: 404 })
    // Hanya boleh hapus milik sendiri
    const notOwned = rows.filter((r: any) => r.admin_id && r.admin_id !== user.id)
    if (notOwned.length > 0) return NextResponse.json({ error: "Forbidden: ada data bukan milik Anda" }, { status: 403 })
    const { error } = await service.from("supports").delete().in("id", ids).eq("source","offline").eq("admin_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    for (const r of rows) {
      await service.from("audit_logs").insert({
        user_id: user.id,
        action: "offline_recap_delete",
        target: r.id,
        details: { deleted: r, bulk: ids.length>1 },
      })
    }
    return NextResponse.json({ ok: true, deleted: rows.length, ids })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
