import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"
import { resolveEventFromHost } from "@/lib/event"

// Daftar pengguna TERBATAS event saat ini (bukan global):
// - hanya user yang terasosiasi ke event (login/daftar di domain ini = baris event_members,
//   atau dijadikan admin event ini)
// - akun SUPER_ADMIN platform selalu disembunyikan (termasuk dari super yang membuka halaman ini)
// Login tetap global: user web lain bisa login di sini, lalu otomatis tercatat (track-event)
// dan barulah tampil di daftar ini.
export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const hdrs = await headers()
  const host = hdrs.get("host") || hdrs.get("x-forwarded-host")
  const { eventId, event } = await resolveEventFromHost(host)
  const service = createServiceSupabase()

  let scopeIds: string[]
  if (ctx.isSuper) {
    if (eventId) {
      scopeIds = [eventId]
    } else {
      const { data: evs } = await service.from("events").select("id")
      scopeIds = ((evs as any[]) || []).map((e: any) => e.id)
    }
  } else {
    scopeIds = eventId ? ctx.eventIds.filter((id) => id === eventId) : [...ctx.eventIds]
    if (scopeIds.length === 0) return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  if (scopeIds.length === 0) return NextResponse.json({ members: [], event: event ? { id: event.id, slug: event.slug, name: event.name } : null })

  const { data: members, error } = await service
    .from("event_members")
    .select("id,event_id,user_id,role,status,created_at")
    .in("event_id", scopeIds)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set(((members as any[]) || []).map((m: any) => m.user_id))]
  let profMap: Record<string, any> = {}
  let superIds = new Set<string>()
  if (userIds.length > 0) {
    const [{ data: profs }, { data: plats }] = await Promise.all([
      service.from("profiles").select("id,email,public_name,role,created_at").in("id", userIds),
      service.from("platform_roles").select("user_id").in("user_id", userIds),
    ])
    for (const p of (plats as any[]) || []) superIds.add(p.user_id)
    for (const p of (profs as any[]) || []) profMap[p.id] = p
  }
  let evMap: Record<string, any> = {}
  if (ctx.isSuper && !eventId) {
    const { data: evs } = await service.from("events").select("id,slug,name").in("id", scopeIds)
    for (const e of (evs as any[]) || []) evMap[e.id] = e
  } else if (event) {
    evMap[event.id] = { id: event.id, slug: event.slug, name: event.name }
  }

  // Sembunyikan super admin platform dari daftar.
  const rows = ((members as any[]) || []).filter(
    (m: any) => !superIds.has(m.user_id) && profMap[m.user_id]?.role !== "SUPER_ADMIN"
  ).map((m: any) => ({ ...m, profile: profMap[m.user_id] || null, event: evMap[m.event_id] || null }))

  return NextResponse.json({
    members: rows,
    event: event ? { id: event.id, slug: event.slug, name: event.name } : null,
  })
}
