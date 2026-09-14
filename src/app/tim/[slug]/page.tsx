import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { createServerSupabase, createStaticSupabase } from "@/lib/supabase"
import { ShareButtons } from "@/components/tim/ShareButtons"

export const revalidate = 0

export async function generateStaticParams(){
  const supabase = createStaticSupabase()
  const { data } = await supabase.from("peletons").select("slug").eq("verified", true).eq("active", true)
  return (data || []).map((p:any)=> ({ slug: p.slug }))
}

export default async function PeletonDetail({ params }: { params: Promise<{slug:string}> }){
  const { slug } = await params
  const supabase = await createServerSupabase()
  const { data: peleton } = await supabase.from("peletons").select("*").eq("slug", slug).eq("verified", true).eq("active", true).single()
  if(!peleton) return notFound()

  const { data: event } = await supabase.from("competitions").select("state, show_provisional_result, show_final_result").order("created_at", { ascending: false }).limit(1).single()
  const state = (event?.state as string) || "NOT_STARTED"
  const isNotStarted = state === "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const showRank = isVotingClosed || isPublished
  const showSementara = isVotingClosed
  const showFinal = isPublished

  // Ranking: VOTING_CLOSED -> online saja, RESULT_PUBLISHED -> total
  const orderField = isPublished ? "total_ballots" : isVotingClosed ? "online_ballots" : "total_ballots"
  const { data: ranking } = await supabase.from("team_ranking").select("*").eq("category", peleton.category).order(orderField as any, { ascending: false })
  const rankIndex = (ranking || []).findIndex((r:any)=> r.id === peleton.id)
  const rank = rankIndex >= 0 ? rankIndex + 1 : null

  const photo = peleton.image_url
  const logo = (peleton as any).logo_url || peleton.image_url
  const profileUrl = `/tim/${peleton.slug}`
  const supportUrl = `/dukungan?peleton=${peleton.slug}`

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="relative border-b border-white/10 overflow-hidden bg-[#09090b] text-white">
          <div className="absolute inset-0">
            <img src={photo} alt="" className="h-full w-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/70 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 md:py-10">
            <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-end">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-white/10 bg-white/5 backdrop-blur shadow-elevated">
                <img src={photo} alt={peleton.name} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3 rounded-full bg-[#0B0C0F] px-3 py-1 text-xs font-black tracking-widest border border-white/10">#{peleton.number}</div>
                {showRank && rank && <div className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1 text-xs font-black text-black">Peringkat #{rank}</div>}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white/5 backdrop-blur border border-white/10 text-white">{peleton.category}</Badge>
                  <Badge variant="outline" className="bg-white/5 backdrop-blur border border-white/10 text-white">{peleton.city} • {peleton.province}</Badge>
                </div>
                <div className="mt-3 flex gap-3 items-center">
                  <img src={logo} alt="logo" className="h-14 w-14 object-contain bg-transparent hidden md:block drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }} />
                  <div>
                    <h1 className="text-[28px] md:text-[36px] font-black tracking-[-0.03em] leading-none text-balance">{peleton.name}</h1>
                    <p className="mt-1 text-sm font-medium text-white/70">{peleton.school}</p>
                    {showSementara && <span className="mt-2 inline-flex rounded-full bg-[#FACC15] text-black px-2.5 py-1 text-[10px] font-black">HASIL SEMENTARA</span>}
                    {showFinal && <span className="mt-2 inline-flex rounded-full bg-primary text-black px-2.5 py-1 text-[10px] font-black">HASIL FINAL</span>}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/60 text-pretty max-w-2xl">{peleton.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={supportUrl}><Button size="lg" className="rounded-full px-8 h-[46px] font-bold border border-white/10 bg-white/5 backdrop-blur text-white hover:bg-white/10 hover:border-white/12 hover:text-white">DUKUNG PELETON INI</Button></Link>
                  {showRank && <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 text-xs font-bold text-white">RANK #{rank}</span>}
                </div>
                <div className="mt-6 flex gap-3 max-w-lg">
                  <div className="flex-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur p-3 text-center shadow-sm">
                    <div className="text-[11px] font-bold tracking-widest text-white/70">NOMOR PESERTA</div>
                    <div className="text-sm font-black text-white">#{peleton.number}</div>
                  </div>
                  <div className="flex-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur p-3 text-center shadow-sm">
                    <div className="text-[11px] font-bold tracking-widest text-white/70">KATEGORI</div>
                    <div className="text-sm font-black text-white">{peleton.category}</div>
                  </div>
                  <div className="flex-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur p-3 text-center shadow-sm">
                    <div className="text-[11px] font-bold tracking-widest text-white/70">STATUS</div>
                    <div className="text-sm font-black text-primary">AKTIF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <section className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-sm font-black tracking-tight">Tentang Peleton</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{peleton.description} Peleton ini menjunjung tinggi disiplin, kekompakan, dan kebanggaan sekolah.</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/5 backdrop-blur p-3"><div className="label-ceremonial">Sekolah</div><div className="font-semibold">{peleton.school}</div></div>
                <div className="rounded-xl bg-white/5 backdrop-blur p-3"><div className="label-ceremonial">Kota / Provinsi</div><div className="font-semibold">{peleton.city} • {peleton.province}</div></div>
              </div>
            </section>

            <section className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-sm font-black tracking-tight flex items-center gap-2"><Trophy className="h-4 w-4 text-muted-foreground"/> Informasi Kompetisi</h2>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 p-3 text-sm bg-white/5 backdrop-blur"><div className="font-bold text-foreground">Nomor Peserta</div><div className="text-muted-foreground">#{peleton.number} — nomor urut tampil tim</div></div>
                <div className="rounded-xl border border-white/10 p-3 text-sm bg-white/5 backdrop-blur"><div className="font-bold text-foreground">Kategori</div><div className="text-muted-foreground">{peleton.category} / SEDERAJAT</div></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Nomor urut tampil tim dan ranking adalah konsep berbeda. #{peleton.number} tetap #{peleton.number} meskipun memimpin klasemen.</p>
            </section>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-[76px] h-fit">
            <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5 flex flex-col gap-4">
              <h3 className="text-sm font-black">Dukungan</h3>
              <div className="flex flex-col gap-4">
                {showRank && rank ? (
                  <div className="flex items-center justify-between rounded-xl bg-white/5 backdrop-blur p-3 border border-white/10">
                    <span className="text-sm text-white/70">Peringkat ({peleton.category})</span>
                    <span className="text-sm font-black text-white">#{rank}</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center backdrop-blur">
                    <div className="text-[11px] font-bold tracking-widest text-amber-300">Klasemen Disembunyikan</div>
                    <p className="text-xs font-medium text-amber-100/90">Ballot disembunyikan selama voting aktif.</p>
                  </div>
                )}
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3 text-center flex flex-col gap-1">
                  <div className="text-[11px] font-bold tracking-widest text-white/60">Status Kompetisi</div>
                  <div className="inline-flex self-center rounded-full px-3 py-1 text-xs font-bold border backdrop-blur" style={{background: isActive ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.04)", color: isActive ? "rgb(134,239,172)" : "rgba(255,255,255,0.85)", borderColor: isActive ? "rgba(34,197,94,0.22)" : "rgba(255,255,255,0.08)"}}>
                    {isNotStarted ? "Belum Dimulai" : isActive ? "Aktif" : isVotingClosed ? "Voting Ditutup" : isPublished ? "Hasil Dipublikasikan" : state}
                  </div>
                  {isVotingClosed && <div className="inline-flex self-center rounded-full bg-[#FACC15] text-black px-2.5 py-1 text-[10px] font-black">Peringkat Online Saja</div>}
                  {isPublished && <div className="inline-flex self-center rounded-full bg-primary text-black px-2.5 py-1 text-[10px] font-black">Peringkat Akhir</div>}
                </div>
                <Link href={supportUrl}><Button variant="outline" className="w-full rounded-full h-[44px] font-bold border border-white/10 bg-white/5 backdrop-blur text-white hover:bg-white/10 hover:border-white/12 hover:text-white">DUKUNG</Button></Link>
                <ShareButtons profileUrl={profileUrl} supportUrl={supportUrl} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
