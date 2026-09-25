"use client"
import Link from "next/link"
import { useState } from "react"

export function ParticipantsMini({ teams, showCount }: { teams: any[]; showCount?: boolean }){
  const [tab, setTab] = useState<"SMA"|"SMP">("SMA")
  const byCat = (c: string)=> teams.filter(t=> t.category===c).slice(0,3)
  const list = byCat(tab).length>0 ? byCat(tab) : teams.slice(0,3)
  return (
    <section className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-bold tracking-tight">PARA PESERTA</h2>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] p-1">
            {(["SMA","SMP"] as const).map(t=> (
              <button key={t} onClick={()=> setTab(t)}
                className={`rounded-full px-3 py-1 text-[9px] font-bold transition-colors ${tab===t ? "bg-[#D9FF3F] text-black" : "text-[#92918C] hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 divide-y divide-white/[0.06]">
          {list.length===0 && <p className="py-8 text-center text-sm text-[#92918C]">Belum ada peleton.</p>}
          {list.map((p:any,i:number)=> {
            const count = p.online_ballots ?? p.total_ballots
            return (
              <Link key={p.id||i} href={`/tim/${p.slug}`} className="group flex items-center gap-4 py-3.5">
                <span className="font-display text-[36px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.3)" }}>{String(i+1).padStart(2,"0")}</span>
                <img src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"} alt="" className="h-9 w-9 rounded-md border border-white/[0.08] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[12px] font-bold">{p.name}</span>
                  <span className="block truncate text-[10px] tracking-[0.12em] text-[#92918C]">{p.school || p.category}</span>
                </span>
                {showCount && count!=null ? (
                  <span className="text-[12px] font-bold tabular-nums text-[#F2F0E9]">{Number(count).toLocaleString("id-ID")} suara</span>
                ) : (
                  <span className="text-[11px] font-bold tabular-nums text-[#92918C]">#{String(p.number||"").padStart(2,"0")}</span>
                )}
              </Link>
            )
          })}
        </div>
        <div className="mt-2 text-right">
          <Link href="/tim" className="text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white">LIHAT SEMUA →</Link>
        </div>
      </div>
    </section>
  )
}

export function ResultsTeaser(){
  // Teks berjalan (marquee) di tengah — bukan blok kiri.
  const row = Array.from({ length: 6 })
  return (
    <section className="overflow-hidden border-y border-white/[0.06] bg-[#0A0A09] py-8" aria-label="Hasil akhir">
      <style>{`@keyframes hasilmarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } } @media (prefers-reduced-motion: reduce) { .hasil-marquee { animation: none !important; } }`}</style>
      <div className="text-center text-[10px] font-bold tracking-[0.2em] text-[#92918C]">HASIL AKHIR</div>
      <div className="relative mt-3 overflow-hidden" aria-hidden={false}>
        <div className="hasil-marquee flex w-max items-center gap-8 pr-8" style={{ animation: "hasilmarquee 22s linear infinite" }}>
          {row.map((_, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap">
              <span className="font-display text-[28px] sm:text-[36px] font-bold tracking-tight text-[#F2F0E9]">MASIH DIRAHASIAKAN.</span>
              <span className="font-display text-[28px] sm:text-[36px] font-bold text-[#D9FF3F]">✦</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[12px] text-[#92918C]">Hasil final akan diumumkan setelah acara selesai.</p>
    </section>
  )
}
