import { createServerSupabase } from "@/lib/supabase"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { ParticipantsBoard } from "@/components/tim/ParticipantsBoard"
import { headers } from "next/headers"

export const revalidate = 0

export default async function TimPage(){
  const supabase = await createServerSupabase()
  const hdrs = await headers()
  const host = hdrs.get("host") || hdrs.get("x-forwarded-host") || ""
  let event: any = null
  let eventId: string | null = null
  try {
    const { resolveEventFromHost } = await import("@/lib/event")
    const r = await resolveEventFromHost(host)
    event = r.event
    eventId = r.eventId
  } catch {}
  if (!event) {
    const { data } = await supabase.from("competitions").select("state").order("created_at", { ascending: false }).limit(1).single()
    event = data
  }

  let smp: any[] = []
  let sma: any[] = []
  let q = supabase.from("team_ranking").select("*").order("total_ballots", { ascending: false })
  if (eventId) q = (q as any).eq("event_id", eventId)
  const { data } = await q
  if (data && data.length > 0) {
    smp = data.filter(p=>p.category==='SMP')
    sma = data.filter(p=>p.category==='SMA')
  } else {
    let fq = supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("number", { ascending: true })
    if (eventId) fq = (fq as any).eq("event_id", eventId)
    const { data: fallback } = await fq
    smp = (fallback||[]).filter(p=>p.category==='SMP')
    sma = (fallback||[]).filter(p=>p.category==='SMA')
  }

  // Tanpa data demo/fallback gambar stock: kalau DB kosong, tampilkan empty state jujur.

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A09] text-[#F2F0E9]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <ParticipantsBoard smp={smp} sma={sma} />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
