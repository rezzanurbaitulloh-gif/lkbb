"use client"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { Check } from "lucide-react"

export function TimelinePreview(){
  const [timelineStages,setTimeline]=useState<any[]>([])
  useEffect(()=>{
    const supabase = createBrowserSupabase()
    supabase.from("timeline_stages").select("*").order("sort_order").then(({data})=> setTimeline(data||[]))
  },[])
  return (
    <section className="border-t border-white/10 bg-white/5 backdrop-blur">
      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-10">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-black tracking-tight">TIMELINE KOMPETISI</h3>
          <a href="/timeline" className="text-xs font-semibold text-primary hover:underline">Lihat Timeline →</a>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {timelineStages.map(s=> (
            <div key={s.id} className={`rounded-2xl border p-3 ${s.status==="current" ? "border-primary/20 bg-primary/5" : s.status==="completed" ? "border-white/10 bg-white/5 backdrop-blur" : "border-dashed bg-transparent"}`}>
              <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-black ${s.status==="completed" ? "bg-[#10B981] text-black" : s.status==="current" ? "bg-primary text-black" : "bg-white/5 backdrop-blur text-muted-foreground"}`}>
                {s.status==="completed" ? <Check className="h-4 w-4"/> : s.sort_order}
              </div>
              <div className="mt-2 text-[12px] font-bold leading-tight line-clamp-1">{s.title}</div>
              <div className="text-[11px] text-muted-foreground">{s.date}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
