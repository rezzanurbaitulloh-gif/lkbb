"use client"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"

export function ParticipantsBoard({ smp, sma }: { smp: any[]; sma: any[] }){
  const [tab, setTab] = useState<"SMA"|"SMP">("SMA")
  const teams = tab==="SMA" ? sma : smp
  const scroller = useRef<HTMLDivElement>(null)

  const ordered = useMemo(()=> [...(teams||[])].sort((a:any,b:any)=>{
    const an = parseInt(String(a.number).replace(/^0+/,"")||"0")
    const bn = parseInt(String(b.number).replace(/^0+/,"")||"0")
    return an-bn
  }),[teams])

  const scrollBy = (dir: number)=>{
    scroller.current?.scrollBy({ left: dir*320, behavior: "smooth" })
  }

  return (
    <section className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="meta-label">PARTICIPANTS</div>
            <h1 className="mt-2 font-display text-[30px] font-bold leading-[0.9] tracking-[-0.03em] text-[#F2F0E9] sm:text-[40px]">
              WHO WILL<br />THE CROWD<br /><span className="text-[#D9FF3F]">CHOOSE?</span>
            </h1>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] p-1">
            {(["SMA","SMP"] as const).map(t=> (
              <button key={t} onClick={()=> setTab(t)}
                className={`rounded-full px-4 py-1.5 text-[10px] font-bold tracking-[0.12em] transition-colors ${tab===t ? "bg-[#D9FF3F] text-black" : "text-[#92918C] hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {ordered.length===0 ? (
          <p className="mt-8 border border-dashed border-white/10 py-10 text-center text-sm text-[#92918C]">Belum ada peleton {tab}.</p>
        ) : (
          <>
            <div ref={scroller} className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
              {ordered.map((p:any, idx:number)=> {
                const num = String(p.number||idx+1).padStart(2,"0")
                return (
                  <article key={p.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                    <div className="font-display text-[64px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.35)" }}>{num}</div>
                    <Link href={`/tim/${p.slug}`} className="group relative mt-2 block aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]">
                      <img src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"} alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading={idx<3?"eager":"lazy"} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </Link>
                    <div className="mt-3">
                      <div className="font-display text-[13px] font-bold tracking-tight text-[#F2F0E9] truncate">{p.name || p.school}</div>
                      <div className="mt-0.5 font-body text-[11px] font-medium text-[#92918C] truncate">{p.school?.toUpperCase?.() || p.name}</div>
                      <div className="mt-1 font-body text-[9px] tracking-[0.14em] text-[#92918C]">{p.category} • KERTOSONO</div>
                      <Link href={`/dukungan?peleton=${p.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-[#D9FF3F] hover:underline">
                        ✦ SUPPORT →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
              <button onClick={()=> scrollBy(-1)} aria-label="Prev" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] hover:bg-white/5">←</button>
              <button onClick={()=> scrollBy(1)} aria-label="Next" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] hover:bg-white/5">→</button>
              <span className="ml-2 font-body text-[11px] tabular-nums text-[#92918C]">1 / {Math.max(ordered.length,10)}</span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
