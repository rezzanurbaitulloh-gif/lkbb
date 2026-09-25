"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CaraDukungDialog } from "@/components/home/CaraDukungDialog"
import { ShareButtons } from "@/components/tim/ShareButtons"
import { ShareSheet } from "@/components/share/ShareSheet"
import { useToast } from "@/components/ui/toast"
import {
  Users, Ticket, Trophy, MessageCircle, Heart, Share2, QrCode,
  Calendar, MapPin, ArrowRight, Crown, ChevronRight, Menu, X,
  Search, GraduationCap, User, School, Sparkles,
} from "lucide-react"

/* ============ tokens plek MASTER SPEC ============ */
const GOLD = "#D9AA5C"
const GOLD_DEEP = "#C89445"
const GOLD_SOFT = "#E9C982"
const INK = "#F2ECE1"

const GUNUNGAN = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg"
const BATIK = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/800px-Batik_Mega_Mendung.jpg"
const DANCER = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sendratari.jpg/800px-Sendratari.jpg"
const TEMPLE = "https://images.unsplash.com/photo-1518544866330-95a2f0664541?w=1600&auto=format&fit=crop&q=80"

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
const fallbackSponsors = ["SMKN 1 Kertosono", "Dispora Nganjuk", "Bank Daerah", "Telco Jatim", "Media Partner"]

function useCountdown(target: string | null){
  const calc = (t: number) => {
    const d = Math.max(0, t - Date.now())
    return { days: Math.floor(d/86400000), hours: Math.floor((d%86400000)/3600000), minutes: Math.floor((d%3600000)/60000), seconds: Math.floor((d%60000)/1000), total: d, expired: d <= 0 }
  }
  const getTime = (s: string | null) => { if(!s) return NaN; const ms = new Date(s).getTime(); return isNaN(ms) ? NaN : ms }
  const t = getTime(target)
  const isValid = !isNaN(t)
  const [diff, setDiff] = useState(() => isValid ? calc(t) : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: true })
  useEffect(()=>{ if(!isValid || isNaN(t)) return; setDiff(calc(t)); const id=setInterval(()=> setDiff(calc(t)),1000); return ()=>clearInterval(id) },[target, t, isValid])
  return { ...diff, isValid, targetTime: t }
}

type Peserta = { n:string; name:string; sub:string; vote:string|number; img:string; slug:string; id:string|number; category:string }

function PesertaCard({ p }: { p: Peserta }){
  const { toast } = useToast()
  const [fav, setFav] = useState(false)
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
    setShareUrl(url); setShareTitle(title); setShareOpen(true)
  }
  return (
    <article data-reveal className="group overflow-hidden rounded-[12px] border bg-[#100D09] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(217,170,92,0.15)]" style={{borderColor:"rgba(218,170,92,0.18)"}}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1C1914]">
        <span className="absolute left-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-[#E9C982] border backdrop-blur-md" style={{borderColor:"rgba(230,190,110,0.6)", backgroundColor:"rgba(0,0,0,0.4)"}}>{p.n}</span>
        <button aria-label={fav ? "Hapus favorit" : "Tambah favorit"} aria-pressed={fav} onClick={()=> setFav(v=>!v)} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 border border-white/10 backdrop-blur-md transition-transform active:scale-125 hover:scale-110">
          <Heart className="h-4 w-4" style={{color: fav ? GOLD : "rgba(255,255,255,0.7)", fill: fav ? GOLD : "transparent"}} />
        </button>
        {p.img ? <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045] group-hover:brightness-[1.05]" /> : <div className="h-full w-full grid place-items-center text-white/20 text-xs">No Image</div>}
        <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(transparent 30%, rgba(0,0,0,0.85))"}} />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold leading-tight" style={{color:INK}}>{p.name}</div>
        <div className="text-xs" style={{color:"rgba(242,236,225,0.68)"}}>{p.sub}</div>
        <div className="mt-3 flex items-center justify-between">
          <Link href={supportUrl} className="rounded-full px-3 py-1.5 text-xs font-bold text-black opacity-80 transition group-hover:opacity-100" style={{background:`linear-gradient(135deg, #E8C47C, #C48A3D)`}}>Vote Sekarang</Link>
          <span className="text-xs inline-flex items-center gap-1" style={{color:"rgba(242,236,225,0.68)"}}>◎ {typeof p.vote==="number"?p.vote.toLocaleString("id-ID"):p.vote}</span>
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

