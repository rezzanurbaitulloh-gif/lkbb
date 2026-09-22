import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// POST /api/admin/members — buat akun pengguna baru + keanggotaan event.
// Super: event mana saja. Admin: hanya event sendiri.
// Body: { email, password, name?, event_id, role?: "USER"|"ADMIN" }
export async function POST(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const { email, password, name, event_id, role } = body
  if (!email || !password || !event_id) {
    return NextResponse.json({ error: "email, password & event_id wajib" }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 })
  }
  const wantRole = role === "ADMIN" ? "ADMIN" : "USER"
  if (!ctx.isSuper && !ctx.eventIds.includes(event_id)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  const service = createServiceSupabase()

  // Email belum terdaftar?
  const { data: existingProfile } = await service.from("profiles").select("id").ilike("email", String(email).trim()).maybeSingle()
  let userId: string
  if (existingProfile) {
    userId = (existingProfile as any).id
  } else {
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: { public_name: name || String(email).split("@")[0] },
    })
    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message || "Gagal membuat akun" }, { status: 500 })
    }
    userId = created.user.id
    await service.from("profiles").upsert({
      id: userId,
      email: String(email).trim(),
      public_name: name || String(email).split("@")[0],
      role: "USER",
    }, { onConflict: "id" })
  }

  // Proteksi: target super tidak bisa diubah
  const { data: isSuperTarget } = await service.from("platform_roles").select("user_id").eq("user_id", userId).maybeSingle()
  if (isSuperTarget) {
    return NextResponse.json({ error: "Akun SUPER_ADMIN tidak bisa diubah" }, { status: 403 })
  }

  const { data: member, error: memErr } = await service.from("event_members").upsert({
    event_id, user_id: userId, role: wantRole, status: "active",
  }, { onConflict: "event_id,user_id" }).select().single()
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
  await service.from("audit_logs").insert({
    user_id: ctx.userId, action: existingProfile ? "event_member_add" : "account_create",
    target: userId, details: { event_id, role: wantRole, created: !existingProfile }, event_id,
  } as any)
  return NextResponse.json({ ok: true, user_id: userId, created: !existingProfile, member })
}
