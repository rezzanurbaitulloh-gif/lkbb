import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// Kelola SUPER_ADMIN platform — matriks: hanya SUPER_ADMIN.
export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx?.isSuper) return NextResponse.json({ error: "Forbidden — khusus SUPER_ADMIN" }, { status: 403 })
  const service = createServiceSupabase()
  const { data: rows } = await service.from("platform_roles").select("user_id,role,created_at").eq("role", "SUPER_ADMIN")
  const ids = ((rows as any[]) || []).map((r: any) => r.user_id)
  let users: Record<string, any> = {}
  if (ids.length > 0) {
    const { data: profs } = await service.from("profiles").select("id,email,public_name,role").in("id", ids)
    for (const p of (profs as any[]) || []) users[p.id] = p
  }
  return NextResponse.json({ supers: rows || [], users })
}

export async function POST(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx?.isSuper) return NextResponse.json({ error: "Forbidden — khusus SUPER_ADMIN" }, { status: 403 })
  const service = createServiceSupabase()
  const body = await req.json()
  const { user_id, email } = body
  let targetId = user_id
  if (!targetId && email) {
    const { data: prof } = await service.from("profiles").select("id").ilike("email", String(email).trim()).maybeSingle()
    if (!prof) return NextResponse.json({ error: "Pengguna dengan email tersebut tidak ditemukan" }, { status: 404 })
    targetId = (prof as any).id
  }
  if (!targetId) return NextResponse.json({ error: "user_id atau email wajib" }, { status: 400 })
  const { error } = await service.from("platform_roles").upsert({ user_id: targetId, role: "SUPER_ADMIN" }, { onConflict: "user_id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("profiles").update({ role: "SUPER_ADMIN" }).eq("id", targetId)
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "super_admin_add", target: targetId } as any)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx?.isSuper) return NextResponse.json({ error: "Forbidden — khusus SUPER_ADMIN" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")
  if (!user_id) return NextResponse.json({ error: "user_id wajib" }, { status: 400 })
  if (user_id === ctx.userId) return NextResponse.json({ error: "Tidak bisa mencabut diri sendiri" }, { status: 400 })
  const { data: rows } = await service.from("platform_roles").select("user_id").eq("role", "SUPER_ADMIN")
  if (((rows as any[]) || []).length <= 1) {
    return NextResponse.json({ error: "Minimal satu SUPER_ADMIN harus tersisa" }, { status: 400 })
  }
  const { error } = await service.from("platform_roles").delete().eq("user_id", user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("profiles").update({ role: "ADMIN" }).eq("id", user_id)
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "super_admin_remove", target: user_id } as any)
  return NextResponse.json({ ok: true })
}
