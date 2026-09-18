import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const supabase = await createServerSupabase()
  // Resolve event from host
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  let eventId: string | null = null
  let event: any = null
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const r = await resolveEventFromHost(host)
    eventId = r.eventId
    event = r.event
    // Fallback to competitions for state if events not yet has state
    if (!event) {
      const { data: comp } = await supabase.from("competitions").select("state, show_provisional_result, show_final_result").order("created_at", { ascending: false }).limit(1).single()
      event = comp
    }
  } catch {
    const { data: comp } = await supabase.from("competitions").select("state, show_provisional_result, show_final_result").order("created_at", { ascending: false }).limit(1).single()
    event = comp
  }
  const state = (event?.status || event?.state) as string
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const showRanking = isVotingClosed || isPublished
  // BELUM DIMULAI & AKTIF: ranking tidak tampil — return urut nomor per kategori (nomor urut = urutan tampil)
  if (!showRanking) {
    let q = supabase.from("peletons").select("id,slug,number,name,school,category,image_url,logo_url,display_order,event_id").eq("active", true).eq("verified", true).order("category", { ascending: true }).order("number", { ascending: true })
    if (category) q = q.eq("category", category)
    if (eventId) q = q.eq("event_id", eventId)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const sorted = (data||[]).sort((a:any,b:any)=>{
      if(a.category!==b.category) return String(a.category).localeCompare(String(b.category))
      return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
    })
    return NextResponse.json(sorted.map((row: any) => ({
      rank: null,
      ...row,
    })))
  }
  // VOTING_DITUTUP: ranking online saja, HASIL_DIPUBLIKASIKAN: ranking overall — secondary sort nomor urut
  const orderField = isPublished ? "total_ballots" : "online_ballots"
  let query = supabase.from("team_ranking").select("*").order(orderField as any, { ascending: false }).order("number", { ascending: true })
  if (category) query = query.eq("category", category)
  if (eventId) query = query.eq("event_id", eventId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // fallback numeric sort for text number
  const ranked = (data||[]).sort((a:any,b:any)=>{
    const av = (a as any)[orderField]||0, bv = (b as any)[orderField]||0
    if(bv!==av) return bv-av
    return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
  })
  const sanitized = ranked?.map((row: any, idx: number) => ({
    rank: idx + 1,
    id: row.id,
    slug: row.slug,
    number: row.number,
    name: row.name,
    school: row.school,
    category: row.category,
    image_url: row.image_url,
    logo_url: row.logo_url,
    display_order: row.display_order,
    // Untuk VOTING_DITUTUP tampilkan online saja, untuk HASIL_DIPUBLIKASIKAN tampil total
    online_ballots: row.online_ballots,
    total_ballots: isPublished ? row.total_ballots : undefined,
    offline_ballots: isPublished ? row.offline_ballots : undefined,
  }))
  return NextResponse.json(sanitized)
}
