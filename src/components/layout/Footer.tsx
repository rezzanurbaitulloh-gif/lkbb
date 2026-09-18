"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export function Footer({ siteSettings }: { siteSettings?: Record<string, any> } = {}){
  const [dynamic, setDynamic]=useState<Record<string,any>>(siteSettings||{})
  useEffect(()=>{
    if(siteSettings && Object.keys(siteSettings).length>0){ setDynamic(siteSettings) }
    else {
      fetch("/api/cms/settings").then(r=> r.json()).then(j=> { if(j.settings) setDynamic(j.settings) }).catch(()=>{})
    }
  },[siteSettings])

  const siteDesc = (dynamic["site.description"] as string) || "One Event. One Voice."

  return (
    <footer className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="font-display text-[15px] font-bold tracking-tight text-[#F2F0E9]">LKBB <span className="text-[11px] text-[#D9FF3F]">☀</span></div>
          <p className="mt-2 font-body text-[12px] text-[#92918C]">{siteDesc}</p>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="Instagram" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[11px] text-[#F2F0E9] hover:bg-white/5">IG</a>
            <a href="#" aria-label="Youtube" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[11px] text-[#F2F0E9] hover:bg-white/5">YT</a>
            <a href="#" aria-label="Tiktok" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[11px] text-[#F2F0E9] hover:bg-white/5">TT</a>
          </div>
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
          <div className="meta-label">Supported by</div>
          <div className="mt-3 flex gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] text-[12px]">◈</div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] text-[12px]">⬢</div>
          </div>
          <p className="mt-4 font-body text-[11px] leading-relaxed text-[#92918C]">Semarak Dirgahayu Talenta Generasi.<br />© 2026 LKBB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
