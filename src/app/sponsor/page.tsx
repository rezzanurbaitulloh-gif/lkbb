"use client"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"

const tiers = [
  { en: "Main Sponsor", id: "SPONSOR UTAMA" },
  { en: "Official Partner", id: "MITRA RESMI" },
  { en: "Supporting Partner", id: "MITRA PENDUKUNG" },
  { en: "Media Partner", id: "MITRA MEDIA" },
] as const

export default function SponsorPage(){
  const [sponsors,setSponsors]=useState<any[]>([])
  useEffect(()=>{ const s=createBrowserSupabase(); s.from("sponsors").select("*").eq("active", true).order("display_order").then(({data})=> setSponsors(data||[])) },[])
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Mitra & Sponsor</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em]">SPONSOR</h1>
            <p className="mt-2 text-sm text-white/60">Terima kasih kepada mitra yang mendukung terselenggaranya LKBB Javasoma.</p>
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 space-y-8">
          {tiers.map(tier=> {
            const list = sponsors.filter(s=>s.tier===tier.en)
            if(list.length===0) return null
            return (
              <div key={tier.en} className="rounded-[16px] border border-primary bg-primary p-6">
                <h2 className="text-xs font-black tracking-[0.14em] text-black">{tier.id}</h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {list.map(s=> (
                    <div key={s.id} className="rounded-xl border border-primary bg-primary p-4 grid place-items-center h-[84px] text-center">
                      <div className="text-sm font-black tracking-tight text-black">{s.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="rounded-[16px] border border-dashed border-primary bg-primary/10 backdrop-blur p-6 text-center">
            <div className="text-sm font-bold text-white">Tertarik menjadi sponsor?</div>
            <p className="text-xs text-white/70">Hubungi panitia untuk paket sponsorship.</p>
            <a href="/kontak" className="inline-flex mt-3 rounded-full bg-primary border border-primary text-black px-5 py-2 text-xs font-bold">Hubungi Kami</a>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
