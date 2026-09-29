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

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 30) || "user"
}

// Tambah akun baru langsung ke event ini — boleh oleh ADMIN event (bukan cuma super).
// Role hanya USER / ADMIN event ini. SUPER_ADMIN tidak bisa dibuat dari sini.
export async function POST(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const hdrs = await headers()
  const host = hdrs.get("host") || hdrs.get("x-forwarded-host")
  const { eventId, event } = await resolveEventFromHost(host)
  const body = await req.json().catch(() => ({}))
  const rawName = String(body.name || "").trim()
  const rawPassword = String(body.password || "")
  const memberRole = body.role === "ADMIN" ? "ADMIN" : "USER"
  if (!rawName || rawName.length < 3) return NextResponse.json({ error: "Nama minimal 3 karakter." }, { status: 400 })
  if (rawName.length > 30) return NextResponse.json({ error: "Nama maksimal 30 karakter." }, { status: 400 })
  if (!/^[a-zA-Z0-9 _-]+$/.test(rawName)) return NextResponse.json({ error: "Nama hanya boleh huruf, angka, spasi, - dan _" }, { status: 400 })
  if (!rawPassword || rawPassword.length < 6) return NextResponse.json({ error: "Kata sandi minimal 6 karakter." }, { status: 400 })

  const service = createServiceSupabase()
  // Event tujuan: event saat ini; admin biasa hanya boleh event miliknya.
  let targetEventId = eventId
  if (!ctx.isSuper) {
    if (!targetEventId || !ctx.eventIds.includes(targetEventId)) {
      if (ctx.eventIds.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      targetEventId = ctx.eventIds[0]
    }
  }
  if (!targetEventId) return NextResponse.json({ error: "Event tidak ditemukan untuk domain ini." }, { status: 400 })

  const { data: existing } = await service.from("profiles").select("id").ilike("public_name", rawName).limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Nama tersebut sudah digunakan. Silakan gunakan nama lain." }, { status: 409 })
  }
  let slug = slugify(rawName)
  let email = `${slug}@lkbb.local`
  let attempt = 0
  while (attempt < 5) {
    const { data: emailExists } = await service.from("profiles").select("id").eq("email", email).limit(1)
    if (!emailExists || emailExists.length === 0) break
    attempt++
    email = `${slug}${attempt}@lkbb.local`
  }
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email, password: rawPassword, email_confirm: true, user_metadata: { public_name: rawName },
  })
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message || "Gagal membuat akun." }, { status: 400 })
  }
  await service.from("profiles").upsert({ id: created.user.id, email, public_name: rawName, role: "USER" }, { onConflict: "id" })
  const { error: memErr } = await service.from("event_members").upsert(
    { event_id: targetEventId, user_id: created.user.id, role: memberRole, status: "active" },
    { onConflict: "event_id,user_id" }
  )
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
  try {
    await service.from("audit_logs").insert({ user_id: ctx.userId, action: "event_user_create", target: created.user.id, details: { event_id: targetEventId, role: memberRole }, event_id: targetEventId } as any)
  } catch {}
  return NextResponse.json({ ok: true, user_id: created.user.id, event: event ? { id: event.id, slug: event.slug } : { id: targetEventId } })
}
