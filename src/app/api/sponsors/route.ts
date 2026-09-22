import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { resolveEventFromHost } from "@/lib/event"

// Sponsor aktif publik — dipakai footer & halaman kompetisi.
// TERISOLASI per event (dari host); menghormati toggle sponsors.enabled event itu.
export async function GET(req: Request) {
  try {
    const service = createServiceSupabase()
    let eventId: string | null = null
    try {
      const host = req.headers.get("host") || req.headers.get("x-forwarded-host") || ""
      const r = await resolveEventFromHost(host)
      eventId = r.eventId
    } catch {}
    let flagQ: any = service.from("site_settings").select("value").eq("key", "sponsors.enabled")
    if (eventId) flagQ = flagQ.eq("event_id", eventId)
    const { data: flag } = await flagQ.maybeSingle()
    const raw = (flag as any)?.value
    const str = typeof raw === "string" ? raw : (raw != null ? String(raw) : "true")
    const enabled = !/^(false|0|"|')/i.test(str.trim())
    if (!enabled) return NextResponse.json({ enabled: false, sponsors: [] })
    let sq: any = service.from("sponsors").select("id,name,tier,logo_url,url").eq("active", true).order("display_order", { ascending: true })
    if (eventId) sq = sq.eq("event_id", eventId)
    const { data } = await sq
    return NextResponse.json({ enabled: true, sponsors: data || [] })
  } catch (e: any) {
    return NextResponse.json({ enabled: false, sponsors: [] })
  }
}
