"use client"
import Link from "next/link"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ShareSheet } from "@/components/share/ShareSheet"
import { Share2, QrCode } from "lucide-react"

// Geser horizontal dengan mouse (klik-tahan) maupun sentuhan layar.
// Klik ditahan bila pointer bergeser (drag) agar tidak membuka tautan.
function useDragScroll(){
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 })
  const onPointerDown = (e: React.PointerEvent)=>{
    const el = ref.current
    if(!el) return
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft }
  }
  const onPointerMove = (e: React.PointerEvent)=>{
    const el = ref.current
    if(!el || !drag.current.down) return
    const dx = e.clientX - drag.current.startX
    if(Math.abs(dx) > 8) drag.current.moved = true
    el.scrollLeft = drag.current.startLeft - dx
  }
  const end = ()=> { drag.current.down = false }
  const onClickCapture = (e: React.SyntheticEvent)=>{
    if(drag.current.moved){ e.preventDefault(); e.stopPropagation(); drag.current.moved = false }
  }
  return { ref, onPointerDown, onPointerMove, onPointerUp: end, onPointerLeave: end, onClickCapture }
}

function TeamCard({ p, idx }: { p: any; idx: number }){
  const { toast } = useToast()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const num = String(p.number||idx+1).padStart(2,"0")
  const logo = p.logo_url || null
  const profileUrl = `/tim/${p.slug}`
  const supportUrl = `/dukungan?peleton=${p.slug}`
  const handleShare = async (type: "profile" | "support") => {
    const url = `${window.location.origin}${type === "profile" ? profileUrl : supportUrl}`
    const title = type === "profile" ? `Profil ${p.name}` : `Dukung ${p.name} di LKBB Javasoma`
    if (navigator.share) {
      try { await navigator.share({ title, url }); toast({ title: "Berhasil dibagikan", variant: "success" }); return } catch {}
    }
    setShareUrl(url); setShareTitle(title); setShareOpen(true)
  }
  return (
    <article className="w-[270px] shrink-0 snap-start sm:w-[300px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[44px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.4)" }}>{num}</div>
          <div className="mt-1 truncate font-display text-[13px] font-bold tracking-tight text-[#F2F0E9]">{p.name || p.school}</div>
          <div className="mt-0.5 truncate font-body text-[10px] tracking-[0.12em] text-[#92918C]">{(p.school || "").toUpperCase() || p.category}</div>
        </div>
        {logo && <img src={logo} alt={`Logo ${p.name}`} className="h-11 w-11 shrink-0 object-contain" loading="lazy" draggable={false} />}
      </div>
      <Link href={profileUrl}
        className="group relative mt-2 block aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414]" draggable={false}>
        <img src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"} alt={p.name}
          className="pointer-events-none h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading={idx<3?"eager":"lazy"} draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </Link>
      <div className="mt-2 font-body text-[9px] tracking-[0.14em] text-[#92918C]">{p.category}{(p.city ? ` • ${String(p.city).toUpperCase()}` : "")}</div>
      <Link href={supportUrl} className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-[#D9FF3F] hover:underline">
        DUKUNG →
      </Link>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={() => handleShare("profile")} aria-label={`Bagikan profil ${p.name}`}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={() => handleShare("support")} aria-label={`Bagikan dukungan ${p.name}`}>
          <QrCode className="h-4 w-4" />
        </Button>
      </div>
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} url={shareUrl} title={shareTitle} />
    </article>
  )
}

function TeamRow({ teams, category }: { teams: any[]; category: string }){
  const { ref, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onClickCapture } = useDragScroll()
  const sorted = [...(teams||[])].sort((a:any,b:any)=>{
    const an = parseInt(String(a.number).replace(/^0+/,"")||"0")
    const bn = parseInt(String(b.number).replace(/^0+/,"")||"0")
    return an-bn
  })
  const scrollBy = (dir: number)=>{
    ref.current?.scrollBy({ left: dir*320, behavior: "smooth" })
  }
  if(sorted.length===0) return <p className="mt-4 border border-dashed border-white/10 py-8 text-center text-sm text-[#92918C]">Belum ada tim {category}.</p>
  return (
    <>
      <div
        ref={ref}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave}
        onClickCapture={onClickCapture}
        className="no-scrollbar mt-6 flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 select-none active:cursor-grabbing"
      >
        {sorted.map((p:any, idx:number)=> (
          <TeamCard key={p.id} p={p} idx={idx} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
        <button onClick={()=> scrollBy(-1)} aria-label="Sebelumnya" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] hover:bg-white/5">←</button>
        <button onClick={()=> scrollBy(1)} aria-label="Berikutnya" className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] hover:bg-white/5">→</button>
        <span className="ml-2 font-body text-[11px] tabular-nums text-[#92918C]">Geser untuk melihat semua</span>
      </div>
    </>
  )
}

export function ParticipantsBoard({ smp, sma, siteSettings }: { smp: any[]; sma: any[]; siteSettings?: Record<string, any> }){
  const teamsTitle = (siteSettings?.["home.teams_title"] as string) || "SIAPA YANG AKAN KAMU"
  const teamsAccent = (siteSettings?.["home.teams_title_accent"] as string) || "DUKUNG?"
  return (
    <section className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="meta-label">PESERTA</div>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[0.9] tracking-[-0.03em] text-[#F2F0E9] sm:text-[40px]">
          {teamsTitle}<br /><span className="text-[#D9FF3F]">{teamsAccent}</span>
        </h1>
        <p className="mt-3 max-w-[420px] font-body text-[12px] leading-relaxed text-[#92918C]">
          {(smp.length + sma.length)} tim terdaftar — {smp.length} SMP & {sma.length} SMA. Geser kartu dengan mouse atau sentuhan layar.
        </p>

        <div className="mt-8">
          <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
            <h2 className="font-display text-[15px] font-bold tracking-tight">SMP / SEDERAJAT</h2>
            <span className="font-body text-[11px] text-[#92918C]">{smp.length} tim</span>
          </div>
          <TeamRow teams={smp} category="SMP" />
        </div>

        <div className="mt-10">
          <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
            <h2 className="font-display text-[15px] font-bold tracking-tight">SMA / SEDERAJAT</h2>
            <span className="font-body text-[11px] text-[#92918C]">{sma.length} tim</span>
          </div>
          <TeamRow teams={sma} category="SMA" />
        </div>
      </div>
    </section>
  )
}