function GoldDust({ count = 28 }: { count?: number }){
  const parts = useMemo(()=> Array.from({length:count},(_,i)=>({
    left: (i*37.7+11)%100, top: (i*53.3+7)%100,
    size: 2+(i%2), delay: (i*0.7)%14, dur: 8+((i*1.3)%6),
  })),[count])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {parts.map((p,i)=>(
        <span key={i} className="absolute rounded-full animate-[golddust_linear_infinite]" style={{left:`${p.left}%`, top:`${p.top}%`, width:p.size, height:p.size, background:GOLD, opacity:0.25, filter:"blur(1px)", animationDuration:`${p.dur}s`, animationDelay:`-${p.delay}s`}} />
      ))}
    </div>
  )
}

const NAV = [
  { href:"/", label:"Beranda", active:true },
  { href:"/tentang", label:"Tentang" },
  { href:"/tim", label:"Peserta" },
  { href:"/dukungan", label:"Voting" },
  { href:"/kompetisi", label:"Hasil" },
  { href:"/sponsor", label:"Sponsor" },
]

export function JawasomaHeritage({ peletons, event }: {peletons?:any[]; event?:any}={}){
  const isPreview = peletons===undefined
  const hasReal = !!(peletons && peletons.length>0)
  const toSlug = (p:any, i:number) => p.slug || String(p.id || p.number || i+1)
  const allPeserta: Peserta[] = hasReal
    ? peletons!.map((p:any,i:number)=>({n:String(p.number||i+1).padStart(2,"0"), name:p.name, sub:`${p.category||"Putra"} • ${p.city||p.school?.split(" ").pop()||"Kertosono"}`, vote: p.vote??p.total_ballots??p.online_ballots??0, img:p.image_url||p.image||"", slug: toSlug(p,i), id: p.id ?? p.number ?? i+1, category: p.category||"Putra"}))
    : (isPreview ? fallbackPeserta.map((p,i)=>({...p, slug: String(i+1).padStart(2,"0"), id: i+1, category: p.sub.split("•")[0].trim()})) : [])
  const [filter, setFilter] = useState("Semua")
  const [query, setQuery] = useState("")
  const peserta = allPeserta.filter(p => (filter==="Semua" || p.category===filter) && p.name.toLowerCase().includes(query.toLowerCase())).slice(0,8)

  const board = hasReal
    ? [...peletons!].sort((a:any,b:any)=>Number(b.total_ballots??b.online_ballots??0)-Number(a.total_ballots??a.online_ballots??0)).slice(0,5).map((p:any,i:number)=>({r:i+1,name:p.name,sub:`${p.category||"Putra"} • ${p.city||"Kertosono"}`,vote:String(p.total_ballots??p.online_ballots??0),pct:`${((Number(p.total_ballots||0)/Math.max(1,peletons!.reduce((s:any,x:any)=>s+Number(x.total_ballots||0),0)))*100).toFixed(1)}%`}))
    : fallbackBoard
  const top = hasReal ? peletons![0] : null
  const topSlug = top ? (top.slug || String(top.id || "01")) : ""
  const galleryImgs = (hasReal ? allPeserta.slice(0,6).map(p=>p.img).filter(Boolean) : fallbackPeserta.slice(0,6).map(p=>p.img))

  const [caraOpen, setCaraOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLElement|null>(null)

  const state = (event?.state as string) || "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const isNotStarted = state === "NOT_STARTED"
  const canonicalTarget = (() => {
    if (isActive && event?.voting_end) return event.voting_end
    if (isNotStarted && event?.voting_start) return event.voting_start
    if (event?.event_date) { const d = String(event.event_date).slice(0,10); const tm = String(event.event_time || "08:00:00"); return `${d}T${tm}+07:00` }
    return event?.voting_end || "2026-10-24T23:59:59+07:00"
  })()
  const cd = useCountdown(canonicalTarget)
  const countdownLabel = isActive ? "MENUJU PENUTUPAN VOTING" : isNotStarted ? "MENUJU PEMBUKAAN VOTING" : isClosed ? "VOTING DITUTUP" : isPublished ? "ACARA SELESAI" : "EVENT DIMULAI DALAM"
  const showCountdown = cd.isValid && !cd.expired && !isClosed && !isPublished

  /* navbar scroll state */
  useEffect(()=>{
    const onScroll = ()=> setScrolled(window.scrollY > 24)
    onScroll(); window.addEventListener("scroll", onScroll, { passive:true })
    return ()=> window.removeEventListener("scroll", onScroll)
  },[])

  /* GSAP reveals + parallax + Lenis (skip bila reduced-motion) */
  useEffect(()=>{
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let lenis: any = null; let ctx: any = null; let cancelled = false
    ;(async ()=>{
      try {
        const gsapMod: any = await import("gsap")
        const stMod: any = await import("gsap/ScrollTrigger")
        const gsap = gsapMod.default || gsapMod
        const ST = stMod.ScrollTrigger || stMod.default || stMod
        gsap.registerPlugin(ST)
        if (cancelled) return
        try {
          const lenisMod: any = await import("lenis")
          const Lenis = lenisMod.default || lenisMod
          lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
          const raf = (time: number)=>{ lenis.raf(time); requestAnimationFrame(raf) }
          requestAnimationFrame(raf)
        } catch {}
        if (cancelled) return
        ctx = gsap.context(()=>{
          const toArray = gsap.utils.toArray as (t: string) => HTMLElement[]
          toArray("[data-reveal]").forEach((el)=>{
            gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "cubic-bezier(.22,1,.36,1)",
              scrollTrigger: { trigger: el, start: "top 90%" } })
          })
          toArray("[data-parallax]").forEach((el)=>{
            const speed = parseFloat(el.dataset.speed || "0.1")
            gsap.to(el, { yPercent: speed*100, ease: "none", scrollTrigger: { trigger: heroRef.current || el, start: "top top", end: "bottom top", scrub: true } })
          })
          gsap.fromTo("[data-hero-title]", { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: "cubic-bezier(.22,1,.36,1)", delay: 0.1 })
          gsap.fromTo("[data-hero-img]", { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "cubic-bezier(.22,1,.36,1)" })
        })
        const hero = heroRef.current
        const onMouse = (e: MouseEvent)=>{
          if (!hero) return
          const r = hero.getBoundingClientRect()
          const x = (e.clientX - r.left)/r.width - 0.5
          const y = (e.clientY - r.top)/r.height - 0.5
          gsap.to("[data-mx-gunungan]", { x: x*20, y: y*20, duration: 0.8, ease: "power2.out" })
          gsap.to("[data-mx-fg]", { x: x*10, y: y*10, duration: 0.8, ease: "power2.out" })
          gsap.to("[data-mx-bg]", { x: x*4, y: y*4, duration: 1, ease: "power2.out" })
        }
        hero?.addEventListener("mousemove", onMouse)
      } catch {}
    })()
    return ()=>{ cancelled = true; try { ctx?.revert() } catch {}; try { lenis?.destroy() } catch {} }
  },[])

  return (
    <div className="min-h-screen bg-[#050403] selection:bg-[#D9AA5C]/30" style={{color:INK}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700;800&family=Manrope:wght@400;500;600;700&display=swap');
@keyframes golddust { 0%{transform:translateY(10px);opacity:0} 30%{opacity:.3} 70%{opacity:.2} 100%{transform:translateY(-60px);opacity:0} }
.animate-\\[golddust_linear_infinite\\]{animation-name:golddust;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes floaty { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(8px)} }`}</style>
      {/* global vignette */}
      <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden style={{background:"radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)"}} />

      {/* ================= NAVBAR minimal luxury ================= */}
      <header className="sticky top-0 z-40 border-b transition-all duration-500" style={{
        backgroundColor: scrolled ? "rgba(5,4,3,0.82)" : "rgba(5,4,3,0.45)",
        backdropFilter: scrolled ? "blur(18px)" : "none", WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
        borderColor:"rgba(218,170,92,0.10)", minHeight: 72,
      }}>
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-6 md:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="JAWASOMA beranda">
            <img src={GUNUNGAN} alt="" aria-hidden className="h-8 w-8 object-cover rounded-sm" style={{filter:"sepia(1) hue-rotate(15deg) saturate(1.4) brightness(0.9)", opacity:0.9}} />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-[Cormorant_Garamond] text-[15px] font-extrabold tracking-[0.14em]" style={{color:INK}}>JAWASOMA</span>
              <span className="text-[9px] tracking-[0.18em] text-white/50 -mt-0.5">THE IMPRESSION 2026</span>
            </span>
            <span className="sm:hidden font-[Cormorant_Garamond] text-sm font-bold" style={{color:INK}}>JAWASOMA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[12px] font-medium tracking-[0.06em] text-white/60" aria-label="Navigasi utama">
            {NAV.map(n=>(
              <Link key={n.label} href={n.href} className={`group relative pb-1 transition-colors hover:text-white ${n.active?"text-white":""}`}>
                {n.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left bg-[#D9AA5C] transition-transform duration-[350ms]" style={{transform: n.active ? "scaleX(1)" : "scaleX(0)"}} />
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left bg-[#D9AA5C] scale-x-0 transition-transform duration-[350ms] group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button aria-label="Cari" className="hidden sm:grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white transition"><Search className="h-4 w-4" strokeWidth={1.5}/></button>
            <Link href="/login" className="rounded-full px-5 py-2 text-xs font-bold text-black transition hover:-translate-y-0.5" style={{background:`linear-gradient(135deg, #E8C47C, #C48A3D)`, boxShadow:"0 4px 16px rgba(210,160,70,0.20)"}}>Masuk</Link>
            <button aria-label="Menu" onClick={()=> setMenuOpen(v=>!v)} className="lg:hidden grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70">{menuOpen ? <X className="h-4 w-4"/> : <Menu className="h-4 w-4"/>}</button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden border-t border-white/10 bg-[#050403]/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-1" aria-label="Navigasi mobile">
            {NAV.map(n=>(<Link key={n.label} href={n.href} onClick={()=> setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white">{n.label}</Link>))}
          </nav>
        )}
      </header>

      {/* ================= HERO cinematic scene ================= */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-white/5">
        {/* L01 dark base + L02/L03/L04 foto */}
        <div className="absolute inset-0 bg-[#050403]" />
        <div data-mx-bg data-parallax data-speed="0.05" className="absolute inset-0">
          <img data-hero-img src={TEMPLE} alt="" className="h-full w-full object-cover object-[50%_30%]" />
        </div>
        {/* L06 gunungan oversized edge */}
        <div data-mx-gunungan data-parallax data-speed="0.2" className="pointer-events-none absolute -right-[100px] top-0 hidden h-full w-[520px] lg:block overflow-hidden opacity-90" aria-hidden>
          <img src={GUNUNGAN} alt="" className="h-full w-full object-cover" style={{filter:"sepia(1) hue-rotate(18deg) saturate(1.2) brightness(0.85)", mixBlendMode:"screen"}} />
          <div className="absolute inset-0" style={{background:"linear-gradient(to left, transparent, rgba(5,4,3,0.2) 60%, #050403)"}} />
        </div>
        {/* L07 batik subtle + gold dust */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[64px] overflow-hidden opacity-[0.05]" aria-hidden>
          <img src={BATIK} alt="" className="h-full w-full object-cover" style={{filter:"sepia(0.6) saturate(0.7) brightness(0.6)", mixBlendMode:"soft-light", maskImage:"linear-gradient(to top, black, transparent)", WebkitMaskImage:"linear-gradient(to top, black, transparent)"}} />
        </div>
        <GoldDust count={28} />
        {/* L08 overlay: kiri gelap → kanan terang + bottom */}
        <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(90deg, rgba(5,4,3,0.92) 0%, rgba(5,4,3,0.65) 40%, rgba(5,4,3,0.20) 80%)"}} />
        <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(transparent 45%, rgba(5,4,3,0.9))"}} />

        {/* L09-L11 teks (layout centered plek lkbbvoting) */}
        <div data-mx-fg className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6">
          <div className="pt-10 sm:pt-12 md:pt-16 pb-6 md:pb-8">
            <div className="mx-auto max-w-[720px] text-center flex flex-col items-center px-1">
              <div className="inline-flex max-w-full items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span className="h-px w-6 sm:w-8 shrink-0" style={{background:GOLD}} />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] sm:tracking-[0.18em] break-words text-center" style={{color:GOLD}}>LKBB EVENT</span>
                <span className="h-px w-6 sm:w-8 shrink-0" style={{background:GOLD}} />
              </div>
              <h1 data-hero-title className="mt-3 font-[Cormorant_Garamond] text-balance font-extrabold leading-[0.9] tracking-[-0.02em] text-center max-w-full break-words px-1">
                <span className="block text-[52px] xs:text-[60px] sm:text-[72px] md:text-[88px] lg:text-[100px] leading-[0.9]" style={{color:"#E8C47C", textShadow:"0 2px 24px rgba(0,0,0,0.8)"}}>JAWASOMA</span>
                <span className="mt-3 block text-[13px] xs:text-[14px] sm:text-[15px] font-[Manrope] font-semibold tracking-[0.28em]" style={{color:GOLD_SOFT}}>THE IMPRESSION 2026</span>
              </h1>
              <p className="mt-4 max-w-[320px] text-[16px] sm:text-[17px] leading-[1.5] text-white/70">Langkah Tegas, Jiwa Kesatria, Untuk Negeri yang Lebih Baik</p>
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-white/60">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" strokeWidth={1.5} style={{color:GOLD}}/>24 Oktober 2026</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" strokeWidth={1.5} style={{color:GOLD}}/>Kertosono, Jawa Timur</span>
              </div>
              <div className="mt-6 flex flex-col xs:flex-row flex-wrap gap-2.5 sm:gap-3 justify-center items-center w-full xs:w-auto px-1 xs:px-0">
                <Link href="/dukungan" className="w-full xs:w-auto">
                  <span className="inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-full px-7 h-[46px] text-sm font-black tracking-wide text-black transition hover:-translate-y-0.5 hover:brightness-105" style={{background:`linear-gradient(135deg, #E8C47C, #C48A3D)`, boxShadow:"0 10px 30px rgba(210,160,70,0.20)"}}>Mulai Voting <ArrowRight className="h-4 w-4" strokeWidth={2}/></span>
                </Link>
                <Button onClick={()=> setCaraOpen(true)} variant="ghost" size="default" className="w-full xs:w-auto rounded-full px-5 h-[38px] text-[13px] font-semibold tracking-wide border border-white/10 bg-white/5 backdrop-blur text-white hover:text-white hover:bg-white/10">Cara Kerja</Button>
              </div>
              <CaraDukungDialog open={caraOpen} onOpenChange={setCaraOpen} />
            </div>
          </div>
          {/* countdown open typography */}
          <div className="pb-8 sm:pb-10">
            <div className="mx-auto max-w-[560px] text-center px-1">
              {showCountdown ? (
                <>
                  <div className="text-[10px] font-bold tracking-[0.18em] text-white/60">{countdownLabel}</div>
                  <div className="mt-3 flex items-stretch justify-center">
                    {[
                      {v: cd.days, l:"Hari"}, {v: cd.hours, l:"Jam"}, {v: cd.minutes, l:"Menit"}, {v: cd.seconds, l:"Detik"},
                    ].map((item,i,arr)=> (
                      <div key={item.l} className="flex items-stretch">
                        <div className="px-4 sm:px-6 py-1">
                          <div className="tabular-nums font-[Cormorant_Garamond] text-[34px] sm:text-[44px] font-bold leading-none" style={{color:INK}}>{String(item.v).padStart(2,"0")}</div>
                          <div className="mt-1 text-[10px] font-semibold tracking-[0.18em]" style={{color:GOLD}}>{item.l}</div>
                        </div>
                        {i < arr.length-1 && <div className="w-px self-stretch my-1" style={{backgroundColor:"rgba(255,255,255,0.15)"}} />}
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

        {/* quick info strip */}
        <div className="relative border-t border-b bg-[#080705]/90 backdrop-blur" style={{borderTopColor:"rgba(220,170,90,0.15)", borderBottomColor:"rgba(220,170,90,0.10)"}}>
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-0 px-6 md:px-10 lg:grid-cols-4">
            {[
              {icon:Users,title:"Peserta",sub:"Lihat semua tim",href:"/tim"},
              {icon:Ticket,title:"Cara Voting",sub:"Panduan pemilihan",href:"/dukungan"},
              {icon:Trophy,title:"Hadiah",sub:"Total hadiah menarik",href:"/kompetisi"},
              {icon:MessageCircle,title:"FAQ",sub:"Pertanyaan umum",href:"/peraturan"},
            ].map(item=>(
              <Link key={item.title} href={item.href} className="flex items-center gap-3 border-r px-4 py-4 last:border-r-0 hover:bg-white/[0.04] transition" style={{borderColor:"rgba(255,255,255,0.06)"}}>
                <span className="grid h-9 w-9 place-items-center rounded-xl border" style={{backgroundColor:"rgba(217,170,92,0.10)",borderColor:"rgba(217,170,92,0.18)", color:GOLD}}><item.icon className="h-[22px] w-[22px]" strokeWidth={1.5}/></span>
                <span><span className="block text-xs font-bold" style={{color:INK}}>{item.title}</span><span className="block text-[11px] text-white/50">{item.sub}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PESERTA (quiet setelah hero) ================= */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 py-10 md:py-14">
        <div data-reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2 className="font-[Cormorant_Garamond] text-[28px] md:text-[34px] font-bold leading-tight" style={{color:INK}}>Peserta</h2>
            <p className="mt-1 text-sm" style={{color:"rgba(242,236,225,0.68)"}}>Pilih tim favoritmu dan berikan dukungan terbaik!</p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" strokeWidth={1.5}/>
              <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Cari nama tim..." aria-label="Cari nama tim"
                className="h-10 w-full sm:w-[240px] rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#D9AA5C]/50" />
            </div>
            <Link href="/tim" className="hidden sm:inline-flex items-center text-xs text-white/60 hover:text-white self-center">Lihat Semua <ChevronRight className="h-3.5 w-3.5"/></Link>
          </div>
        </div>
        <div data-reveal className="mt-5 flex flex-wrap gap-2">
          {["Semua","Putra","Putri","Campuran"].map(f=>(
            <button key={f} onClick={()=> setFilter(f)} className="rounded-full px-4 py-1.5 text-xs font-bold border transition"
              style={filter===f ? {background:"#E3BC72", color:"#100C07", borderColor:"#E3BC72"} : {background:"transparent", color:"rgba(255,255,255,0.6)", borderColor:"rgba(255,255,255,0.15)"}}>{f}</button>
          ))}
        </div>
        {peserta.length===0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center"><p className="text-sm text-white/60">Belum ada peserta di event ini.</p><p className="mt-1 text-xs text-white/30">Admin akan menambahkan tim — data akan muncul realtime.</p></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {peserta.map(p=>(<PesertaCard key={`${p.slug}-${p.n}`} p={p} />))}
          </div>
        )}
      </section>

      {/* ================= FEATURED + LEADERBOARD (7/5) ================= */}
      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 md:px-10 pb-10 md:pb-14 lg:grid-cols-12">
        <div data-reveal className="lg:col-span-7 rounded-[16px] border border-white/[0.08] bg-[#100D09] p-4 md:p-6">
          {top ? (
            <>
              <div className="flex gap-4">
                <img src={top.image_url||top.image||allPeserta[0]?.img} alt={top.name} className="h-24 w-24 md:h-28 md:w-28 rounded-xl object-cover border border-white/10"/>
                <div className="min-w-0">
                  <div className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-black" style={{background:GOLD}}>{String(top.number||"01").padStart(2,"0")}</div>
                  <h3 className="mt-1.5 font-[Cormorant_Garamond] text-xl md:text-2xl font-bold leading-tight" style={{color:INK}}>{top.name}</h3>
                  <p className="text-[11px] tracking-[0.14em] font-semibold" style={{color:GOLD}}>{(top.category||"Putra").toUpperCase()} • {(top.city||"Kertosono").toUpperCase()}</p>
                  <p className="mt-2 max-w-[460px] text-xs leading-relaxed text-white/60">{top.description||`Dengan semangat juang dan disiplin tinggi, ${top.name} menampilkan penampilan terbaik di JAWASOMA 2026.`}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                {[
                  {icon:Users,label:"Nama Tim",value:top.name},
                  {icon:User,label:"Pelatih",value:top.coach||"Bapak Andi Pratama"},
                  {icon:School,label:"Asal Sekolah",value:top.school||"SMA Negeri 1 Kertosono"},
                  {icon:Users,label:"Jumlah Anggota",value:`${top.member_count||25} Orang`},
                  {icon:Calendar,label:"Tahun Berdiri",value:top.founded_year||"2019"},
                  {icon:Sparkles,label:"Motivasi",value:top.motto||"Disiplin • Kompak • Juara"},
                ].map(item=>(
                  <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border" style={{backgroundColor:"rgba(217,170,92,0.10)",borderColor:"rgba(217,170,92,0.18)", color:GOLD}}><item.icon className="h-4 w-4" strokeWidth={1.5}/></span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] leading-none text-white/40">{item.label}</span><span className="block truncate text-xs font-bold" style={{color:INK}}>{item.value}</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3"><div className="text-[11px] text-white/50">Total Suara</div><div className="font-bold" style={{color:INK}}>{Number(top.total_ballots??top.online_ballots??0).toLocaleString("id-ID")}</div></div>
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3"><div className="text-[11px] text-white/50">Persentase</div><div className="font-bold" style={{color:GOLD}}>{board[0]?.pct||"—"}</div></div>
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3"><div className="text-[11px] text-white/50">Posisi</div><div className="font-bold" style={{color:INK}}>#1</div></div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between"><h4 className="text-xs font-bold tracking-[0.18em] text-white/60">GALERI</h4><Link href={`/tim/${topSlug}`} className="text-[11px] text-white/40 hover:text-white">Lihat Semua ›</Link></div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2 snap-x">
                  {galleryImgs.map((src,i)=>(<img key={i} src={src} alt={`Galeri ${i+1}`} loading="lazy" className="aspect-[4/3] w-40 md:w-48 shrink-0 snap-start rounded-lg object-cover border border-white/10 transition hover:scale-[1.04]"/>))}
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.035] p-4">
                <div className="font-[Cormorant_Garamond] text-[48px] leading-[0.6]" style={{color:GOLD}}>“</div>
                <p className="text-xs leading-relaxed text-white/70">Kami bukan hanya tim, kami adalah keluarga yang berjuang bersama untuk satu tujuan.</p>
                <p className="mt-2 text-[11px] text-white/30">— {top.name}</p>
              </div>
              <Link href={`/tim/${topSlug}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:brightness-105" style={{background:`linear-gradient(135deg, #E8C47C, #C48A3D)`}}>Dukung Tim Ini <ArrowRight className="h-4 w-4"/></Link>
              <p className="mt-2 text-center text-xs text-white/40">Berikan suaramu untuk {top.name}</p>
              <div className="mt-4"><ShareButtons profileUrl={`/tim/${topSlug}`} supportUrl={`/dukungan?team=${topSlug}`} teamName={top.name} /></div>
            </>
          ) : (
            <div className="py-12 text-center"><p className="text-sm text-white/50">Belum ada tim terdaftar di event ini.</p><p className="mt-1 text-xs text-white/30">Data peserta akan muncul otomatis setelah admin menambahkan tim.</p></div>
          )}
        </div>

        <div data-reveal className="lg:col-span-5 rounded-[16px] border border-white/[0.08] bg-[#0F0D0A] p-4 md:p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-[Cormorant_Garamond] text-2xl font-bold" style={{color:INK}}>Leaderboard</h3>
          <p className="text-xs text-white/50">Perolehan suara sementara {hasReal?"• realtime":""}</p>
          <div className="mt-4 space-y-2">
            {board.length===0 ? <div className="py-8 text-center text-xs text-white/30">Belum ada suara masuk.</div> : board.map(r=>(
              <div key={r.r} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#1A1814] px-3 py-2.5 transition hover:border-[#D9AA5C]/30">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" style={r.r===1?{background:GOLD,color:"black"}:r.r===2?{background:"rgba(255,255,255,0.10)",color:"white"}:r.r===3?{background:"#8C6522",color:"white"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)"}}>{r.r}</span>
                {r.r===1 && <Crown className="h-4 w-4 shrink-0" style={{color:GOLD}} strokeWidth={1.5}/>}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold" style={{color:INK}}>{r.name}</span><span className="block truncate text-xs text-white/50">{r.sub}</span></span>
                <span className="text-right shrink-0"><span className="block text-sm font-bold tabular-nums" style={{color:INK}}>{r.vote}</span><span className="block text-xs text-white/50 tabular-nums">{r.pct}</span></span>
              </div>
            ))}
          </div>
          <Link href="/tim" className="mt-3 flex items-center justify-end gap-1 text-xs text-white/60 hover:text-white">Lihat Semua <ChevronRight className="h-3.5 w-3.5"/></Link>
        </div>
      </section>

      {/* ================= HASIL AKHIR winner showcase ================= */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 pb-10 md:pb-14">
        <div data-reveal className="rounded-[16px] border border-white/[0.08] bg-[#0F0D0A] p-6 md:p-10 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden style={{backgroundImage:`url("${BATIK}")`, backgroundSize:"280px"}} />
          <Crown className="mx-auto h-8 w-8" style={{color:GOLD}} strokeWidth={1.5}/>
          <h3 className="mt-2 font-[Cormorant_Garamond] text-2xl md:text-3xl font-bold" style={{color:INK}}>Hasil Akhir</h3>
          <p className="text-xs text-white/50">Pemenang Event JAWASOMA 2026</p>
          {board.length>=3 ? (
            <div className="relative mt-6 grid gap-4 sm:grid-cols-3 items-end max-w-[900px] mx-auto">
              <div className="rounded-xl border border-white/[0.08] bg-[#1A1814] p-4">
                {allPeserta[1]?.img && <img src={allPeserta[1].img} alt={board[1]?.name} loading="lazy" className="mx-auto h-20 w-20 rounded-xl object-cover"/>}
                <div className="mt-2 text-sm font-bold" style={{color:INK}}>{board[1]?.name}</div>
                <div className="text-xs text-white/50 tabular-nums">Juara 2 • {board[1]?.vote} ({board[1]?.pct})</div>
              </div>
              <div className="rounded-xl border bg-[#1A1814] p-5 order-first sm:order-none" style={{borderColor:"rgba(217,170,92,0.30)", boxShadow:"0 0 30px rgba(217,170,92,0.15)"}}>
                {allPeserta[0]?.img
                  ? <img src={allPeserta[0].img} alt={board[0]?.name} loading="lazy" className="mx-auto h-24 w-24 rounded-2xl object-cover border-2" style={{borderColor:GOLD}}/>
                  : <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 bg-[#2A2216]" style={{borderColor:GOLD}}><Crown className="h-8 w-8" style={{color:GOLD}}/></div>}
                <div className="mt-2 text-base font-bold" style={{color:INK}}>{board[0]?.name}</div>
                <div className="text-xs font-bold tabular-nums" style={{color:GOLD}}>Juara 1 • {board[0]?.vote} ({board[0]?.pct})</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#1A1814] p-4">
                {allPeserta[2]?.img && <img src={allPeserta[2].img} alt={board[2]?.name} loading="lazy" className="mx-auto h-20 w-20 rounded-xl object-cover"/>}
                <div className="mt-2 text-sm font-bold" style={{color:INK}}>{board[2]?.name}</div>
                <div className="text-xs text-white/50 tabular-nums">Juara 3 • {board[2]?.vote} ({board[2]?.pct})</div>
              </div>
            </div>
          ) : (
            <div className="relative mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/40">Belum ada hasil — voting masih berlangsung.</div>
          )}
        </div>
      </section>

      {/* ================= STORY editorial ================= */}
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 md:px-10 pb-10 md:pb-14 lg:grid-cols-12 items-center">
        <div data-reveal className="lg:col-span-5 relative overflow-hidden rounded-[16px] border border-white/10">
          <img src={DANCER} alt="Penari tradisional Jawa" loading="lazy" className="aspect-[4/5] w-full object-cover object-top transition duration-700 hover:scale-[1.03]"/>
          <div className="absolute inset-0" style={{background:"linear-gradient(transparent 50%, rgba(5,4,3,0.7))"}} />
        </div>
        <div data-reveal className="lg:col-span-7">
          <div className="text-[10px] font-bold tracking-[0.2em]" style={{color:GOLD}}>CERITA KAMI</div>
          <h2 className="mt-2 font-[Cormorant_Garamond] text-[32px] md:text-[44px] font-bold leading-[1.05]" style={{color:INK}}>Lebih dari<br/>Sekadar Kompetisi</h2>
          <div className="mt-3 h-px w-24" style={{background:`linear-gradient(to right, ${GOLD}, transparent)`}} />
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-white/60">JAWASOMA adalah panggung tempat disiplin baris-berbaris bertemu dengan kekayaan budaya Jawa. Setiap langkah tegap, setiap aba-aba, dan setiap formasi adalah persembahan — untuk sekolah, untuk tanah kelahiran, untuk negeri.</p>
          <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-white/60">Didukung gunungan sebagai simbol awal kehidupan, event ini merayakan sportivitas, persaudaraan, dan warisan yang terus hidup di tangan generasi muda.</p>
          <Link href="/tentang" className="mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-wide hover:gap-3 transition-all" style={{color:GOLD_SOFT}}>Selengkapnya <ArrowRight className="h-4 w-4"/></Link>
        </div>
      </section>

      {/* ================= GALERI rail ================= */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 pb-10 md:pb-14">
        <div data-reveal className="flex items-end justify-between">
          <div><h2 className="font-[Cormorant_Garamond] text-[26px] md:text-[32px] font-bold" style={{color:INK}}>Galeri</h2><p className="text-xs text-white/50">Momen terbaik JAWASOMA 2026</p></div>
        </div>
        <div data-reveal className="mt-4 flex gap-3 overflow-x-auto pb-3 snap-x">
          {galleryImgs.map((src,i)=>(
            <figure key={i} className="group relative w-64 md:w-80 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10">
              <img src={src} alt={`Momen JAWASOMA ${i+1}`} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"/>
              <figcaption className="absolute inset-x-0 bottom-0 px-3 py-2 text-[11px] text-white/70" style={{background:"linear-gradient(transparent, rgba(0,0,0,0.8))"}}>Momen {String(i+1).padStart(2,"0")} • JAWASOMA 2026</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ================= SPONSOR quiet ================= */}
      <section className="border-t border-white/5 bg-[#090806]">
        <div data-reveal className="mx-auto max-w-[1440px] px-6 md:px-10 py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {fallbackSponsors.map(s=>(
            <span key={s} className="font-[Manrope] text-xs font-semibold tracking-[0.14em] uppercase text-white/45 transition hover:text-white hover:opacity-100" style={{opacity:0.55}}>{s}</span>
          ))}
        </div>
      </section>

      {/* ================= FOOTER tenang ================= */}
      <footer className="relative overflow-hidden bg-[#050403] border-t" style={{borderColor:"rgba(210,165,85,0.15)"}}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden style={{backgroundImage:`url("${BATIK}")`, backgroundSize:"300px", maskImage:"linear-gradient(to top, black, transparent)", WebkitMaskImage:"linear-gradient(to top, black, transparent)"}} />
        <img src={DANCER} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute bottom-0 left-0 hidden h-[280px] w-[300px] object-cover object-top opacity-[0.14] lg:block" style={{maskImage:"linear-gradient(to right, black 60%, transparent)", WebkitMaskImage:"linear-gradient(to right, black 60%, transparent)"}} />
        <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="lg:pl-[320px]">
              <div className="font-[Cormorant_Garamond] text-sm font-bold tracking-widest" style={{color:INK}}>JAWASOMA</div>
              <div className="text-[11px] tracking-[0.18em] text-white/40">THE IMPRESSION 2026</div>
              <p className="mt-3 max-w-[420px] text-xs leading-relaxed text-white/50">Event LKBB tingkat nasional yang mengangkat semangat persatuan dan sportifitas. Lebih dari kompetisi — panggung seni, disiplin, dan budaya.</p>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Quick Link</div>
              <ul className="mt-3 space-y-1.5 text-xs text-white/50">
                {[["/","Beranda"],["/tentang","Tentang"],["/tim","Peserta"],["/dukungan","Voting"],["/kompetisi","Hasil"]].map(([h,l])=>(<li key={h}><Link href={h} className="hover:text-white transition">{l}</Link></li>))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Kontak</div>
              <p className="mt-3 text-xs leading-relaxed text-white/50">JAWASOMA<br/>info@jawasoma.id<br/>Kertosono, Jawa Timur</p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[11px] text-white/30">
            <span>© 2026 JAWASOMA. All rights reserved.</span>
            <span>The Impression 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
