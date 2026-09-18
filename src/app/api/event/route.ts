import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
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
