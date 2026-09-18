"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

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

  const canonicalTarget = (() => {
    if (isActive && event?.voting_end) return event.voting_end
    if (state === "NOT_STARTED" && event?.voting_start) return event.voting_start
    if (event?.event_date) {
      const d = String(event.event_date).slice(0,10)
      const tm = String(event.event_time || "08:00:00")
      return `${d}T${tm}+07:00`
    }
    return event?.voting_end || cmsContent.fallbackDate || null
  })()
  const cd = useCountdown(canonicalTarget)

  const showCountdown = cd.isValid && !cd.expired && !isClosed && !isPublished

  // Use real peleton photo from DB if available, fallback to Unsplash peleton formation
  const heroImage = "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&auto=format&fit=crop&q=70"
  // Try to get first peleton photo from siteSettings or CMS, but use heroImage as primary

  if (cms && cms.is_visible === false) return null

  return (
    <section className="relative bg-background text-foreground overflow-hidden border-b border-border">
      {/* Top nav is handled by Navbar, this is hero specific top meta */}
      <div className="container-editorial">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] min-h-[520px] lg:min-h-[560px]">
          {/* Left: headline */}
          <div className="flex flex-col justify-center py-8 lg:py-12 pr-0 lg:pr-8">
            <h1 className="font-display font-bold leading-[0.85] tracking-[-0.04em] text-foreground">
              <span className="block text-[42px] sm:text-[48px] lg:text-[56px]">THE CROWD</span>
              <span className="block text-[42px] sm:text-[48px] lg:text-[56px]">HAS A</span>
              <span className="block text-[42px] sm:text-[48px] lg:text-[56px] text-primary">VOICE.</span>
            </h1>
            <p className="mt-4 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
              Dukung tim favoritmu dan jadi bagian dari perjalanan mereka di LKBB 2026.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                24 OCTOBER 2026 — KERTOSONO
              </div>
              <Link href="/tim" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold tracking-wide hover:bg-primary/90 transition-colors">
                EXPLORE PARTICIPANTS →
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              <span>↓</span> Scroll to explore
            </div>
          </div>

          {/* Right: image with diagonal cut */}
          <div className="relative min-h-[400px] lg:min-h-[560px] overflow-hidden bg-muted">
            <img
              src={heroImage}
              alt="Peleton LKBB"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Diagonal cut — editorial */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/20" />
            <div className="absolute top-0 left-0 w-[80px] h-full bg-background" style={{ clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)" }} />

            {/* Voting status + countdown — editorial, not card */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold tracking-wide">
                    {isActive ? "VOTING OPEN" : isClosed ? "VOTING CLOSED" : isPublished ? "RESULTS PUBLISHED" : "COMING SOON"}
                  </div>
                  {showCountdown && (
                    <div className="mt-2 flex gap-3 tabular-nums text-xs text-white">
                      <span><b>{String(cd.days).padStart(2,"0")}</b> <span className="text-white/60">DAYS</span></span>
                      <span><b>{String(cd.hours).padStart(2,"0")}</b> <span className="text-white/60">HOURS</span></span>
                      <span><b>{String(cd.minutes).padStart(2,"0")}</b> <span className="text-white/60">MINUTES</span></span>
                      <span><b>{String(cd.seconds).padStart(2,"0")}</b> <span className="text-white/60">SECONDS</span></span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-[80px] font-display font-bold leading-none tracking-[-0.05em] text-white/10">2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
