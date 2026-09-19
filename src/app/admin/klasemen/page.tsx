"use client"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { useOwnEventFilter } from "@/hooks/useOwnEventFilter"
import { Podium } from "@/components/competition/Podium"
export default function AdminKlasemen(){
  const [smp,setSmp]=useState<any[]>([])
  const [sma,setSma]=useState<any[]>([])
  const [isFinal,setIsFinal]=useState(false)
  const { ready: evReady, isSuper: evSuper, eventIds: ownEvents } = useOwnEventFilter()
  const load = async ()=>{
    if(!evReady) return
    const s=createBrowserSupabase()
    // list ranking pakai total (online+offline), podium preview online saja
    let qSmp: any = s.from("team_ranking").select("*").eq("category","SMP").order("total_ballots",{ascending:false}).order("online_ballots",{ascending:false})
    let qSma: any = s.from("team_ranking").select("*").eq("category","SMA").order("total_ballots",{ascending:false}).order("online_ballots",{ascending:false})
    if(!evSuper && ownEvents.length>0){ qSmp = qSmp.in("event_id", ownEvents); qSma = qSma.in("event_id", ownEvents) }
    const { data: smpData } = await qSmp
    const { data: smaData } = await qSma
    if(smpData) setSmp(smpData)
    if(smaData) setSma(smaData)
    // status final (sudah gabung rekap offline): jumlah di podium disembunyikan
    const { data: ev } = await s.from("competitions").select("state").order("created_at",{ascending:false}).limit(1).single()
    const st = (ev as any)?.state as string
    setIsFinal(st === "RESULT_PUBLISHED" || st === "COMPLETED")
  }
  useEffect(()=>{ if(!evReady) return; load(); const i=setInterval(load,4000); const sup=createBrowserSupabase(); const ch=sup.channel("klasemen-podium").on("postgres_changes",{event:"*",schema:"public",table:"supports"},()=> load()).subscribe(); return ()=>{ clearInterval(i); sup.removeChannel(ch) } },[evReady])
  const Section = ({title, list}:{title:string, list:any[]})=> (
    <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black">{title}</h3>
        <span className="text-[11px] text-muted-foreground">{list.length} tim • on/off/tot</span>
      </div>
      <div className="mt-3 space-y-1">
        {list.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada ranking.</div> :
          list.map((p,i)=> (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-2.5">
            <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-black shrink-0 ${i===0 ? "bg-primary text-black" : i===1 ? "bg-zinc-300 text-black" : i===2 ? "bg-amber-700 text-black" : "bg-white/[0.04] backdrop-blur"}`}>{i+1}</div>
            <img src={p.image_url || p.image} alt="" className="h-8 w-8 rounded-full object-cover border shrink-0"/>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">#{p.number} {p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.school} • on {Number(p.online_ballots??0).toLocaleString("id-ID")} • off {Number(p.offline_ballots??0).toLocaleString("id-ID")} • <b className="text-foreground">{Number(p.total_ballots??0).toLocaleString("id-ID")} total</b></div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-black tabular-nums text-primary">{Number(p.total_ballots??0).toLocaleString("id-ID")}</div>
              <div className="text-[11px] tabular-nums text-muted-foreground">on {Number(p.online_ballots??0).toLocaleString("id-ID")}</div>
            </div>
          </div>
        ))}
      </div>
      {list.length>0 && <p className="mt-2 text-[11px] text-muted-foreground">Podium di atas preview online saja — tabel ini total lengkap.</p>}
    </div>
  )
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black">Klasemen — Admin</h1>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
      </div>

      {/* Podium realtime — preview online saja */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[16px] border border-primary/20 bg-white/[0.03] backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">🏆 PODIUM SMP <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></h3>
            <span className="text-[10px] text-muted-foreground">Online preview</span>
          </div>
          <div className="mt-3">
            {smp.length===0 ? <div className="h-[200px] grid place-items-center text-sm text-muted-foreground">Belum ada data</div> : <div className="scale-[0.9] origin-top"><Podium teams={smp.slice(0,3)} showCounts={!isFinal} /></div>}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">Podium preview online saja</p>
        </div>
        <div className="rounded-[16px] border border-primary/20 bg-white/[0.03] backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">🏆 PODIUM SMA <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></h3>
            <span className="text-[10px] text-muted-foreground">Online preview</span>
          </div>
          <div className="mt-3">
            {sma.length===0 ? <div className="h-[200px] grid place-items-center text-sm text-muted-foreground">Belum ada data</div> : <div className="scale-[0.9] origin-top"><Podium teams={sma.slice(0,3)} showCounts={!isFinal} /></div>}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">Podium preview online saja</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="SMP / Sederajat" list={smp} />
        <Section title="SMA / Sederajat" list={sma} />
      </div>
    </div>
  )
}
