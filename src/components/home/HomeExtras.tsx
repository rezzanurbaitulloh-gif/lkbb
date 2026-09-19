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
  // Teks murni tanpa border dan tanpa kartu gambar.
  return (
    <section className="bg-[#0A0A09]">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">HASIL AKHIR</div>
        <h2 className="mt-2 font-display text-[30px] font-bold leading-[0.95] sm:text-[40px]">MASIH<br />DIRAHASIAKAN.</h2>
        <p className="mt-3 max-w-[320px] text-[12px] leading-relaxed text-[#92918C]">Hasil final akan diumumkan setelah acara selesai.</p>
      </div>
    </section>
  )
}
