"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ArrowDown } from "lucide-react"

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

export function Hero({ event, cms, siteSettings }: { event: any; cms?: any; siteSettings?: Record<string, any> }){
  const cmsContent = cms?.content || {}
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
    return event?.voting_end || cmsContent.fallbackDate || null
  })()
  const cd = useCountdown(canonicalTarget)

  const showCountdown = (() => {
    if (!cd.isValid) return false
    if (cd.expired) return false
    if (isClosed || isPublished) return false
    return true
  })()

  // Editorial content — data-driven, not hardcoded
  const headline = cmsContent.headline || "THE CROWD\nHAS A\nVOICE."
  const headlineLines = headline.split("\n")
  const subline = cmsContent.subline || "Dukung tim favoritmu dan jadi bagian dari perjalanan mereka di LKBB 2026."
  const eventDate = cmsContent.eventDate || "24 OCTOBER 2026"
  const eventLocation = cmsContent.eventLocation || "KERTOSONO"
  const eventYear = cmsContent.eventYear || "2026"

  const bgImage = siteSettings?.["hero.background_image"] || cmsContent.backgroundImage || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1600&auto=format&fit=crop&q=70"
  const peletonImage = cmsContent.peletonImage || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&auto=format&fit=crop&q=70"

  if (cms && cms.is_visible === false) return null

  return (
    <section className="relative bg-background text-foreground overflow-hidden border-b border-border">
      {/* Top bar — thin editorial header */}
      <div className="container-editorial flex items-center justify-between py-4 text-[10px] tracking-[0.14em] font-semibold text-muted-foreground uppercase">
        <span>LKBB • JAVASOMA THE IMPRESSION</span>
        <span className="hidden sm:inline">ASTRA DHARMA HAYUNING BUDAYA</span>
        <span className="hidden md:inline">24 OCTOBER 2026 — KERTOSONO</span>
      </div>

      <div className="hairline" />

      {/* Hero grid — asymmetric */}
      <div className="container-editorial grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 pt-8 lg:pt-12 pb-8">
        {/* Left: headline */}
        <div className="flex flex-col justify-center">
          <div className="meta-label">LKBB • JAVASOMA THE IMPRESSION • {eventYear}</div>
          <h1 className="mt-4 font-display font-bold leading-[0.85] tracking-[-0.04em] text-foreground">
            {headlineLines.map((line: string, i: number) => (
              <span key={i} className="block overflow-hidden">
                <span className="block animate-[lineReveal_700ms_var(--ease-editorial)_forwards]" style={{ animationDelay: `${i * 120}ms` }}>
                  {i === headlineLines.length - 1 ? (
                    <span className="text-primary">{line}</span>
                  ) : line}
                </span>
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-[420px] text-[14px] leading-relaxed text-muted-foreground">
            {subline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/tim"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold tracking-wide hover:bg-primary/90 transition-colors"
            >
              EXPLORE PARTICIPANTS <ArrowRight className="h-3 w-3" />
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px w-6 bg-border" />
              <span>{eventDate} — {eventLocation}</span>
            </div>
          </div>

          {/* Voting status + countdown — editorial, not card */}
          <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-primary animate-pulse" : isClosed ? "bg-amber-500" : "bg-muted-foreground"}`} />
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-foreground">
                {isActive ? "VOTING OPEN" : isClosed ? "VOTING CLOSED" : isPublished ? "RESULTS PUBLISHED" : "COMING SOON"}
              </span>
            </div>
            {showCountdown && (
              <div className="flex items-center gap-4 tabular-nums text-xs">
                <span><b className="text-foreground">{String(cd.days).padStart(2,"0")}</b> <span className="text-muted-foreground">DAYS</span></span>
                <span><b className="text-foreground">{String(cd.hours).padStart(2,"0")}</b> <span className="text-muted-foreground">HOURS</span></span>
                <span><b className="text-foreground">{String(cd.minutes).padStart(2,"0")}</b> <span className="text-muted-foreground">MINUTES</span></span>
                <span><b className="text-foreground">{String(cd.seconds).padStart(2,"0")}</b> <span className="text-muted-foreground">SECONDS</span></span>
              </div>
            )}
            <span className="ml-auto hidden sm:inline text-[10px] tracking-[0.14em] text-muted-foreground">
              {eventYear} — SCROLL TO EXPLORE ↓
            </span>
          </div>
        </div>

        {/* Right: large peleton image — editorial crop, not card */}
        <div className="relative aspect-[4/5] lg:aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
          {/* Thin frame */}
          <div className="absolute inset-3 border border-white/10 pointer-events-none" />
          {/* 2026 watermark — editorial, not decorative blob */}
          <div className="absolute bottom-4 right-4 text-[80px] font-display font-bold leading-none tracking-[-0.05em] text-white/10 pointer-events-none select-none">
            {eventYear}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="text-[10px] tracking-[0.14em] font-bold text-white/60 uppercase">Featured • LKBB 2026</div>
            <div className="mt-1 text-sm font-bold text-white">PASKIBRA SATRIA CENGKARA</div>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator — editorial, not pill */}
      <div className="container-editorial flex items-center justify-between py-3 border-t border-border text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        <span className="flex items-center gap-2">
          <ArrowDown className="h-3 w-3" /> Scroll to explore
        </span>
        <span className="hidden sm:inline">Beranda • Tim • Kompetisi • Profile</span>
      </div>

      <style>{`
        @keyframes lineReveal { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </section>
  )
}
