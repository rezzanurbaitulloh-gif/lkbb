import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"
import { resolveEventFromHost } from "@/lib/event"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabase()
  // Terisolasi per event (dari host); fallback global hanya bila event tak teresolusi.
  let eventId: string | null = null
  try {
    const host = req.headers.get("host") || req.headers.get("x-forwarded-host") || ""
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}
  let q: any = supabase.from("peletons").select("*").eq("slug", slug).eq("verified", true).eq("active", true)
  if (eventId) q = q.eq("event_id", eventId)
  let { data, error } = await q.maybeSingle()
  if (!data && eventId) {
    const fb = await supabase.from("peletons").select("*").eq("slug", slug).eq("verified", true).eq("active", true).maybeSingle()
    data = fb.data as any
    error = fb.error as any
  }
  if (error || !data) return NextResponse.json({ error: error?.message || "Tidak ditemukan" }, { status: 404 })
  return NextResponse.json(data)
}
