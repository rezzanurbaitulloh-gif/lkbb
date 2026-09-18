import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") // SMP or SMA
  const orderBy = searchParams.get("orderBy") // display_order or ranking
  const supabase = await createServerSupabase()
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  let eventId: string | null = null
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
  } catch {}

  if (orderBy === "ranking") {
    // Use team_ranking view for performance-based order — secondary sort = nomor urut per kategori
    let query = supabase.from("team_ranking").select("*")
    if (category) query = query.eq("category", category)
    if (eventId) query = query.eq("event_id", eventId)
    query = query.order("total_ballots", { ascending: false }).order("number", { ascending: true })
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // JS fallback: urut numeric number if number stored as text "01"
    const sorted = (data||[]).sort((a:any,b:any)=>{
      if((b.total_ballots||0)!==(a.total_ballots||0)) return (b.total_ballots||0)-(a.total_ballots||0)
      return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
    })
    return NextResponse.json(sorted)
  }

  // Default: nomor urut tampil per kategori — SMP 1.., SMA 1.. terpisah, bukan global display_order
  let query = supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("category", { ascending: true }).order("number", { ascending: true })
  if (category) query = query.eq("category", category)
  if (eventId) query = query.eq("event_id", eventId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const sorted = (data||[]).sort((a:any,b:any)=>{
    if(a.category!==b.category) return String(a.category).localeCompare(String(b.category))
    return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
  })
  return NextResponse.json(sorted)
}
