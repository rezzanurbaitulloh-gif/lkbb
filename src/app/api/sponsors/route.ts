import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"

// Sponsor aktif publik — dipakai footer & halaman kompetisi.
// Menghormati toggle sponsors.enabled dari site_settings.
export async function GET() {
  try {
    const service = createServiceSupabase()
    const { data: flag } = await service.from("site_settings").select("value").eq("key", "sponsors.enabled").maybeSingle()
    const raw = (flag as any)?.value
    const str = typeof raw === "string" ? raw : (raw != null ? String(raw) : "true")
    const enabled = !/^(false|0|"|')/i.test(str.trim())
    if (!enabled) return NextResponse.json({ enabled: false, sponsors: [] })
    const { data } = await service.from("sponsors").select("id,name,tier,logo_url,url").eq("active", true).order("display_order", { ascending: true })
    return NextResponse.json({ enabled: true, sponsors: data || [] })
  } catch (e: any) {
    return NextResponse.json({ enabled: false, sponsors: [] })
  }
}
