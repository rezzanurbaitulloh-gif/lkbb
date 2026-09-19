import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { createServerSupabase } from "@/lib/supabase"
import { Check, Clock } from "lucide-react"

export const revalidate = 0

export default async function TimelinePage(){
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("timeline_stages").select("*").order("sort_order")
  const timelineStages = data || []
  let ev: any = null
  try {
    const { data: e } = await supabase.from("competitions").select("state,voting_start,voting_end,event_date").order("created_at", { ascending: false }).limit(1).single()
    ev = e
  } catch {}
  const state = (ev?.state as string) || ""
  const stateLabel = state==="ACTIVE"||state==="VOTING_OPEN" ? "DUKUNGAN DIBUKA" : state==="VOTING_CLOSED" ? "DUKUNGAN DITUTUP" : state==="RESULT_PUBLISHED" ? "HASIL DIUMUMKAN" : state==="NOT_STARTED" ? "SEGERA DATANG" : "JADWAL KOMPETISI"
  const fmtDate = (iso: string|null)=>{
    if(!iso) return ""
    const d = new Date(iso)
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
  }
  const votingRange = [fmtDate(ev?.voting_start), fmtDate(ev?.voting_end)].filter(Boolean).join(" hingga ")
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Jadwal Kompetisi</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em] leading-none">LINIMASA</h1>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
          {/* Desktop horizontal, mobile vertical */}
          <div className="hidden md:grid grid-cols-8 gap-3">
            {timelineStages.map(s=> (
              <div key={s.id} className={`rounded-2xl border p-4 text-center ${s.status==="current" ? "border-primary bg-primary/5" : s.status==="completed" ? "border-emerald-500/20 bg-emerald-500/5" : "border-dashed bg-white/5 backdrop-blur"}`}>
                <div className={`mx-auto h-10 w-10 rounded-full grid place-items-center text-sm font-black border ${s.status==="completed" ? "bg-emerald-500 text-black border-emerald-500" : s.status==="current" ? "bg-primary text-black border-primary" : "bg-white/5 backdrop-blur text-muted-foreground border-white/10"}`}>
                  {s.status==="completed" ? <Check className="h-5 w-5"/> : s.sort_order}
                </div>
                <div className="mt-3 text-xs font-black leading-tight">{s.title}</div>
                <div className="text-[11px] text-muted-foreground">{s.date}</div>
                <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{s.description}</div>
              </div>
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {timelineStages.map(s=> (
              <div key={s.id} className={`flex gap-3 rounded-2xl border p-4 ${s.status==="current" ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 backdrop-blur"}`}>
                <div className={`h-9 w-9 rounded-full grid place-items-center text-xs font-black shrink-0 ${s.status==="completed" ? "bg-emerald-500 text-black" : s.status==="current" ? "bg-primary text-black" : "bg-white/5 backdrop-blur text-muted-foreground"}`}>
                  {s.status==="completed" ? <Check className="h-4 w-4"/> : s.sort_order}
                </div>
                <div>
                  <div className="text-sm font-black">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.date} • {s.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
            <h3 className="text-sm font-black">Status Saat Ini</h3>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black"><Clock className="h-3.5 w-3.5"/> {stateLabel}</div>
            {votingRange && <p className="mt-2 text-sm text-muted-foreground">Dukungan untuk peleton terfavorit dibuka {votingRange}. Dukung peleton favoritmu sekarang.</p>}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
