import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  const url = new URL(req.url)
  const qSlug = url.searchParams.get("event") || url.searchParams.get("event_slug") || url.searchParams.get("slug")
  const qId = url.searchParams.get("event_id")
  // Try query param first (for vercel.app preview)
  if (qId && qId !== "all") {
    const { data: ev } = await supabase.from("events").select("*").eq("id", qId).maybeSingle()
    if (ev) return NextResponse.json(ev)
  }
  if (qSlug) {
    const { data: ev } = await supabase.from("events").select("*").eq("slug", qSlug).maybeSingle()
    if (ev) return NextResponse.json(ev)
  }
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const { event } = await resolveEventFromHost(host)
    if (event) return NextResponse.json(event)
  } catch {}
  // Fallback to competitions for compatibility
  const { data, error } = await supabase.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
