import { NextResponse } from "next/server"
import { createStaticSupabase } from "@/lib/supabase"
import { resolveEventFromHost } from "@/lib/event"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createStaticSupabase()

  // Terisolasi per event (dari host); fallback global hanya bila event tak teresolusi.
  let eventId: string | null = null
  try {
    const host = req.headers.get("host") || req.headers.get("x-forwarded-host") || ""
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}
  let pq: any = supabase.from("cms_pages").select("*").eq("slug", slug).eq("is_published", true)
  if (eventId) pq = pq.eq("event_id", eventId)
  let { data: page, error } = await pq.maybeSingle()
  if (!page && eventId) {
    const fb = await supabase.from("cms_pages").select("*").eq("slug", slug).eq("is_published", true).maybeSingle()
    page = fb.data as any
    error = fb.error as any
  }
  if (error || !page) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  const { data: sections } = await supabase
    .from("cms_sections")
    .select("*")
    .eq("page_id", (page as any).id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })

  return NextResponse.json({ page, sections: sections || [] })
}
