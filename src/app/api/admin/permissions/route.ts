import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

// GET — list permissions + role_permissions matrix + users list for assignment
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!["ADMIN","SUPER_ADMIN"].includes(auth.user!.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const service = createServiceSupabase()
  const [perms, rolePerms, profiles, userPerms] = await Promise.all([
    service.from("permissions").select("*").order("category", { ascending: true }).order("key", { ascending: true }),
    service.from("role_permissions").select("*"),
    service.from("profiles").select("id,email,public_name,role").order("role", { ascending: true }),
    service.from("user_permissions").select("*"),
  ])
  if (perms.error) return NextResponse.json({ error: perms.error.message }, { status: 500 })
  return NextResponse.json({
    permissions: perms.data || [],
    role_permissions: rolePerms.data || [],
    profiles: profiles.data || [],
    user_permissions: userPerms.data || [],
  })
}

// PATCH role_permissions
// body: { role, permission_key, granted } or { updates: [{role,permission_key,granted}] }
export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!["ADMIN","SUPER_ADMIN"].includes(auth.user!.role || "")) return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  const service = createServiceSupabase()
  const body = await req.json()

  const updates: any[] = Array.isArray(body.updates) ? body.updates : [body]
  for (const u of updates) {
    if (!u.role || !u.permission_key) continue
    const { error } = await service.from("role_permissions").upsert({
      role: u.role,
      permission_key: u.permission_key,
      granted: !!u.granted,
    }, { onConflict: "role,permission_key" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "permissions_update", target: "role_permissions", details: { updates } })
  return NextResponse.json({ ok: true })
}

// POST/DELETE user_permissions override
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!["ADMIN","SUPER_ADMIN"].includes(auth.user!.role || "")) return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  const service = createServiceSupabase()
  const { user_id, permission_key, granted } = await req.json()
  if (!user_id || !permission_key) return NextResponse.json({ error: "user_id & permission_key wajib" }, { status: 400 })
  const { data, error } = await service.from("user_permissions").upsert({
    user_id, permission_key, granted: !!granted,
  }, { onConflict: "user_id,permission_key" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "user_permission_upsert", target: user_id, details: { permission_key, granted } })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!["ADMIN","SUPER_ADMIN"].includes(auth.user!.role || "")) return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")
  const permission_key = searchParams.get("permission_key")
  if (!user_id || !permission_key) return NextResponse.json({ error: "user_id & permission_key wajib" }, { status: 400 })
  const { error } = await service.from("user_permissions").delete().eq("user_id", user_id).eq("permission_key", permission_key)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "user_permission_delete", target: user_id, details: { permission_key } })
  return NextResponse.json({ ok: true })
}
