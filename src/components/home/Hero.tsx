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

  // Visual hero: logo resmi LKBB — setting hero.logo_image → branding.logo → logo lokal.
  const heroImage = (siteSettings?.["hero.logo_image"] as string) || (siteSettings?.["branding.logo"] as string) || cmsContent.heroLogoImage || "/assets/brand/lkbb-logo.jpg"

  // Tanggal & lokasi dari event — bukan hardcode.
  const eventDateStr = (event?.event_date as string) || null
  const dateLabel = (()=> {
    if(!eventDateStr) return null
    const d = new Date(eventDateStr + "T00:00:00")
    if(isNaN(d.getTime())) return null
    const day = String(d.getDate()).padStart(2,"0")
    const month = d.toLocaleString("en-US", { month: "long" }).toUpperCase()
    return `${day} ${month} ${d.getFullYear()}`
  })()
  const yearLabel = eventDateStr?.slice(0,4) || ""
  const venueLabel = (()=>{
    const addr = (siteSettings?.["contact.address"] as string) || event?.settings?.contact?.address || ""
    if(!addr) return ""
    const first = addr.split(",")[0].trim()
    const short = first.replace(/^(SMK Negeri 1|SMKN 1|SMA Negeri 1|SMAN 1|SMP Negeri 1|SMPN 1|MTs Negeri|MTsN)\s+/i, "").trim()
    return (short || first).toUpperCase()
  })()

  if (cms && cms.is_visible === false) return null

  const statusLabel = isActive ? "DUKUNGAN DIBUKA" : isClosed ? "DUKUNGAN DITUTUP" : isPublished ? "HASIL DIUMUMKAN" : "SEGERA DATANG"
  const showUnits = cd.isValid && !cd.expired
  const units = [
    { v: String(cd.days).padStart(2,"0"), l: "HARI" },
    { v: String(cd.hours).padStart(2,"0"), l: "JAM" },
    { v: String(cd.minutes).padStart(2,"0"), l: "MENIT" },
    { v: String(cd.seconds).padStart(2,"0"), l: "DETIK" },
  ]

  return (
    <section className="relative overflow-hidden border border-white/[0.08] bg-[#0A0A09] text-[#F2F0E9]">
      {/* BACKGROUND — logo LKBB full-bleed plek PNG (menyatu, bukan kotak mentah) */}
      <div className="absolute inset-0" aria-hidden>
        <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-40" />
        <div className="absolute inset-0 bg-[#0A0A09]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A09] via-[#0A0A09]/45 to-[#0A0A09]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A09]/90 via-transparent to-[#0A0A09]/30" />
      </div>
      {/* diagonal accents */}
      <div className="absolute right-[38%] top-0 h-full w-px rotate-[24deg] bg-[#D9FF3F]/25" aria-hidden />
      <div className="absolute right-[34%] top-0 h-full w-px rotate-[24deg] bg-white/10" aria-hidden />

      <div className="relative grid lg:grid-cols-[1fr_auto] lg:gap-8">
        {/* LEFT — headline plek PNG */}
        <div className="relative flex flex-col justify-center px-5 pb-8 pt-10 sm:px-8 lg:min-h-[560px] lg:px-12 lg:py-14">
          <h1 className="font-display font-bold leading-[0.88] tracking-[-0.03em]">
            <span className="reveal-line block text-[44px] sm:text-[56px] lg:text-[64px]"><span className="block">SUARAMU</span></span>
            <span className="reveal-line block text-[44px] sm:text-[56px] lg:text-[64px]"><span className="block">ADALAH</span></span>
            <span className="block text-[44px] text-[#D9FF3F] sm:text-[56px] lg:text-[64px]">KEKUATAN.</span>
          </h1>
          <p className="mt-4 max-w-[340px] font-body text-[12.5px] leading-relaxed text-[#B8B7B0]">
            Dukung tim favoritmu dan jadi bagian dari perjalanan mereka di LKBB{yearLabel ? ` ${yearLabel}` : ""}.
          </p>

          {dateLabel && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9FF3F]/30 bg-[#D9FF3F]/[0.06] px-3.5 py-2 text-[10px] font-bold tracking-[0.1em] text-[#D9FF3F]">
                <span className="leading-none">{dateLabel}{venueLabel && (<><br /><span className="text-[#F2F0E9]/80">{venueLabel}</span></>)}</span>
              </div>
            </div>
          )}
          <div className="mt-4">
            <Link href="/tim" className="inline-flex items-center gap-2 rounded-full bg-[#D9FF3F] px-5 py-2.5 text-[11px] font-bold tracking-wide text-black transition-transform hover:scale-[1.02]">
              LIHAT TIM PESERTA <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-[#92918C] uppercase">
            <span className="text-[#D9FF3F]">↓</span> GULIR KE BAWAH
          </div>

          {/* diagonal hairlines dekoratif */}
          <svg className="pointer-events-none absolute bottom-0 left-0 h-full w-full opacity-[0.14]" viewBox="0 0 400 560" fill="none" preserveAspectRatio="none">
            <line x1="40" y1="560" x2="240" y2="80" stroke="#F2F0E9" strokeWidth="1" />
            <line x1="90" y1="560" x2="290" y2="80" stroke="#F2F0E9" strokeWidth="0.6" />
          </svg>
        </div>

        {/* RIGHT — countdown + 2026 raksasa (di atas background) */}
        <div className="relative flex flex-col items-start justify-center gap-6 px-5 pb-10 sm:px-8 lg:min-h-[560px] lg:w-[280px] lg:items-end lg:px-0 lg:py-14 lg:pr-12">

          {/* VOTING OPEN + countdown vertikal kanan — plek PNG */}
          <div className="flex flex-row items-end gap-4 lg:flex-col lg:items-end lg:gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#D9FF3F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9FF3F] animate-pulse" /> {statusLabel}
            </div>
            <div className="flex flex-row items-end gap-4 lg:flex-col lg:items-end lg:gap-2.5">
              {showUnits && units.map(u=> (
                <div key={u.l} className="text-right">
                  <div className="font-display text-[22px] font-bold tabular-nums leading-none text-white">{u.v}</div>
                  <div className="mt-0.5 text-[8px] font-semibold tracking-[0.18em] text-white/50">{u.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* tahun event outline raksasa */}
          {yearLabel && (
            <div className="select-none font-display text-[90px] font-light leading-none tracking-tight text-transparent sm:text-[120px] lg:text-[150px]"
              style={{ WebkitTextStroke: "1px rgba(242,240,233,0.22)" }}>{yearLabel}</div>
          )}
        </div>
      </div>
    </section>
  )
}
