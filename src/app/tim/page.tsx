import Link from "next/link"
import { createServerSupabase } from "@/lib/supabase"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
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
    const { data } = await supabase.from("competitions").select("state, show_provisional_result, show_final_result").order("created_at", { ascending: false }).limit(1).single()
    event = data
  }
  const state = (event?.state as string) || "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"

  let smp: any[] = []
  let sma: any[] = []
  if (isVotingClosed) {
    let q = supabase.from("team_ranking").select("*").order("online_ballots", { ascending: false })
    if (eventId) q = (q as any).eq("event_id", eventId)
    const { data } = await q
    smp = (data||[]).filter(p=>p.category==='SMP')
    sma = (data||[]).filter(p=>p.category==='SMA')
  } else {
    let q2 = supabase.from("team_ranking").select("*").order("total_ballots", { ascending: false })
    if (eventId) q2 = (q2 as any).eq("event_id", eventId)
    const { data } = await q2
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
  }

  const renderList = (teams: any[]) => {
    const showCount = isVotingClosed
    return (
      <div className="divide-y divide-border">
        {teams.map((p:any)=> {
          const logo = p.logo_url || p.image_url || "/assets/brand/lkbb-logo.jpg"
          const number = String(p.number || "").padStart(2,"0")
          const count = Number(p.online_ballots ?? 0)
          return (
            <Link key={p.id} href={`/tim/${p.slug}`} className="group flex items-center gap-4 py-4 hover:bg-muted/50 transition-colors -mx-4 px-4">
              <span className="font-display font-light text-[32px] tracking-[-0.03em] text-muted-foreground group-hover:text-foreground transition-colors tabular-nums">{number}</span>
              <div className="h-10 w-10 shrink-0 border border-border bg-muted grid place-items-center overflow-hidden">
                <img src={logo} alt="" className="h-full w-full object-contain" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-sm tracking-[-0.01em] truncate">{p.name}</div>
                <div className="meta-label truncate">{p.school} • {p.category}</div>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                {showCount ? (
                  <>
                    <div className="text-sm font-bold tabular-nums">{count.toLocaleString("id-ID")}</div>
                    <div className="meta-label">ballot sementara</div>
                  </>
                ) : (
                  <div className="meta-label">#{number}</div>
                )}
              </div>
              <span className="hidden sm:inline text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="container-editorial pt-8">
          <div className="meta-label">02 — Participants</div>
          <h1 className="mt-2 font-display font-bold text-[36px] lg:text-[48px] leading-[0.9] tracking-[-0.03em]">
            THE<br />PARTICIPANTS
          </h1>
          <div className="mt-3 h-px w-12 bg-primary" />
        </div>

        <div className="container-editorial mt-10">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-display font-bold text-lg tracking-[-0.01em]">SMP / SEDERAJAT</h2>
            <span className="meta-label">{smp.length} tim</span>
          </div>
          {smp.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border">Belum ada peleton SMP.</p> : renderList(smp)}
        </div>

        <div className="container-editorial mt-12">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-display font-bold text-lg tracking-[-0.01em]">SMA / SEDERAJAT</h2>
            <span className="meta-label">{sma.length} tim</span>
          </div>
          {sma.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border">Belum ada peleton SMA.</p> : renderList(sma)}
        </div>

        <div className="container-editorial py-8">
          <div className="hairline" />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground max-w-2xl">
            Nomor peserta (`#01`, `#02`) adalah nomor urut tampil, bukan ranking. Peringkat berdasarkan dukungan akan tampil saat voting ditutup.
          </p>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
