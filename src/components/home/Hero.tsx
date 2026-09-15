"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CaraDukungDialog } from "./CaraDukungDialog"

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
  const siteBg = siteSettings?.["hero.background_image"] || siteSettings?.["hero.backgroundImage"]
  const siteOverlay = siteSettings?.["hero.overlay_opacity"] || siteSettings?.["hero.overlayOpacity"]
  const siteLogo = siteSettings?.["hero.logo_image"] || siteSettings?.["hero.logoImage"]
  const cmsContent = cms?.content || {}
  const cmsSettings = cms?.settings || {}
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
  const countdownLabel = (() => {
    if (isActive) return "MENUJU PENUTUPAN VOTING"
    if (isNotStarted) return "MENUJU PEMBUKAAN VOTING"
    if (isClosed) return "VOTING DITUTUP"
    if (isPublished) return "ACARA SELESAI"
    return cmsContent.title || "EVENT DIMULAI DALAM"
  })()
  const showCountdown = (() => {
    if (!cd.isValid) return false
    if (cd.expired) return false
    if (isClosed || isPublished) return false
    return true
  })()
  const votingEnd = event?.voting_end || cmsContent.fallbackDate || "2026-10-24T23:59:59+07:00"
  const [caraOpen, setCaraOpen] = useState(false)
  const bgImage = (typeof siteBg === "string" && siteBg.trim() ? siteBg.replace(/^"|"$/g,"") : null) || cmsContent.backgroundImage || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1600&auto=format&fit=crop&q=70"
  const logoImage = (typeof siteLogo === "string" && siteLogo.trim() ? siteLogo.replace(/^"|"$/g,"") : null) || cmsContent.logoImage || "/assets/brand/lkbb-logo.jpg"
  const eyebrow = cmsContent.eyebrow || "LKBB • JAVASOMA THE IMPRESSION"
  const heading1 = cmsContent.headingLine1 || "PELETON"
  const heading2 = cmsContent.headingLine2 || "TERFAVORIT"
  const subtitle = cmsContent.subtitle || "LKBB"
  const subtitle2 = cmsContent.subtitle2 || "JAVASOMA THE IMPRESSION"
  const tagline = cmsContent.tagline || "ASTRA DHARMA HAYUNING BUDAYA"
  const ctaPrimaryLabel = cmsContent.ctaPrimaryLabel || "LIHAT PESERTA"
  const ctaPrimaryLink = cmsContent.ctaPrimaryLink || "/tim"
  const ctaSecondaryLabel = cmsContent.ctaSecondaryLabel || "CARA DUKUNG"
  const overlayOpacity = (siteOverlay !== undefined && siteOverlay !== null && String(siteOverlay).trim() !== "" ? parseFloat(String(siteOverlay).replace(/"/g,"")) : null) ?? cmsSettings.overlayOpacity ?? cmsContent.overlayOpacity ?? 0.32
  const showLogo = cmsSettings.showLogo === true || cmsContent.showLogo === true
  const logoOpacity = cmsSettings.logoOpacity ?? cmsContent.logoOpacity ?? 0
  const bgPosition = cmsSettings.bgPosition || "center"
  const logoAsBackground = cmsSettings.logoAsBackground === true
  if (cms && cms.is_visible === false) return null
  return (
    <section className="relative overflow-hidden bg-[#09090b] text-white">
      <div className="absolute inset-0">
        <img src={bgImage} alt="" className="h-full w-full object-cover" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/30 via-[#09090b]/55 to-[#09090b]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent" />
      </div>

      {showLogo && logoAsBackground && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <img src={logoImage} alt="" aria-hidden="true" className="h-[380px] w-[380px] sm:h-[480px] sm:w-[480px] lg:h-[620px] lg:w-[620px] max-h-[75vh] max-w-[92vw] object-contain select-none" style={{ opacity: logoOpacity, objectPosition: bgPosition }} />
        </div>
      )}
      {showLogo && !logoAsBackground && (
        <div className="absolute right-[3%] top-[8%] hidden lg:flex pointer-events-none opacity-20">
          <img src={logoImage} alt="" className="h-[220px] w-[220px] object-contain" style={{ opacity: logoOpacity * 2 }} />
        </div>
      )}
      <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6">
        <div className="pt-8 sm:pt-10 md:pt-14 pb-6 md:pb-8">
          <div className="mx-auto max-w-[720px] text-center flex flex-col items-center px-1">
            <div className="inline-flex max-w-full items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="h-px w-6 sm:w-8 bg-primary shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] sm:tracking-[0.18em] text-primary break-words text-center">{eyebrow}</span>
              <span className="h-px w-6 sm:w-8 bg-primary shrink-0" />
            </div>
            <h1 className="mt-3 text-balance font-black leading-[0.84] tracking-[-0.035em] text-center max-w-full break-words animate-[fadeIn_0.7s_ease-out] px-1">
              <span className="block text-[32px] xs:text-[36px] sm:text-[42px] md:text-[56px] lg:text-[68px] xl:text-[76px] leading-[0.88] font-display gold-gradient-text text-gold-glow">{heading1}</span>
              <span className="block text-[32px] xs:text-[36px] sm:text-[42px] md:text-[56px] lg:text-[68px] xl:text-[76px] leading-[0.88] font-display text-white">{heading2}</span>
            </h1>
            <div className="mt-3 text-center max-w-full space-y-1">
              <div className="text-[11px] sm:text-[13px] font-bold tracking-[0.14em] sm:tracking-[0.18em] text-white break-words">{subtitle} <span className="text-primary">•</span> {subtitle2}</div>
              <div className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.14em] text-primary font-bold break-words">{tagline}</div>
              <div className="text-[11px] sm:text-[12px] font-medium tracking-wide text-white/60 break-words">Lomba Keterampilan Baris-Berbaris • PASKIBRA Satria Cengkara SMKN 1 Kertosono</div>
            </div>
            <div className="mt-5 xs:mt-6 flex flex-col xs:flex-row flex-wrap gap-2.5 sm:gap-3 justify-center items-center w-full xs:w-auto px-1 xs:px-0">
              <Link href={ctaPrimaryLink} className="w-full xs:w-auto">
                <Button size="lg" className="w-full xs:w-auto rounded-full px-6 xs:px-7 h-[44px] xs:h-[44px] text-[13px] xs:text-sm font-black tracking-wide shadow-[0_4px_16px_rgba(201,168,106,0.22)]">{ctaPrimaryLabel}</Button>
              </Link>
              <Button onClick={()=> setCaraOpen(true)} variant="ghost" size="default" className="w-full xs:w-auto rounded-full px-5 h-[36px] xs:h-[38px] text-xs xs:text-[13px] font-semibold tracking-wide border border-white/10 bg-white/5 backdrop-blur text-white hover:text-white hover:bg-white/10">{ctaSecondaryLabel}</Button>
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
                    <div key={item.l} className="rounded-[10px] sm:rounded-[12px] border border-white/10 bg-[#0B0C0F]/80 backdrop-blur py-2 xs:py-2.5 sm:py-3 md:py-4 px-0.5 xs:px-1">
                      <div className="tabular-nums text-[22px] xs:text-[26px] sm:text-[28px] md:text-[32px] font-black leading-none text-white">{String(item.v).padStart(2,"0")}</div>
                      <div className="mt-1 text-[8px] xs:text-[9px] sm:text-[10px] font-bold tracking-[0.10em] sm:tracking-[0.14em] text-white/50">{item.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-white/50 tabular-nums">{cd.days} hari lagi • {canonicalTarget ? new Date(canonicalTarget as string).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}) : ""}</div>
              </>
            ) : isClosed ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-black tracking-wide text-amber-200">VOTING DITUTUP — MENUNGGU REKAP OFFLINE</span>
              </div>
            ) : isPublished ? (
              <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-center shadow">
                <span className="text-[11px] font-black tracking-wide text-black">HASIL TELAH DIREKAP DAN AKAN DIUMUMKAN OLEH PANITIA</span>
              </div>
            ) : isNotStarted ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-[11px] font-bold tracking-wide text-white/70">SEGERA DIBUKA</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
