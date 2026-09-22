import { NextResponse } from "next/server"
import { createStaticSupabase } from "@/lib/supabase"
import { resolveEventFromHost } from "@/lib/event"

// Public — list published pages with visible section count, TERISOLASI per event.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const includeSections = searchParams.get("include") === "sections"

  const supabase = createStaticSupabase()
  let eventId: string | null = null
  try {
    const host = req.headers.get("host") || req.headers.get("x-forwarded-host") || ""
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}
  let pq: any = supabase
    .from("cms_pages")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  if (eventId) pq = pq.eq("event_id", eventId)
  const { data: pages, error } = await pq

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!includeSections) {
    return NextResponse.json({ pages })
  }

  // include visible sections per page
  const ids = (pages || []).map((p: any) => p.id)
  if (ids.length === 0) return NextResponse.json({ pages: [] })

  const { data: sections } = await supabase
    .from("cms_sections")
    .select("*")
    .in("page_id", ids)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })

  const grouped: Record<string, any[]> = {}
  for (const s of (sections as any) || []) {
    if (!grouped[s.page_id]) grouped[s.page_id] = []
    grouped[s.page_id].push(s)
  }

  const enriched = (pages as any[]).map((p) => ({ ...p, sections: grouped[p.id] || [] }))
  return NextResponse.json({ pages: enriched })
}
