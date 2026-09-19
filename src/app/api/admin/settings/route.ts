import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// GET all site_settings (grouped by category)
// Matriks: SUPER semua; ADMIN hanya baris event sendiri.
export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  let q: any = service.from("site_settings").select("*").order("category", { ascending: true }).order("key", { ascending: true })
  if (!ctx.isSuper) q = q.in("event_id", ctx.eventIds)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // group by category for convenience
  const grouped: Record<string, any[]> = {}
  for (const row of (data as any) || []) {
    const cat = row.category || "general"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(row)
  }
  // also map key->value
  const map: Record<string, any> = {}
  for (const row of (data as any) || []) map[row.key] = (row as any).value

  return NextResponse.json({ settings: data, grouped, map })
}

// Tentukan event target tulis untuk ADMIN (super: global/per-event bebas).
function resolveTargetEvent(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, bodyEventId: string | null | undefined): string | null | { error: string } {
  if (ctx.isSuper) return bodyEventId || null
  if (bodyEventId) {
    if (!ctx.eventIds.includes(bodyEventId)) return { error: "Forbidden — di luar event Anda" }
    return bodyEventId
  }
  if (ctx.eventIds.length === 1) return ctx.eventIds[0]
  return { error: "event_id wajib (Anda mengelola lebih dari satu event)" }
}

async function writeOne(service: any, ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, u: any) {
  if (!u.key) return { skipped: true }
  const target = resolveTargetEvent(ctx, u.event_id || null)
  if (typeof target !== "string" && target !== null) return { error: (target as any).error }
  const targetEventId = target as string | null
  // Kompatibilitas: super tanpa event_id memakai perilaku global lama.
  if (ctx.isSuper && !targetEventId) {
    const { data, error } = await service.from("site_settings").upsert({
      key: u.key, value: u.value, category: u.category || "general",
      description: u.description, is_public: u.is_public !== undefined ? !!u.is_public : true,
      updated_by: ctx.userId,
    }, { onConflict: "key" }).select().single()
    if (error) return { error: error.message }
    await service.from("audit_logs").insert({ user_id: ctx.userId, action: "site_setting_update", target: u.key, details: { value: u.value } })
    return { data }
  }
  // Hindari tabrakan key global: cari baris key+event milik sendiri dulu.
  let q: any = service.from("site_settings").select("id,event_id").eq("key", u.key)
  if (targetEventId) q = q.eq("event_id", targetEventId)
  else q = q.is("event_id", null)
  const { data: existing } = await q.maybeSingle()
  if (existing) {
    if (!ctx.isSuper && (existing as any).event_id && !ctx.eventIds.includes((existing as any).event_id)) {
      return { error: "Forbidden — di luar event Anda" }
    }
    const payload: any = { value: u.value, updated_by: ctx.userId }
    if (u.category !== undefined) payload.category = u.category
    if (u.description !== undefined) payload.description = u.description
    if (u.is_public !== undefined) payload.is_public = !!u.is_public
    const { data, error } = await service.from("site_settings").update(payload).eq("id", (existing as any).id).select().single()
    if (error) return { error: error.message }
    await service.from("audit_logs").insert({ user_id: ctx.userId, action: "site_setting_update", target: u.key, details: { value: u.value }, event_id: (existing as any).event_id || targetEventId } as any)
    return { data }
  }
  const { data, error } = await service.from("site_settings").insert({
    key: u.key,
    value: u.value,
    category: u.category || "general",
    description: u.description,
    is_public: u.is_public !== undefined ? !!u.is_public : true,
    event_id: targetEventId,
    updated_by: ctx.userId,
  }).select().single()
  if (error) return { error: error.message }
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "site_setting_update", target: u.key, details: { value: u.value }, event_id: targetEventId } as any)
  return { data }
}

// PATCH bulk or single: { key, value, category?, description?, is_public?, event_id? } OR { updates: [...] }
export async function PATCH(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const body = await req.json()

  // bulk
  if (Array.isArray(body.updates)) {
    const results = []
    for (const u of body.updates as any[]) {
      if (!u.key) continue
      const r = await writeOne(service, ctx, { ...u, event_id: u.event_id || body.event_id })
      if ((r as any).error) return NextResponse.json({ error: (r as any).error }, { status: 403 })
      if ((r as any).data) results.push((r as any).data)
    }
    return NextResponse.json({ ok: true, updated: results })
  }

  // single
  const { key, value, category, description, is_public, event_id } = body
  if (!key) return NextResponse.json({ error: "key wajib" }, { status: 400 })

  const r = await writeOne(service, ctx, { key, value, category, description, is_public, event_id })
  if ((r as any).error) {
    const msg = (r as any).error as string
    return NextResponse.json({ error: msg }, { status: msg.startsWith("Forbidden") ? 403 : 500 })
  }
  const data = (r as any).data
  await service.from("cms_revisions").insert({ entity_type: "setting", entity_id: (data as any).id, action: "update", after: data, changed_by: ctx.userId })

  return NextResponse.json(data)
}

// POST create new custom setting
export async function POST(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const body = await req.json()
  const { key, value, category, description, is_public, event_id } = body
  if (!key || value === undefined) return NextResponse.json({ error: "key & value wajib" }, { status: 400 })
  if (!/^[a-z0-9._-]+$/.test(key)) return NextResponse.json({ error: "key hanya a-z 0-9 . _ -" }, { status: 400 })

  const target = resolveTargetEvent(ctx, event_id || null)
  if (typeof target !== "string" && target !== null) return NextResponse.json({ error: (target as any).error }, { status: 403 })

  const { data, error } = await service.from("site_settings").insert({
    key: key.toLowerCase().trim(),
    value,
    category: category || "general",
    description: description || null,
    is_public: is_public !== false,
    event_id: target as string | null,
    updated_by: ctx.userId,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "site_setting_create", target: key, event_id: target as string | null } as any)
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const event_id = searchParams.get("event_id")
  if (!key) return NextResponse.json({ error: "key wajib" }, { status: 400 })

  let q: any = service.from("site_settings").select("id,is_system,event_id").eq("key", key)
  if (!ctx.isSuper) {
    q = q.in("event_id", ctx.eventIds)
  } else if (event_id) {
    q = q.eq("event_id", event_id)
  }
  const { data: existing } = await q.maybeSingle()
  if (!existing) return NextResponse.json({ error: "Setting tidak ditemukan / di luar akses" }, { status: 404 })
  if ((existing as any)?.is_system) return NextResponse.json({ error: "Setting sistem tidak boleh dihapus" }, { status: 400 })

  const { error } = await service.from("site_settings").delete().eq("id", (existing as any).id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: ctx.userId, action: "site_setting_delete", target: key, event_id: (existing as any).event_id } as any)
  return NextResponse.json({ ok: true })
}
