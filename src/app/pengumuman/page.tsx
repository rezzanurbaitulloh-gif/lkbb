"use client"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"

const catColor: Record<string,string> = {
  Important:"bg-red-500 text-black",
  Penting:"bg-red-500 text-black",
  Voting:"bg-primary text-black",
  Dukungan:"bg-primary text-black",
  Schedule:"bg-secondary text-foreground",
  Jadwal:"bg-secondary text-foreground",
  Payment:"bg-emerald-500 text-black",
  Pembayaran:"bg-emerald-500 text-black",
  Competition:"bg-[#1A1C1E] text-white dark:bg-white dark:text-black",
  Kompetisi:"bg-[#1A1C1E] text-white dark:bg-white dark:text-black",
  Result:"bg-[#A51D2D] text-white",
  Hasil:"bg-[#A51D2D] text-white",
}

export default function PengumumanPage(){
  const [announcements,setAnnouncements]=useState<any[]>([])
  useEffect(()=>{ const s=createBrowserSupabase(); s.from("announcements").select("*").order("created_at",{ascending:false}).then(({data})=> setAnnouncements(data||[])) },[])
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Informasi Resmi</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em]">PENGUMUMAN</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6 space-y-3">
          {announcements.map(a=> (
            <div key={a.id} className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-widest ${catColor[a.category] || "bg-white/5 backdrop-blur"}`}>{a.category.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </div>
              <h3 className="mt-2 text-[15px] font-black leading-tight">{a.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
