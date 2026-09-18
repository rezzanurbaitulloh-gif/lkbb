import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
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
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const showRank = isVotingClosed || isPublished

  const orderField = isPublished ? "total_ballots" : isVotingClosed ? "online_ballots" : "total_ballots"
  const { data: ranking } = await supabase.from("team_ranking").select("*").eq("category", peleton.category).order(orderField as any, { ascending: false })
  const rankIndex = (ranking || []).findIndex((r:any)=> r.id === peleton.id)
  const rank = rankIndex >= 0 ? rankIndex + 1 : null

  const photo = peleton.image_url
  const logo = (peleton as any).logo_url || peleton.image_url
  const supportUrl = `/dukungan?peleton=${peleton.slug}`

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        {/* Back */}
        <div className="container-editorial pt-6">
          <Link href="/tim" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Participants
          </Link>
        </div>

        {/* Number + Photo — photo dominant */}
        <div className="container-editorial mt-4 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-start">
          <div>
            <div className="number-display">{String(peleton.number).padStart(2,"0")}</div>
            <h1 className="mt-2 font-display font-bold text-[36px] lg:text-[48px] leading-[0.9] tracking-[-0.03em]">{peleton.name}</h1>
            <div className="mt-2 meta-label">{peleton.school} • {peleton.city} • {peleton.category}</div>
            <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-muted-foreground">{peleton.description}</p>

            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold tracking-wide">#{peleton.number}</span>
              <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold tracking-wide">{peleton.category}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">AKTIF</span>
            </div>

            {showRank && rank && (
              <div className="mt-6 inline-flex items-center gap-2 border border-border px-3 py-2 text-xs">
                <span className="meta-label">Rank #{rank}</span>
                <span className="text-muted-foreground">• {peleton.category}</span>
              </div>
            )}
          </div>

          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img src={photo} alt={peleton.name} className="h-full w-full object-cover" />
            <div className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-bold tracking-widest border border-border">#{peleton.number}</div>
            {showRank && rank && <div className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">RANK #{rank}</div>}
          </div>
        </div>

        {/* Support — main event interaction */}
        <div className="container-editorial mt-12 border-y border-border py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="meta-label">SUPPORT THIS TEAM</div>
            <h2 className="mt-2 font-display font-bold text-2xl tracking-[-0.02em]">Dukung {peleton.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Pilih jumlah ballot, lihat total, lanjutkan ke pembayaran.</p>

            <div className="mt-6 grid grid-cols-3 gap-3 max-w-[360px] mx-auto">
              {[10,50,100].map(n=> (
                <Link key={n} href={`${supportUrl}&qty=${n}`} className="h-12 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors text-sm font-bold">
                  {n}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Link href={supportUrl} className="inline-flex h-11 items-center justify-center rounded-full bg-primary text-primary-foreground px-8 text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors">
                DUKUNG PELETON INI
              </Link>
              <ShareButtons profileUrl={`/tim/${peleton.slug}`} supportUrl={supportUrl} />
            </div>

            <div className="mt-6 hairline" />
            <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs">
              <span><b className="text-foreground">Sekolah:</b> {peleton.school}</span>
              <span><b className="text-foreground">Kota:</b> {peleton.city} • {peleton.province}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="container-editorial py-8 grid md:grid-cols-2 gap-6">
          <div className="border border-border p-4">
            <div className="meta-label">Tentang Peleton</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{peleton.description} Peleton ini menjunjung tinggi disiplin, kekompakan, dan kebanggaan sekolah.</p>
          </div>
          <div className="border border-border p-4">
            <div className="meta-label">Informasi Kompetisi</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nomor Peserta</span><span className="font-bold">#{peleton.number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kategori</span><span className="font-bold">{peleton.category}</span></div>
              <div className="hairline my-2" />
              <p className="text-xs leading-relaxed text-muted-foreground">Nomor urut tampil tim dan ranking adalah konsep berbeda. #{peleton.number} tetap #{peleton.number} meskipun memimpin klasemen.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
