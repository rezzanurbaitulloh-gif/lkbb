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
  const [diff, setDiff] = useState(() => isValid ? calc(t) : { days: 12, hours: 8, minutes: 24, seconds: 17, total: 1, expired: false })
  useEffect(()=>{
    if(!isValid || isNaN(t)) return
    setDiff(calc(t))
    const id=setInterval(()=> setDiff(calc(t)),1000)
    return ()=>clearInterval(id)
  },[target])
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
  const showCountdown = true

  const heroImage = (siteSettings?.["hero.peleton_image"] as string) || cmsContent.heroPeletonImage || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&auto=format&fit=crop&q=70"

  if (cms && cms.is_visible === false) return null

  const statusLabel = isActive ? "VOTING OPEN" : isClosed ? "VOTING CLOSED" : isPublished ? "RESULTS PUBLISHED" : "VOTING OPEN"
  const units = [
    { v: cd.isValid ? String(cd.days).padStart(2,"0") : "12", l: "DAYS" },
    { v: cd.isValid ? String(cd.hours).padStart(2,"0") : "08", l: "HOURS" },
    { v: cd.isValid ? String(cd.minutes).padStart(2,"0") : "24", l: "MINUTES" },
    { v: cd.isValid ? String(cd.seconds).padStart(2,"0") : "17", l: "SECONDS" },
  ]

  return (
    <section className="relative overflow-hidden border border-white/[0.08] bg-[#0A0A09] text-[#F2F0E9]">
      <div className="grid lg:grid-cols-[1fr_1.15fr]">
        {/* LEFT — headline plek PNG */}
        <div className="relative flex flex-col justify-center px-5 pb-8 pt-10 sm:px-8 lg:min-h-[560px] lg:px-12 lg:py-14">
          <h1 className="font-display font-bold leading-[0.88] tracking-[-0.03em]">
            <span className="reveal-line block text-[44px] sm:text-[56px] lg:text-[64px]"><span className="block">THE CROWD</span></span>
            <span className="reveal-line block text-[44px] sm:text-[56px] lg:text-[64px]"><span className="block">HAS A</span></span>
            <span className="block text-[44px] text-[#D9FF3F] sm:text-[56px] lg:text-[64px]">VOICE.</span>
          </h1>
          <p className="mt-4 max-w-[340px] font-body text-[12.5px] leading-relaxed text-[#B8B7B0]">
            Dukung tim favoritmu dan jadi bagian dari perjalanan mereka di LKBB 2026.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9FF3F]/30 bg-[#D9FF3F]/[0.06] px-3.5 py-2 text-[10px] font-bold tracking-[0.1em] text-[#D9FF3F]">
              <span className="leading-none">24 OCTOBER 2026<br /><span className="text-[#F2F0E9]/80">KERTOSONO</span></span>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/tim" className="inline-flex items-center gap-2 rounded-full bg-[#D9FF3F] px-5 py-2.5 text-[11px] font-bold tracking-wide text-black transition-transform hover:scale-[1.02]">
              EXPLORE PARTICIPANTS <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-[#92918C] uppercase">
            <span className="text-[#D9FF3F]">↓</span> SCROLL TO EXPLORE
          </div>

          {/* diagonal hairlines dekoratif */}
          <svg className="pointer-events-none absolute bottom-0 left-0 h-full w-full opacity-[0.14]" viewBox="0 0 400 560" fill="none" preserveAspectRatio="none">
            <line x1="40" y1="560" x2="240" y2="80" stroke="#F2F0E9" strokeWidth="1" />
            <line x1="90" y1="560" x2="290" y2="80" stroke="#F2F0E9" strokeWidth="0.6" />
          </svg>
        </div>

        {/* RIGHT — foto + countdown vertikal + 2026 raksasa */}
        <div className="relative min-h-[420px] overflow-hidden bg-[#141414] lg:min-h-[560px]">
          <img src={heroImage} alt="Peleton LKBB" className="absolute inset-0 h-full w-full object-cover object-top grayscale-[0.3]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A09] via-[#0A0A09]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/85 via-transparent to-[#0A0A09]/20" />
          {/* diagonal lime accent */}
          <div className="absolute right-[34%] top-0 h-full w-px rotate-[24deg] bg-[#D9FF3F]/40" />
          <div className="absolute right-[30%] top-0 h-full w-px rotate-[24deg] bg-white/10" />

          {/* VOTING OPEN + countdown vertikal kanan — plek PNG */}
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-6">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#D9FF3F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9FF3F] animate-pulse" /> {statusLabel}
            </div>
            <div className="flex flex-col items-end gap-2.5">
              {units.map(u=> (
                <div key={u.l} className="text-right">
                  <div className="font-display text-[22px] font-bold tabular-nums leading-none text-white">{u.v}</div>
                  <div className="mt-0.5 text-[8px] font-semibold tracking-[0.18em] text-white/50">{u.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2026 outline raksasa */}
          <div className="absolute bottom-2 right-4 select-none font-display text-[110px] font-light leading-none tracking-tight text-transparent sm:text-[150px] lg:text-[170px]"
            style={{ WebkitTextStroke: "1px rgba(242,240,233,0.22)" }}>2026</div>
        </div>
      </div>
    </section>
  )
}
