"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export function Footer({ siteSettings }: { siteSettings?: Record<string, any> } = {}){
  const [dynamic, setDynamic]=useState<Record<string,any>>(siteSettings||{})
  const [sponsors, setSponsors]=useState<any[]>([])
  useEffect(()=>{
    if(siteSettings && Object.keys(siteSettings).length>0){ setDynamic(siteSettings) }
    else {
      fetch("/api/cms/settings").then(r=> r.json()).then(j=> { if(j.settings) setDynamic(j.settings) }).catch(()=>{})
    }
    fetch("/api/sponsors").then(r=> r.json()).then(j=> { if(j.enabled) setSponsors(j.sponsors||[]) }).catch(()=>{})
  },[siteSettings])

  const siteDesc = (dynamic["site.description"] as string) || "One Event. One Voice."
  const socials = [
    { k:"IG", label:"Instagram", url: dynamic["social.instagram"] as string },
    { k:"YT", label:"Youtube", url: dynamic["social.youtube"] as string },
    { k:"TT", label:"Tiktok", url: dynamic["social.tiktok"] as string },
  ].filter(s=> typeof s.url === "string" && s.url.length>0)
  const year = new Date().getFullYear()

  return (
    <footer className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="font-display text-[15px] font-bold tracking-tight text-[#F2F0E9]">LKBB <span className="text-[11px] text-[#D9FF3F]">☀</span></div>
          <p className="mt-2 font-body text-[12px] text-[#92918C]">{siteDesc}</p>
          {socials.length>0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(s=> (
                <a key={s.k} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[11px] text-[#F2F0E9] hover:bg-white/5">{s.k}</a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="meta-label">Menu</div>
          <ul className="mt-3 space-y-2 font-body text-[12px] text-[#92918C]">
            <li><Link href="/kompetisi" className="hover:text-[#F2F0E9]">Event</Link></li>
            <li><Link href="/tim" className="hover:text-[#F2F0E9]">Participants</Link></li>
            <li><Link href="/dukungan" className="hover:text-[#F2F0E9]">Voting</Link></li>
            <li><Link href="/profile" className="hover:text-[#F2F0E9]">Results</Link></li>
          </ul>
        </div>
        <div>
          {sponsors.length>0 ? (
            <>
              <div className="meta-label">Supported by</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sponsors.slice(0,6).map((s:any)=> (
                  s.logo_url && /^https?:\/\//.test(s.logo_url) ? (
                    <img key={s.id} src={s.logo_url} alt={s.name} title={s.name} className="h-9 w-9 rounded-full border border-white/[0.08] object-cover" />
                  ) : (
                    <span key={s.id} title={`${s.name}${s.tier ? " • " + s.tier : ""}`} className="grid h-9 min-w-9 place-items-center rounded-full border border-white/[0.08] px-2 text-[10px] font-bold">{String(s.name||"?").slice(0,2).toUpperCase()}</span>
                  )
                ))}
              </div>
            </>
          ) : null}
          <p className="mt-4 font-body text-[11px] leading-relaxed text-[#92918C]">Semarak Dirgahayu Talenta Generasi.<br />© {year} LKBB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
