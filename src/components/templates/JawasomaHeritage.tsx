"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CaraDukungDialog } from "@/components/home/CaraDukungDialog"
import { ShareButtons } from "@/components/tim/ShareButtons"
import { ShareSheet } from "@/components/share/ShareSheet"
import { useToast } from "@/components/ui/toast"
import { Share2, QrCode } from "lucide-react"

function IconSearch(p:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>}
function IconUsers(p:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
function IconAward(p:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 15a5 5 0 100-10 5 5 0 000 10z"/><path d="M9 15l-2 5 5-2 5 2-2-5"/></svg>}
function IconGift(p:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 8v12"/><path d="M20 8H4v4h16z"/><path d="M4 8c0-2 2-4 4-4s4 2 4 4"/><path d="M12 8c0-2 2-4 4-4s4 2 4 4"/></svg>}
function IconFAQ(p:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>}

const fallbackPeserta = [
  { n:"01", name:"SMA N 1 Kertosono", sub:"Putra • Kertosono", vote:"12.430", img:"https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&auto=format&fit=crop&q=60" },
  { n:"02", name:"SMA N 2 Kediri", sub:"Putra • Kediri", vote:"10.243", img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=60" },
  { n:"03", name:"SMA N 3 Tulungagung", sub:"Putri • Tulungagung", vote:"9.876", img:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=60" },
  { n:"04", name:"SMA N 1 Blitar", sub:"Campuran • Blitar", vote:"8.542", img:"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=60" },
  { n:"05", name:"SMA N 1 Madiun", sub:"Putri • Madiun", vote:"7.921", img:"https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&auto=format&fit=crop&q=60" },
  { n:"06", name:"SMA N 2 Malang", sub:"Campuran • Malang", vote:"6.782", img:"https://images.unsplash.com/photo-1522543558187-00b65e9d00f5?w=600&auto=format&fit=crop&q=60" },
  { n:"07", name:"SMA N 1 Jombang", sub:"Putra • Jombang", vote:"5.421", img:"https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60" },
  { n:"08", name:"SMA N 1 Nganjuk", sub:"Putri • Nganjuk", vote:"4.983", img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=60" },
]
const fallbackBoard = [
  { r:1, name:"SMA N 1 Kertosono", sub:"Putra • Kertosono", vote:"12.430", pct:"18.6%" },
  { r:2, name:"SMA N 2 Kediri", sub:"Putra • Kediri", vote:"10.243", pct:"15.3%" },
  { r:3, name:"SMA N 3 Tulungagung", sub:"Putri • Tulungagung", vote:"9.876", pct:"14.8%" },
  { r:4, name:"SMA N 1 Blitar", sub:"Campuran • Blitar", vote:"8.542", pct:"12.8%" },
  { r:5, name:"SMA N 1 Madiun", sub:"Putri • Madiun", vote:"7.921", pct:"11.9%" },
]

function useCountdown(target: string | null){
  const calc = (t: number) => {
    const d = Math.max(0, t - Date.now())
    return {
      days: Math.floor(d/86400000),
      hours: Math.floor((d%86400000)/3600000),
      minutes: Math.floor((d%3600000)/60000),
      seconds: Math.floor((d%60000)/1000),
      total: d,
      expired: d <= 0,
    }
  }
  const getTime = (s: string | null) => {
    if(!s) return NaN
    const ms = new Date(s).getTime()
    return isNaN(ms) ? NaN : ms
  }
  const t = getTime(target)
  const isValid = !isNaN(t)
  const [diff, setDiff] = useState(() => isValid ? calc(t) : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: true })
  useEffect(()=>{
    if(!isValid || isNaN(t)) return
    setDiff(calc(t))
    const id=setInterval(()=> setDiff(calc(t)),1000)
    return ()=>clearInterval(id)
  },[target, t, isValid])
  return { ...diff, isValid, targetTime: t }
}

function PesertaCard({ p }: { p: { n:string; name:string; sub:string; vote:string|number; img:string; slug:string; id:string|number } }){
  const { toast } = useToast()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const profileUrl = `/tim/${p.slug}`
  const supportUrl = `/dukungan?team=${p.slug}`
  const handleShare = async (type: "profile" | "support") => {
    const url = `${window.location.origin}${type === "profile" ? profileUrl : supportUrl}`
    const title = type === "profile" ? `Profil ${p.name}` : `Dukung ${p.name} di JAWASOMA`
    if (navigator.share) {
      try { await navigator.share({ title, url }); toast({ title: "Berhasil dibagikan", variant: "success" }); return } catch {}
    }
    setShareUrl(url)
    setShareTitle(title)
    setShareOpen(true)
  }
  return (
    <article className="group overflow-hidden rounded-[14px] border bg-[#141210] hover:shadow-[0_0_20px_rgba(217,170,92,0.15)] transition" style={{borderColor:"rgba(255,255,255,0.08)"}}>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1C1914]">
        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#050403]/80 px-2 py-0.5 text-[11px] font-bold text-[#D9AA5C] border" style={{borderColor:"rgba(217,170,92,0.30)"}}> {p.n}</span>
        <button aria-label="Favorite" className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-white/70">♡</button>
        {p.img ? <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy"/> : <div className="h-full w-full grid place-items-center text-white/20 text-xs">No Image</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold leading-tight text-[#F2ECE1]">{p.name}</div>
        <div className="text-xs text-white/50">{p.sub}</div>
        <div className="mt-3 flex items-center justify-between">
          <Link href={supportUrl} className="rounded-full bg-[#E9C982] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#D9C08A]">Vote Sekarang</Link>
          <span className="text-xs text-white/50 inline-flex items-center gap-1">◎ {typeof p.vote==='number'?p.vote.toLocaleString("id-ID"):p.vote}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={() => handleShare("profile")} aria-label={`Bagikan profil ${p.name}`}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={() => handleShare("support")} aria-label={`Bagikan dukungan ${p.name}`}>
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} url={shareUrl} title={shareTitle} />
    </article>
  )
}

export function JawasomaHeritage({ peletons, event }: {peletons?:any[]; event?:any}={}){
  const isPreview = peletons===undefined
  const hasReal = !!(peletons && peletons.length>0)
  const toSlug = (p:any, i:number) => p.slug || String(p.id || p.number || i+1)
  const peserta = hasReal ? peletons!.slice(0,8).map((p:any,i:number)=>({n:String(p.number||i+1).padStart(2,"0"), name:p.name, sub:`${p.category||"Putra"} • ${p.city||p.school?.split(" ").pop()||"Kertosono"}`, vote: p.vote??p.total_ballots??p.online_ballots??0, img:p.image_url||p.image||"", slug: toSlug(p,i), id: p.id ?? p.number ?? i+1})) : (isPreview?fallbackPeserta.map((p,i)=>({...p, slug: String(i+1).padStart(2,"0"), id: i+1})):[])
  const board = hasReal ? [...peletons!].sort((a:any,b:any)=>Number(b.total_ballots??b.online_ballots??0)-Number(a.total_ballots??a.online_ballots??0)).slice(0,5).map((p:any,i:number)=>({r:i+1,name:p.name,sub:`${p.category||"Putra"} • ${p.city||"Kertosono"}`,vote:String(p.total_ballots??p.online_ballots??0),pct:`${((Number(p.total_ballots||0)/Math.max(1,peletons!.reduce((s:any,x:any)=>s+Number(x.total_ballots||0),0)))*100).toFixed(1)}%`})) : fallbackBoard
  const top = hasReal ? peletons![0] : null
  const [caraOpen, setCaraOpen] = useState(false)

  const state = (event?.state as string) || "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const isNotStarted = state === "NOT_STARTED"
  const canonicalTarget = (() => {
    if (isActive && event?.voting_end) return event.voting_end
    if (isNotStarted && event?.voting_start) return event.voting_start
    if (event?.event_date) {
      const d = String(event.event_date).slice(0,10)
      const tm = String(event.event_time || "08:00:00")
      return `${d}T${tm}+07:00`
    }
    return event?.voting_end || "2026-10-24T23:59:59+07:00"
  })()
  const cd = useCountdown(canonicalTarget)
  const countdownLabel = (() => {
    if (isActive) return "MENUJU PENUTUPAN VOTING"
    if (isNotStarted) return "MENUJU PEMBUKAAN VOTING"
    if (isClosed) return "VOTING DITUTUP"
    if (isPublished) return "ACARA SELESAI"
    return "EVENT DIMULAI DALAM"
  })()
  const showCountdown = (() => {
    if (!cd.isValid) return false
    if (cd.expired) return false
    if (isClosed || isPublished) return false
    return true
  })()

  return (
    <div className="min-h-screen bg-[#050403] text-[#F2ECE1] selection:bg-[#D9AA5C]/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant Garamond:wght@700;800&family=Manrope:wght@400;500;600;700&display=swap');`}</style>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050403]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-sm bg-[#D9AA5C] text-[10px] font-black text-black">◈</span>
            <span className="hidden sm:flex flex-col leading-none"><span className="font-[Cormorant_Garamond] text-[14px] font-extrabold tracking-[0.14em] text-[#F2ECE1]">JAWASOMA</span><span className="text-[9px] tracking-[0.18em] text-white/50 -mt-0.5">THE IMPRESSION 2026</span></span>
            <span className="sm:hidden font-[Cormorant_Garamond] text-sm font-bold text-[#F2ECE1]">JAWASOMA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-medium tracking-[0.06em] text-white/60">
            <Link href="/" className="text-[#F2ECE1] border-b border-[#D9AA5C] pb-0.5">Beranda</Link>
            <Link href="/tentang" className="hover:text-white">Tentang</Link>
            <Link href="/tim" className="hover:text-white">Peserta</Link>
            <Link href="/dukungan" className="hover:text-white">Voting</Link>
            <Link href="/kompetisi" className="hover:text-white">Hasil</Link>
            <Link href="/sponsor" className="hover:text-white">Sponsor</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button aria-label="Search" className="hidden sm:grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white"><IconSearch className="h-4 w-4"/></button>
            <Link href="/login" className="rounded-full bg-[#E9C982] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#D9C08A]">Masuk</Link>
            <button className="lg:hidden h-8 w-8 grid place-items-center rounded-full border border-white/10">≡</button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1518544866330-95a2f0664541?w=1600&auto=format&fit=crop&q=80" alt="" className="h-full w-full object-cover object-[50%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050403] via-[#050403]/55 to-[#050403]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050403] via-transparent to-black/20" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[380px] lg:block overflow-hidden opacity-[0.92]" aria-hidden>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg" alt="" className="h-full w-full object-cover" style={{filter:"sepia(1) hue-rotate(18deg) saturate(1.2) brightness(0.85)", mixBlendMode:"screen"}} />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#050403]/20 to-[#050403]" />
        </div>
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[42px] opacity-[0.14] overflow-hidden" aria-hidden>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/800px-Batik_Mega_Mendung.jpg" alt="" className="h-full w-full object-cover" style={{filter:"sepia(0.6) saturate(0.7) brightness(0.6)", mixBlendMode:"soft-light"}} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050403] to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6">
          <div className="pt-8 sm:pt-10 md:pt-14 pb-6 md:pb-8">
            <div className="mx-auto max-w-[720px] text-center flex flex-col items-center px-1">
              <div className="inline-flex max-w-full items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span className="h-px w-6 sm:w-8 bg-[#D9AA5C] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] sm:tracking-[0.18em] text-[#D9AA5C] break-words text-center">LKBB EVENT</span>
                <span className="h-px w-6 sm:w-8 bg-[#D9AA5C] shrink-0" />
              </div>
              <h1 className="mt-3 font-[Cormorant_Garamond] text-balance font-extrabold leading-[0.88] tracking-[-0.02em] text-center max-w-full break-words px-1">
                <span className="block text-[42px] xs:text-[48px] sm:text-[56px] md:text-[68px] lg:text-[76px] xl:text-[84px] leading-[0.88] text-[#F2ECE1]" style={{textShadow:"0 2px 20px rgba(0,0,0,0.8)"}}>JAWASOMA</span>
                <span className="mt-2 block text-[13px] xs:text-[14px] sm:text-[15px] font-[Manrope] font-semibold tracking-[0.28em] text-[#E9C982]">THE IMPRESSION 2026</span>
              </h1>
              <div className="mt-3 text-center max-w-full space-y-1">
                <div className="text-[11px] sm:text-[13px] font-bold tracking-[0.14em] sm:tracking-[0.18em] text-white break-words">Langkah Tegas <span className="text-[#D9AA5C]">•</span> Jiwa Ksatria</div>
                <div className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.14em] text-[#D9AA5C] font-bold break-words">UNTUK NEGERI YANG LEBIH BAIK</div>
                <div className="text-[11px] sm:text-[12px] font-medium tracking-wide text-white/60 break-words">24 Oktober 2026 • Kertosono, Jawa Timur</div>
              </div>
              <div className="mt-5 xs:mt-6 flex flex-col xs:flex-row flex-wrap gap-2.5 sm:gap-3 justify-center items-center w-full xs:w-auto px-1 xs:px-0">
                <Link href="/dukungan" className="w-full xs:w-auto">
                  <Button size="lg" className="w-full xs:w-auto rounded-full px-6 xs:px-7 h-[44px] text-[13px] xs:text-sm font-black tracking-wide shadow-[0_4px_16px_rgba(217,170,92,0.22)] bg-[#E9C982] text-[#050403] hover:bg-[#D9C08A]">Mulai Voting</Button>
                </Link>
                <Button onClick={()=> setCaraOpen(true)} variant="ghost" size="default" className="w-full xs:w-auto rounded-full px-5 h-[36px] xs:h-[38px] text-xs xs:text-[13px] font-semibold tracking-wide border border-white/10 bg-white/5 backdrop-blur text-white hover:text-white hover:bg-white/10">Cara Kerja</Button>
              </div>
              <CaraDukungDialog open={caraOpen} onOpenChange={setCaraOpen} />
            </div>
          </div>
          <div className="pb-6 sm:pb-8 md:pb-10">
            <div className="mx-auto max-w-[560px] text-center px-1">
              {showCountdown ? (
                <>
                  <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] sm:tracking-[0.18em] text-white/60">{countdownLabel}</div>
                  <div className="mt-3 grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
                    {[
                      {v: cd.days, l:"HARI"},
                      {v: cd.hours, l:"JAM"},
                      {v: cd.minutes, l:"MENIT"},
                      {v: cd.seconds, l:"DETIK"},
                    ].map(item=> (
                      <div key={item.l} className="rounded-[10px] sm:rounded-[12px] border border-white/10 bg-[#050403]/80 backdrop-blur py-2 xs:py-2.5 sm:py-3 md:py-4 px-0.5 xs:px-1">
                        <div className="tabular-nums font-[Cormorant_Garamond] text-[22px] xs:text-[26px] sm:text-[28px] md:text-[32px] font-bold leading-none text-[#F2ECE1]">{String(item.v).padStart(2,"0")}</div>
                        <div className="mt-1 text-[8px] xs:text-[9px] sm:text-[10px] font-bold tracking-[0.10em] sm:tracking-[0.14em] text-[#D9AA5C]">{item.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-white/50 tabular-nums">{cd.days} hari lagi • {canonicalTarget ? new Date(canonicalTarget as string).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}) : ""}</div>
                </>
              ) : isClosed ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 backdrop-blur px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-black tracking-wide text-white">VOTING DITUTUP — MENUNGGU REKAP OFFLINE</span>
                </div>
              ) : isPublished ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur px-4 py-2 text-center">
                  <span className="text-[11px] font-black tracking-wide text-white">HASIL TELAH DIREKAP DAN AKAN DIUMUMKAN OLEH PANITIA</span>
                </div>
              ) : isNotStarted ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <span className="text-[11px] font-bold tracking-wide text-white/70">SEGERA DIBUKA</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative border-t bg-[#050403]/80 backdrop-blur" style={{borderColor:"rgba(255,255,255,0.07)"}}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-4 sm:px-6 lg:grid-cols-4">
            {[{icon:IconUsers,title:"Peserta",sub:"Lihat semua tim",href:"/tim"},{icon:IconAward,title:"Cara Voting",sub:"Panduan pemilihan",href:"/dukungan"},{icon:IconGift,title:"Hadiah",sub:"Total hadiah menarik",href:"/kompetisi"},{icon:IconFAQ,title:"FAQ",sub:"Pertanyaan umum",href:"/peraturan"}].map(item=>(
              <Link key={item.title} href={item.href} className="flex items-center gap-3 border-r px-4 py-4 last:border-r-0 hover:bg-white/[0.04]" style={{borderColor:"rgba(255,255,255,0.06)"}}>
                <span className="grid h-9 w-9 place-items-center rounded-xl border text-[#D9AA5C]" style={{backgroundColor:"rgba(217,170,92,0.10)",borderColor:"rgba(217,170,92,0.18)"}}><item.icon className="h-5 w-5"/></span>
                <span><span className="block text-xs font-bold text-[#F2ECE1]">{item.title}</span><span className="block text-[11px] text-white/50">{item.sub}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="font-[Cormorant_Garamond] text-[22px] font-bold text-[#F2ECE1]">Peserta</h2><p className="text-xs text-white/50">Pilih tim favoritmu dan berikan dukungan terbaik!</p></div>
          <Link href="/tim" className="hidden sm:inline text-xs text-white/60 hover:text-white">Lihat Semua</Link>
        </div>
        <div className="mt-4 flex gap-2">
          {["Semua","Putra","Putri","Campuran"].map((f,i)=>(<span key={f} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${i===0?"bg-[#E9C982] text-black border-[#E9C982]":"border-white/10 text-white/60"}`}>{f}</span>))}
        </div>
        {peserta.length===0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center"><p className="text-sm text-white/60">Belum ada peserta di event ini.</p><p className="mt-1 text-xs text-white/30">Admin akan menambahkan tim — data akan muncul realtime.</p></div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {peserta.map(p=>(
              <PesertaCard key={`${p.slug}-${p.n}`} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[16px] border bg-[#141210] p-4" style={{borderColor:"rgba(255,255,255,0.08)"}}>
          {top ? (
            <>
              <div className="flex gap-3">
                <img src={top.image_url||top.image||peserta[0]?.img} alt={top.name} className="h-24 w-24 rounded-xl object-cover border" style={{borderColor:"rgba(255,255,255,0.08)"}}/>
                <div>
                  <div className="inline-flex rounded-full bg-[#D9AA5C] px-2 py-0.5 text-[11px] font-bold text-black">{String(top.number||"01").padStart(2,"0")}</div>
                  <h3 className="mt-1 font-[Cormorant_Garamond] text-lg font-bold leading-tight text-[#F2ECE1]">{top.name?.split(" ").slice(0,3).join(" ")}<br/>{top.name?.split(" ").slice(3).join(" ")||top.school?.split(" ").pop()||"Kertosono"}</h3>
                  <p className="mt-2 max-w-[420px] text-xs leading-relaxed text-white/60">{top.description||`Dengan semangat juang dan disiplin tinggi, ${top.name} menampilkan penampilan terbaik di JAWASOMA 2026.`}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {[
                  {icon:"👤",label:"Nama Tim",value:top.name},
                  {icon:"🎓",label:"Pelatih",value:(top as any).coach||"Bapak Andi Pratama"},
                  {icon:"🏷️",label:"Kategori",value:top.category||"Putra"},
                  {icon:"👥",label:"Jumlah Anggota",value:`${(top as any).member_count||25} Orang`},
                  {icon:"🏫",label:"Asal Sekolah",value:top.school||"SMA Negeri 1 Kertosono"},
                  {icon:"🎯",label:"Motivasi",value:(top as any).motto||"Disiplin • Kompak • Juara"},
                ].map(item=>(
                  <div key={item.label} className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"rgba(10,9,7,0.5)"}}>
                    <span className="grid h-7 w-7 place-items-center rounded-lg border text-[11px]" style={{backgroundColor:"rgba(217,170,92,0.10)",borderColor:"rgba(217,170,92,0.18)"}}>{item.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] leading-none text-white/40">{item.label}</span><span className="block truncate text-xs font-bold text-[#F2ECE1]">{item.value}</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border p-3" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"rgba(10,9,7,0.5)"}}><div className="text-xs text-white/50">Total Suara</div><div className="font-bold text-[#F2ECE1]">{Number(top.total_ballots??top.online_ballots??board[0]?.vote??0).toLocaleString("id-ID")}</div></div>
                <div className="rounded-xl border p-3" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"rgba(10,9,7,0.5)"}}><div className="text-xs text-white/50">Persentase</div><div className="font-bold text-[#D9AA5C]">{board[0]?.pct||"—"}</div></div>
                <div className="rounded-xl border p-3" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"rgba(10,9,7,0.5)"}}><div className="text-xs text-white/50">Posisi</div><div className="font-bold text-[#F2ECE1]">#1</div></div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between"><h4 className="text-xs font-bold tracking-widest text-white/60">Galeri</h4><Link href={`/tim/${top.slug||""}`} className="text-[11px] text-white/40 hover:text-white">Lihat Semua ›</Link></div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[0,1,2].map(i=>(<img key={i} src={peserta[i % peserta.length]?.img} alt="Galeri" className="aspect-[4/3] w-full rounded-lg object-cover border" style={{borderColor:"rgba(255,255,255,0.08)"}}/>))}
                </div>
              </div>
              <div className="mt-4 rounded-xl border p-3" style={{borderColor:"rgba(217,170,92,0.15)", backgroundColor:"rgba(10,9,7,0.4)"}}>
                <div className="text-lg leading-none text-[#D9AA5C]">“</div><p className="text-xs leading-relaxed text-white/70">Kami bukan hanya tim, kami adalah keluarga yang berjuang bersama untuk satu tujuan.</p><p className="mt-2 text-[11px] text-white/30">— {top.name}</p>
              </div>
              <Link href={`/tim/${top.slug||""}`} className="mt-4 flex w-full justify-center rounded-full bg-[#E9C982] py-2.5 text-sm font-bold text-black hover:bg-[#D9C08A]">Dukung Tim Ini</Link>
              <p className="mt-2 text-center text-xs text-white/40">Berikan suaramu untuk {top.name}</p>
              <div className="mt-6">
                <ShareButtons profileUrl={`/tim/${top.slug||""}`} supportUrl={`/dukungan?team=${top.slug||top.id||"01"}`} teamName={top.name} />
              </div>
            </>
          ) : (
            <div className="py-12 text-center"><p className="text-sm text-white/50">Belum ada tim terdaftar di event ini.</p><p className="mt-1 text-xs text-white/30">Data peserta akan muncul otomatis setelah admin menambahkan tim.</p></div>
          )}
          <Link href="/dukungan" className="mt-3 flex w-full justify-center rounded-full bg-[#E9C982] py-2 text-xs font-bold text-black">Voting Sekarang</Link>
        </div>
        <div className="rounded-[16px] border bg-[#0F0D0A] p-4" style={{borderColor:"rgba(255,255,255,0.08)"}}>
          <h3 className="font-[Cormorant_Garamond] text-lg font-bold text-[#F2ECE1]">Leaderboard</h3>
          <p className="text-xs text-white/50">Perolehan suara sementara {hasReal?"• realtime":""}</p>
          <div className="mt-4 space-y-2">
            {board.length===0 ? <div className="py-8 text-center text-xs text-white/30">Belum ada suara masuk.</div> : board.map(r=>(
              <div key={r.r} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:border-[#D9AA5C]/20" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"#1A1814"}}>
                <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold" style={{backgroundColor: r.r===1?"#D9AA5C":r.r===2?"rgba(255,255,255,0.10)":r.r===3?"#8C6522":"rgba(255,255,255,0.05)", color: r.r===1?"black":r.r===3?"white":r.r===2?"white":"rgba(255,255,255,0.6)"}}>{r.r}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full text-xs" style={{backgroundColor:"#2A2216", color:"#D9AA5C"}}>♔</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#F2ECE1]">{r.name}</span><span className="block truncate text-xs text-white/50">{r.sub}</span></span>
                <span className="text-right"><span className="block text-sm font-bold text-[#F2ECE1]">{r.vote}</span><span className="block text-xs text-white/50">{r.pct}</span></span>
              </div>
            ))}
          </div>
          <Link href="/tim" className="mt-3 block text-right text-xs text-white/60 hover:text-white">Lihat Semua →</Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6">
        <div className="rounded-[16px] border bg-[#0F0D0A] p-6" style={{borderColor:"rgba(255,255,255,0.08)"}}>
          <h3 className="font-[Cormorant_Garamond] text-lg font-bold text-[#F2ECE1]">Hasil Akhir</h3>
          <p className="text-xs text-white/50">Pemenang Event JAWASOMA 2026</p>
          {board.length>=3 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
              <div className="rounded-xl border p-3 text-center" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"#1A1814"}}>
                <img src={peserta[1]?.img} alt={board[1]?.name} className="mx-auto h-16 w-16 rounded-xl object-cover"/>
                <div className="mt-2 text-sm font-bold text-[#F2ECE1]">{board[1]?.name}</div>
                <div className="text-xs text-white/50">Juara 2 • {board[1]?.vote} ({board[1]?.pct})</div>
              </div>
              <div className="rounded-xl border p-4 text-center shadow-[0_0_30px_rgba(217,170,92,0.15)]" style={{borderColor:"rgba(217,170,92,0.30)", backgroundColor:"#1A1814"}}>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 bg-[#2A2216] text-[#D9AA5C]" style={{borderColor:"#D9AA5C"}}>♔</div>
                <div className="mt-2 text-sm font-bold text-[#F2ECE1]">{board[0]?.name}</div>
                <div className="text-xs font-bold text-[#D9AA5C]">Juara 1 • {board[0]?.vote} ({board[0]?.pct})</div>
              </div>
              <div className="rounded-xl border p-3 text-center" style={{borderColor:"rgba(255,255,255,0.08)", backgroundColor:"#1A1814"}}>
                <img src={peserta[2]?.img} alt={board[2]?.name} className="mx-auto h-16 w-16 rounded-xl object-cover"/>
                <div className="mt-2 text-sm font-bold text-[#F2ECE1]">{board[2]?.name}</div>
                <div className="text-xs text-white/50">Juara 3 • {board[2]?.vote} ({board[2]?.pct})</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-xs text-white/40" style={{borderColor:"rgba(255,255,255,0.08)"}}>Belum ada hasil — voting masih berlangsung.</div>
          )}
        </div>
      </section>

      <footer className="relative overflow-hidden border-t bg-[#050403]" style={{borderColor:"rgba(255,255,255,0.08)"}}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{backgroundImage:`url("https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/400px-Batik_Mega_Mendung.jpg")`, backgroundSize:"300px"}} />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sendratari.jpg/400px-Sendratari.jpg" alt="" className="pointer-events-none absolute bottom-0 left-0 hidden h-[280px] w-[300px] object-cover object-top opacity-[0.18] lg:block" style={{maskImage:"linear-gradient(to right, black 60%, transparent)", WebkitMaskImage:"linear-gradient(to right, black 60%, transparent)"} as any} />
        <div className="relative mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="lg:pl-[320px]">
              <div className="font-[Cormorant_Garamond] text-sm font-bold tracking-widest text-[#F2ECE1]">JAWASOMA</div>
              <div className="text-[11px] tracking-[0.18em] text-white/40">THE IMPRESSION 2026</div>
              <p className="mt-3 max-w-[420px] text-xs leading-relaxed text-white/50">Event LKBB tingkat nasional yang mengangkat semangat persatuan dan sportifitas. Lebih dari kompetisi — panggung seni, disiplin, dan budaya.</p>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Quick Link</div>
              <ul className="mt-3 space-y-1.5 text-xs text-white/50">
                <li><Link href="/" className="hover:text-white">Beranda</Link></li>
                <li><Link href="/tentang" className="hover:text-white">Tentang</Link></li>
                <li><Link href="/tim" className="hover:text-white">Peserta</Link></li>
                <li><Link href="/dukungan" className="hover:text-white">Voting</Link></li>
                <li><Link href="/kompetisi" className="hover:text-white">Hasil</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Kontak</div>
              <p className="mt-3 text-xs leading-relaxed text-white/50">JAWASOMA<br/>info@jawasoma.id<br/>Kertosono, Jawa Timur</p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t pt-4 text-[11px] text-white/30" style={{borderColor:"rgba(255,255,255,0.08)"}}>
            <span>© 2026 JAWASOMA. All rights reserved.</span>
            <span>The Impression 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}