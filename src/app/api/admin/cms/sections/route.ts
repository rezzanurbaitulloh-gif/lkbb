import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { rowInScope } from "@/lib/permissions"

// GET ?page_id=xxx or ?slug=home
export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const page_id = searchParams.get("page_id")
  const slug = searchParams.get("slug")

  let pid = page_id
  if (!pid && slug) {
    const { data: page } = await service.from("cms_pages").select("id").eq("slug", slug).single()
    pid = (page as any)?.id || null
  }
  if (!pid) return NextResponse.json({ error: "page_id atau slug wajib" }, { status: 400 })

  const { data, error } = await service
    .from("cms_sections")
    .select("*")
    .eq("page_id", pid)
    .order("sort_order", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sections: data })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const body = await req.json()
  const { page_id, slug, key, title, type, is_visible, sort_order, settings, content } = body
  let pid = page_id
  if (!pid && slug) {
    const { data: page } = await service.from("cms_pages").select("id").eq("slug", slug).single()
    pid = (page as any)?.id
  }
  if (!pid) return NextResponse.json({ error: "page_id / slug wajib" }, { status: 400 })
  if (!key || !title || !type) return NextResponse.json({ error: "key, title, type wajib" }, { status: 400 })
  if (!/^[a-z0-9_-]+$/.test(key)) return NextResponse.json({ error: "key hanya huruf kecil, angka, _ -" }, { status: 400 })

  // auto sort_order = max+1 if not provided
  let order = parseInt(sort_order)
  if (isNaN(order)) {
    const { data: maxRow } = await service.from("cms_sections").select("sort_order").eq("page_id", pid).order("sort_order", { ascending: false }).limit(1).single()
    order = ((maxRow as any)?.sort_order ?? 0) + 1
  }

  const { data: parentPage } = await service.from("cms_pages").select("event_id").eq("id", pid).single()
  if (!parentPage) return NextResponse.json({ error: "Halaman tidak ditemukan" }, { status: 404 })
  if (!rowInScope(auth.ctx!, (parentPage as any)?.event_id)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  const { data, error } = await service
    .from("cms_sections")
    .insert({
      event_id: (parentPage as any)?.event_id || null,
      page_id: pid,
      key: key.toLowerCase().trim(),
      title,
      type,
      is_visible: is_visible !== false,
      sort_order: order,
      settings: settings || {},
      content: content || {},
      created_by: auth.user!.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "section", entity_id: (data as any).id, action: "create", after: data, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_section_create", target: (data as any).id, details: { page_id: pid, key, type } })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const body = await req.json()
  const { id, key, title, type, is_visible, sort_order, settings, content } = body
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })

  const { data: before } = await service.from("cms_sections").select("*").eq("id", id).single()
  if (!before) return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 })
  let secEvent = (before as any)?.event_id || null
  if (!secEvent && (before as any)?.page_id) {
    const { data: sp } = await service.from("cms_pages").select("event_id").eq("id", (before as any).page_id).single()
    secEvent = (sp as any)?.event_id || null
  }
  if (!rowInScope(auth.ctx!, secEvent)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  const patch: any = {}
  if (key !== undefined) {
    if (!/^[a-z0-9_-]+$/.test(key)) return NextResponse.json({ error: "key tidak valid" }, { status: 400 })
    patch.key = key.toLowerCase().trim()
  }
  if (title !== undefined) patch.title = title
  if (type !== undefined) patch.type = type
  if (is_visible !== undefined) patch.is_visible = !!is_visible
  if (sort_order !== undefined) patch.sort_order = parseInt(sort_order) || 0
  if (settings !== undefined) patch.settings = settings
  if (content !== undefined) patch.content = content

  const { data, error } = await service.from("cms_sections").update(patch).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "section", entity_id: id, action: "update", before, after: data, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_section_update", target: id, details: patch })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })

  const { data: before } = await service.from("cms_sections").select("*").eq("id", id).single()
  if (!before) return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 })
  let delEvent = (before as any)?.event_id || null
  if (!delEvent && (before as any)?.page_id) {
    const { data: sp } = await service.from("cms_pages").select("event_id").eq("id", (before as any).page_id).single()
    delEvent = (sp as any)?.event_id || null
  }
  if (!rowInScope(auth.ctx!, delEvent)) {
    return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
  }
  const { error } = await service.from("cms_sections").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("cms_revisions").insert({ entity_type: "section", entity_id: id, action: "delete", before, changed_by: auth.user!.id })
  await service.from("audit_logs").insert({ user_id: auth.user!.id, action: "cms_section_delete", target: id })
  return NextResponse.json({ ok: true })
}
