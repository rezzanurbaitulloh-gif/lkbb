import Link from "next/link"
import { createServerSupabase } from "@/lib/supabase"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"

export const revalidate = 0

export default async function TimPage(){
  const supabase = await createServerSupabase()
  const { data: event } = await supabase.from("competitions").select("state, show_provisional_result, show_final_result").order("created_at", { ascending: false }).limit(1).single()
  // Fetch background: tim-specific, fallback to hero background (beranda)
  let timBg: string | null = null
  let heroBg: string | null = null
  try {
    const { data: rows } = await supabase.from("site_settings").select("key,value").in("key", ["tim.background_image","hero.background_image"])
    for(const r of (rows as any)||[]){
      let v = (r as any).value
      if(typeof v === "string") v = v.replace(/^"|"$/g,"")
      else if(typeof v === "object" && v?.value) v = String(v.value).replace(/^"|"$/g,"")
      else v = String(v).replace(/^"|"$/g,"")
      if(r.key === "tim.background_image" && v) timBg = v
      if(r.key === "hero.background_image" && v) heroBg = v
    }
  } catch {}
  const state = (event?.state as string) || "NOT_STARTED"
  const isNotStarted = state === "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const showRanking = isVotingClosed || isPublished
  // Podium end-user disembunyikan saat hasil final (sudah gabung rekap offline)

  // Ambil data — urutan berdasar poin tertinggi (bukan nomor urut)
  // Selalu pakai team_ranking order by total_ballots desc (atau online_ballots saat voting closed)
  let smp: any[] = []
  let sma: any[] = []
  if (isVotingClosed) {
    const { data } = await supabase.from("team_ranking").select("*").order("online_ballots", { ascending: false })
    smp = (data||[]).filter(p=>p.category==='SMP')
    sma = (data||[]).filter(p=>p.category==='SMA')
  } else {
    // Untuk semua state lain (NOT_STARTED, ACTIVE, PUBLISHED) pakai total_ballots tertinggi di atas
    const { data } = await supabase.from("team_ranking").select("*").order("total_ballots", { ascending: false })
    if (data && data.length > 0) {
      smp = data.filter(p=>p.category==='SMP')
      sma = data.filter(p=>p.category==='SMA')
    } else {
      // Fallback jika team_ranking kosong (belum ada support) — ambil peletons lalu urutkan by support 0 (tetap pakai number sebagai secondary)
      const { data: fallback } = await supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("number", { ascending: true })
      smp = (fallback||[]).filter(p=>p.category==='SMP')
      sma = (fallback||[]).filter(p=>p.category==='SMA')
    }
  }

  const renderGrid = (teams: any[]) => {
    return (
      <div className="flex flex-col gap-2">
        {teams.map((p:any)=> {
          const logo = p.logo_url || p.image_url || "/assets/brand/lkbb-logo.jpg"
          const number = String(p.number || "").padStart(2,"0")
          const total = Number(p.total_ballots ?? p.online_ballots ?? 0)
          return (
            <Link key={p.id} href={`/tim/${p.slug}`} className="group flex items-center justify-between gap-2.5 xs:gap-3 rounded-[12px] xs:rounded-xl border border-white/10 bg-white/5 backdrop-blur px-2.5 xs:px-3 sm:px-4 py-2.5 xs:py-3 hover:border-primary/20 hover:bg-white/5 backdrop-blur/20 transition-colors min-w-0">
              <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                <span className="shrink-0 rounded-full bg-primary px-2 xs:px-2.5 py-1 text-[10px] xs:text-[11px] font-black tracking-widest text-black">#{number}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] xs:text-sm sm:text-[15px] font-black tracking-tight truncate">{p.name}</div>
                  <div className="text-[10px] xs:text-[11px] font-bold tracking-wide text-white/50 tabular-nums">{total.toLocaleString("id-ID")} ballot</div>
                </div>
              </div>
              <div className="flex items-center gap-2 xs:gap-3 shrink-0">
                <div className="text-right hidden xs:block">
                  <div className="text-[11px] xs:text-xs font-black tabular-nums text-white">{total.toLocaleString("id-ID")}</div>
                  <div className="text-[9px] xs:text-[10px] font-bold tracking-widest text-white/40">TOTAL</div>
                </div>
                <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 bg-transparent shrink-0 grid place-items-center">
                  <img src={logo} alt={p.name} className="h-full w-full object-contain bg-transparent" loading="lazy" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  // Skema warna status end-user: aktif & final = hijau glassmorph teks putih,
  // voting ditutup = kuning glassmorph teks putih. (teks di span dalam agar tak kena override global)
  const getHeaderBadge = () => {
    if (isNotStarted) return { label: "Belum Dimulai", box: "bg-primary border-primary shadow-sm", text: "text-black" }
    if (isActive) return { label: "Aktif — Dukungan Dibuka", box: "bg-emerald-500/10 border-emerald-500/20 backdrop-blur shadow-sm", text: "text-white" }
    if (isVotingClosed) return { label: "Voting Ditutup", box: "bg-amber-500/10 border-amber-500/20 backdrop-blur shadow-sm", text: "text-white" }
    if (isPublished) return { label: "Hasil Dipublikasikan", box: "bg-emerald-500/10 border-emerald-500/20 backdrop-blur shadow-sm", text: "text-white" }
    return { label: state, box: "bg-primary border-primary", text: "text-black" }
  }
  const headerBadge = getHeaderBadge()

  const bgImage = timBg || heroBg || "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=1600&auto=format&fit=crop&q=60"
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.18]"><img src={bgImage} alt="" className="h-full w-full object-cover" /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-transparent" />
          <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6 xs:py-7 sm:py-8">
            <div className={`inline-flex rounded-full px-2.5 xs:px-3 py-1 text-[11px] xs:text-xs font-black tracking-wide border ${headerBadge.box}`}><span className={headerBadge.text}>{headerBadge.label}</span></div>
            <h1 className="mt-2.5 xs:mt-3 text-[22px] xs:text-[26px] sm:text-[28px] md:text-[34px] lg:text-[36px] font-black tracking-[-0.03em] leading-[0.92] break-words">{isPublished ? "TANGGA JUARA" : isVotingClosed ? "PERINGKAT SEMENTARA" : "DAFTAR TIM"}</h1>
          </div>
        </div>

        {/* Podium disembunyikan di halaman end-user saat hasil final */}

        {/* SMP */}
        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6 xs:py-7 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 xs:gap-2.5 mb-3 xs:mb-4">
            <span className="inline-flex rounded-full border border-white/12 bg-white/5 backdrop-blur px-2.5 xs:px-3 py-1 text-[11px] xs:text-xs font-bold tracking-wide text-white">SMP / SEDERAJAT</span>
            {isVotingClosed && <span className="inline-flex rounded-full border border-white/10 bg-white/5 backdrop-blur px-2 xs:px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">ONLINE SAJA</span>}
            {isPublished && <span className="inline-flex rounded-full border border-primary bg-primary px-2 xs:px-2.5 py-1 text-[10px] font-black tracking-wide text-black">FINAL</span>}
            <span className="text-[11px] xs:text-xs text-muted-foreground tabular-nums border border-white/10 bg-white/5 backdrop-blur px-2 py-1 rounded-full text-white">{smp.length} tim</span>
          </div>
          {smp.length===0 ? <div className="rounded-xl border border-dashed border-white/10 p-6 xs:p-8 text-center text-[13px] xs:text-sm text-muted-foreground">Belum ada peleton SMP.</div> : renderGrid(smp)}
        </div>

        {/* SMA */}
        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 pb-8 xs:pb-10">
          <div className="flex flex-wrap items-center gap-2 xs:gap-2.5 mb-3 xs:mb-4">
            <span className="inline-flex rounded-full border border-white/12 bg-white/5 backdrop-blur px-2.5 xs:px-3 py-1 text-[11px] xs:text-xs font-bold tracking-wide text-white">SMA / SEDERAJAT</span>
            {isVotingClosed && <span className="inline-flex rounded-full border border-white/10 bg-white/5 backdrop-blur px-2 xs:px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">ONLINE SAJA</span>}
            {isPublished && <span className="inline-flex rounded-full border border-primary bg-primary px-2 xs:px-2.5 py-1 text-[10px] font-black tracking-wide text-black">FINAL</span>}
            <span className="text-[11px] xs:text-xs text-muted-foreground tabular-nums border border-white/10 bg-white/5 backdrop-blur px-2 py-1 rounded-full text-white">{sma.length} tim</span>
          </div>
          {sma.length===0 ? <div className="rounded-xl border border-dashed border-white/10 p-6 xs:p-8 text-center text-[13px] xs:text-sm text-muted-foreground">Belum ada peleton SMA.</div> : renderGrid(sma)}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
