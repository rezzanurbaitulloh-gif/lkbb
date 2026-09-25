import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// Kelola ADMIN event — matriks: SUPER semua event, ADMIN hanya event sendiri.
// (Halaman /admin/access memakai ini untuk peran ADMIN; matriks global tetap super-only.)
export async function GET(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const qEventId = searchParams.get("event_id")
  let eventIds = ctx.isSuper ? null : [...ctx.eventIds]
  if (qEventId) {
    if (!ctx.isSuper && !ctx.eventIds.includes(qEventId)) {
      return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
    }
    eventIds = [qEventId]
  }
  let q: any = service.from("event_members").select("id,event_id,user_id,role,status,created_at").order("created_at", { ascending: false })
  if (eventIds) q = q.in("event_id", eventIds)
  const { data: members, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const userIds = [...new Set(((members as any[]) || []).map((m: any) => m.user_id))]
  let users: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profs } = await service.from("profiles").select("id,email,public_name,role").in("id", userIds)
    for (const p of (profs as any[]) || []) users[p.id] = p
  }
  let events: Record<string, any> = {}
  const needEvents = [...new Set(((members as any[]) || []).map((m: any) => m.event_id))]
  if (needEvents.length > 0) {
    const { data: evs } = await service.from("events").select("id,slug,name").in("id", needEvents)
    for (const e of (evs as any[]) || []) events[e.id] = e
  }
  return NextResponse.json({ members: members || [], users, events })
}

export async function POST(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const body = await req.json()
  const { event_id, user_id, email, role } = body
  if (!event_id) return NextResponse.json({ error: "event_id wajib" }, { status: 400 })
  if (!ctx.isSuper && !ctx.eventIds.includes(event_id)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  let targetUserId = user_id
  if (!targetUserId && email) {
    const { data: prof } = await service.from("profiles").select("id").ilike("email", String(email).trim()).maybeSingle()
    if (!prof) return NextResponse.json({ error: "Pengguna dengan email tersebut tidak ditemukan" }, { status: 404 })
    targetUserId = (prof as any).id
  }
  if (!targetUserId) return NextResponse.json({ error: "user_id atau email wajib" }, { status: 400 })
  // Peran event ADMIN/USER (SUPER via platform_roles terpisah; trigger DB menolak super).
  const memberRole = role === "USER" ? "USER" : "ADMIN"
  const { data, error } = await service.from("event_members").upsert({
    event_id, user_id: targetUserId, role: memberRole, status: "active",
  }, { onConflict: "event_id,user_id" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: memberRole === "ADMIN" ? "event_admin_add" : "event_user_set", target: targetUserId, details: { event_id, role: memberRole }, event_id } as any)
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })
  const { data: row } = await service.from("event_members").select("id,event_id,user_id").eq("id", id).maybeSingle()
  if (!row) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
  if (!ctx.isSuper && !ctx.eventIds.includes((row as any).event_id)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  const { error } = await service.from("event_members").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "event_admin_remove", target: (row as any).user_id, details: { event_id: (row as any).event_id }, event_id: (row as any).event_id } as any)
  return NextResponse.json({ ok: true })
}
