import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  // Event-aware: super admin sees all, event admin sees own event
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  let eventId: string | null = null
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}
  const url = new URL(req.url)
  const qEventId = url.searchParams.get("event_id")
  const isSuper = await (await import("@/lib/event")).isSuperAdmin(auth.user!.id)
  let filterEventId: string | null = eventId
  if (qEventId === "all" && isSuper) filterEventId = null
  else if (qEventId && qEventId !== "all") filterEventId = qEventId
  let q = service.from("cms_pages").select("*").order("sort_order", { ascending: true })
  if (filterEventId) q = (q as any).eq("event_id", filterEventId)
  const { data: pages, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // enrich with sections count
  const { data: counts } = await service.from("cms_sections").select("page_id")
  const countMap: Record<string, number> = {}
  for (const r of (counts as any) || []) countMap[r.page_id] = (countMap[r.page_id] || 0) + 1

  const enriched = (pages as any[]).map((p) => ({ ...p, sections_count: countMap[p.id] || 0 }))
  return NextResponse.json({ pages: enriched })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const body = await req.json()
  const { slug, title, description, is_system, is_published, seo_title, seo_description, seo_image, sort_order } = body

  if (!slug || !title) return NextResponse.json({ error: "slug & title wajib" }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "slug hanya huruf kecil, angka, strip" }, { status: 400 })

  const { data, error } = await service
    .from("cms_pages")
    .insert({
      slug: slug.toLowerCase().trim(),
      title: title.trim(),
      description: description || null,
      is_system: !!is_system,
      is_published: is_published !== false,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      seo_image: seo_image || null,
      sort_order: parseInt(sort_order) || 0,
      created_by: auth.user!.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "page", entity_id: (data as any).id, action: "create", after: data, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_page_create", target: (data as any).id, details: { slug } })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const body = await req.json()
  const { id, slug, title, description, is_published, seo_title, seo_description, seo_image, sort_order } = body
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })

  const { data: before } = await service.from("cms_pages").select("*").eq("id", id).single()

  const patch: any = {}
  if (slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "slug tidak valid" }, { status: 400 })
    patch.slug = slug.toLowerCase().trim()
  }
  if (title !== undefined) patch.title = title
  if (description !== undefined) patch.description = description
  if (is_published !== undefined) patch.is_published = !!is_published
  if (seo_title !== undefined) patch.seo_title = seo_title
  if (seo_description !== undefined) patch.seo_description = seo_description
  if (seo_image !== undefined) patch.seo_image = seo_image
  if (sort_order !== undefined) patch.sort_order = parseInt(sort_order) || 0

  const { data, error } = await service.from("cms_pages").update(patch).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "page", entity_id: id, action: "update", before, after: data, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_page_update", target: id, details: patch })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })

  const { data: page } = await service.from("cms_pages").select("is_system, slug").eq("id", id).single()
  if ((page as any)?.is_system) return NextResponse.json({ error: "Halaman sistem tidak boleh dihapus" }, { status: 400 })

  const { error } = await service.from("cms_pages").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "page", entity_id: id, action: "delete", before: page, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_page_delete", target: id })
  return NextResponse.json({ ok: true })
}
