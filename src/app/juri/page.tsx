"use client"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"

export default function JuriPage(){
  const [judges,setJudges]=useState<any[]>([])
  useEffect(()=>{ const s=createBrowserSupabase(); s.from("judges").select("*").eq("active", true).order("sort_order").then(({data})=> setJudges(data||[])) },[])
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Dewan Juri</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em]">JURI KOMPETEN</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            {judges.map(j=> (
              <div key={j.id} className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-white/5 backdrop-blur">
                  {(j.photo_url || j.photo) ? (
                    <img src={j.photo_url || j.photo} alt={j.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gradient-to-br from-[#141412] to-[#0A0A09]" role="img" aria-label={`Foto ${j.name} menyusul`}>
                      <div className="grid h-20 w-20 place-items-center rounded-full border border-[#D9FF3F]/40 bg-[#D9FF3F]/10">
                        <span className="font-display text-2xl font-black text-[#D9FF3F]">{String(j.name||"?").split(" ").filter(Boolean).slice(0,2).map((w:string)=> w[0]).join("").toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="inline-flex rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold tracking-widest text-black">{j.role}</div>
                  <h3 className="mt-3 text-[16px] font-black leading-tight">{j.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{j.bio}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
            <h3 className="text-sm font-black">Kriteria Penilaian</h3>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {[
                ["PBB Dasar 40%","Ketepatan gerakan, keseragaman, kedisiplinan"],
                ["Variasi 30%","Kreativitas, kekompakan, yel-yel"],
                ["Formasi 30%","Keindahan transisi, kekompakan, presisi"],
              ].map(([t,d])=> (
                <div key={t} className="rounded-xl bg-white/5 backdrop-blur p-4 text-center">
                  <div className="text-sm font-black">{t}</div>
                  <div className="text-xs text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
