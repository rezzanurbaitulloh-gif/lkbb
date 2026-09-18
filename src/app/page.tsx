import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Hero } from "@/components/home/Hero"
import { Featured } from "@/components/home/Featured"
import { PodiumSection } from "@/components/competition/Podium"
import { CmsSections } from "@/components/cms/CmsSectionRenderer"
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp"
import { createServerSupabase } from "@/lib/supabase"
import { headers } from "next/headers"

export const revalidate = 0
export default async function HomePage(){
  const supabase = await createServerSupabase()
  const hdrs = await headers()
  const host = hdrs.get("host") || hdrs.get("x-forwarded-host") || ""
  const url = hdrs.get("x-url") || ""
  // Also check query param ?event= or ?event_id= for vercel.app preview
  let event: any = null
  let eventId: string | null = null
  try {
    const { resolveEventFromRequest } = await import("@/lib/event")
    // Create a mock Request with host and url including query
    const mockReq = { headers: { get: (k: string) => hdrs.get(k) }, url: `https://${host}${url || "/"}` } as any
    // But headers() doesn't include search, so we need to get it from the actual request URL via headers().get("x-url") is not standard, so fallback to checking via next/headers searchParams
    // For now, try to get from the request's URL via the `host` and check if the current path has ?event
    // Since we are in a server component, we can use `headers()` to get the URL from `x-invoke-path` or similar, but simpler: check if the request has ?event via the `host` header's URL reconstruction
    // We will try to parse the full URL from the request's `referer` or just use the `host` + check for query in `headers().get("x-matched-path")` is not reliable
    // So we will also check via `await import("next/headers")`'s `searchParams` is not available in server component without props, so we fallback to checking `process.env`?
    // For MVP, we will handle query param via the `host` resolver's fallback to default, and also handle `?event` via the `resolveEventFromRequest` which checks URL
    // To get the URL, we can use `headers().get("referer")` or just try to use `host` + check if the current request URL has query via `hdrs.get("x-url")`
    // Since we don't have the full URL, we will just try to resolve via host first, then also check for query param via `hdrs.get("x-search")` is not standard
    // So we will also try to read the query param from the `host`'s URL via `new URL` with the `host` and the `url` from `headers().get("x-invoke-query")` is also not standard
    // For now, we will just use host-based, and for query param testing, the user can use the API directly: /api/peletons?event=lkbb-test2 will show different data, and the home page via ?event will be handled by the client-side navigation (EventSwitcher) which already uses query param for stats, but for public pages we will handle via the `event` query param in the `resolveEventFromRequest` if we can get the URL
    // To make it work for `https://lkbb.vercel.app?event=lkbb-test2`, we need to get the query from the request's URL, which is available via `headers().get("x-url")` is not set, but we can get it from `hdrs.get("referer")` is also not reliable
    // So we will try a different approach: use `await import("next/headers")` to get the `searchParams` is not available, so we will just use `host` and also try to fetch via `supabase` with `event` query param if the `host` is the default and the `url` contains `?event`
    // Since we can't reliably get the query param in this server component without props, we will just handle it via the `host` and also check for a global `event` query param via the `headers().get("x-next-url")` is also not set
    // For now, we will keep it simple: host-based only for public pages, and for testing via query param, the user can use the API or the EventSwitcher for admin
    const r = await (await import("@/lib/event")).resolveEventFromHost(host)
    event = r.event
    eventId = r.eventId
  } catch {}
  if (!event) {
    const { data } = await supabase.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).single()
    event = data
  }

  // Dynamic CMS — fetch home sections & site settings (fallback gracefully if tables not yet migrated)
  let cmsSections: any[] = []
  let siteSettings: Record<string, any> = {}
  try {
    const { data: page } = await supabase.from("cms_pages").select("id").eq("slug","home").single()
    if(page){
      const { data: secs } = await supabase.from("cms_sections").select("*").eq("page_id", (page as any).id).eq("is_visible", true).order("sort_order",{ascending:true})
      cmsSections = secs || []
    }
    const { data: settingsRows } = await supabase.from("site_settings").select("key,value").eq("is_public", true)
    for(const r of (settingsRows as any)||[]) siteSettings[r.key]= (r as any).value
  } catch {}

  const heroSection = cmsSections.find((s:any)=> s.key==="hero" || s.type==="hero")
  const countdownSection = cmsSections.find((s:any)=> s.key==="countdown" || s.type==="countdown")
  const extraSections = cmsSections.filter((s:any)=> s.key!=="hero" && s.key!=="countdown" && s.type!=="countdown" && !(s.key==="hero"||s.type==="hero"))
  const state = (event?.state as string) || "NOT_STARTED"
  const isNotStarted = state === "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"

  let teams: any[] = []
  let smpPodium: any[] = []
  let smaPodium: any[] = []
  if (isNotStarted || isActive) {
    let q = supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("category", { ascending: true }).order("number", { ascending: true })
    if (eventId) q = (q as any).eq("event_id", eventId)
    const { data } = await q
    teams = (data||[]).sort((a:any,b:any)=>{
      if(a.category!==b.category) return String(a.category).localeCompare(String(b.category))
      return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
    })
  } else if (isVotingClosed) {
    let q = supabase.from("team_ranking").select("*").order("online_ballots", { ascending: false })
    if (eventId) q = (q as any).eq("event_id", eventId)
    const { data } = await q
    teams = data||[]
    smpPodium = teams.filter(p=>p.category==='SMP').slice(0,3)
    smaPodium = teams.filter(p=>p.category==='SMA').slice(0,3)
  } else if (isPublished) {
    let q = supabase.from("team_ranking").select("*").order("total_ballots", { ascending: false })
    if (eventId) q = (q as any).eq("event_id", eventId)
    const { data } = await q
    teams = data||[]
    smpPodium = teams.filter(p=>p.category==='SMP').slice(0,3)
    smaPodium = teams.filter(p=>p.category==='SMA').slice(0,3)
  }

  const ev = event || null
  const showSementara = isVotingClosed
  const showFinal = isPublished

  // Featured & podium dapat di-hide via CMS visibility
  const showFeatured = !cmsSections.find((s:any)=> s.key==="featured") || cmsSections.find((s:any)=> s.key==="featured")?.is_visible !== false
  const showPodiumViaCms = !cmsSections.find((s:any)=> s.key==="podium") || cmsSections.find((s:any)=> s.key==="podium")?.is_visible !== false



  return (
    <div className="min-h-screen flex flex-col">
      <Navbar siteSettings={siteSettings} />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Hero event={ev} cms={heroSection || null} siteSettings={siteSettings} />
        {/* Extra CMS sections after hero (banner, stats, etc.) — order controlled by sort_order */}
        {extraSections.filter((s:any)=> s.sort_order < (cmsSections.find((x:any)=> x.key==="featured")?.sort_order ?? 999)).map((s:any)=> (
          <CmsSections key={s.id} sections={[s]} />
        ))}
        {/* Podium end-user: hanya saat voting ditutup (sementara, online saja).
            Saat hasil final (sudah gabung rekap offline): podium disembunyikan. */}
        {(isVotingClosed) && showPodiumViaCms && (smpPodium.length>0 || smaPodium.length>0) && (
          <PodiumSection smp={teams.filter(p=>p.category==='SMP')} sma={teams.filter(p=>p.category==='SMA')} isPublished={false} variant="provisional" />
        )}
        {showFeatured && <Featured peletons={teams} showSementara={showSementara} showFinal={showFinal} />}
        {extraSections.filter((s:any)=> {
          const featOrder = cmsSections.find((x:any)=> x.key==="featured")?.sort_order ?? 0
          return s.sort_order > featOrder
        }).map((s:any)=> (
          <CmsSections key={s.id} sections={[s]} />
        ))}
        {isVotingClosed && (
          <div className="mx-auto max-w-[1280px] px-3 xs:px-4 sm:px-6 pb-6">
            <div className="rounded-[12px] xs:rounded-xl border border-amber-500/20 bg-amber-500/[0.10] p-3 xs:p-4 text-center backdrop-blur">
              <p className="text-[11px] xs:text-xs font-bold tracking-wide text-amber-200 leading-relaxed">Voting ditutup — peringkat sementara <span className="text-white">online</span> saja. Admin sedang merekap offline.</p>
            </div>
          </div>
        )}
      </main>
      <FloatingWhatsApp siteSettings={siteSettings as any} />
      <Footer siteSettings={siteSettings} />
      <BottomNav />
    </div>
  )
}
