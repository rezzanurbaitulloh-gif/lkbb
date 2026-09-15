import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { PeletonCard } from "@/components/peleton/PeletonCard"

export function Featured({ peletons, showSementara, showFinal }: { peletons: any[]; showSementara?: boolean; showFinal?: boolean }){
  // Beranda harus urut nomor peserta per kategori (SMP 01,02.. terpisah SMA 01,02..) — nomor = urutan tampil
  const sorted = [...(peletons || [])].sort((a:any,b:any)=>{
    if(a.category!==b.category) return String(a.category).localeCompare(String(b.category))
    return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
  })
  const smp = sorted.filter((p:any)=> p.category==="SMP")
  const sma = sorted.filter((p:any)=> p.category==="SMA")
  const hasBadge = showSementara || showFinal
  return (
    <section className="relative bg-[#09090b] border-y border-white/10 overflow-hidden">
      {/* premium subtle gold glow behind — lebih menyatu */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_420px_at_18%_-10%,rgba(201,168,106,0.08),transparent_62%)]" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-primary/22 to-transparent opacity-80" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-6 py-10 sm:py-12 md:py-14 relative">
        {hasBadge && (
          <div className="flex justify-center mb-4 px-2">
            {showSementara && <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-black tracking-wide text-center max-w-full shadow"><span className="text-white">HASIL SEMENTARA</span></span>}
            {showFinal && <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-black tracking-wide text-center max-w-full shadow"><span className="text-white">HASIL FINAL</span></span>}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-[11px] font-bold tracking-[0.16em] text-primary/70">01</span>
              <span className="h-px w-6 bg-primary/40 hidden sm:block" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PESERTA</span>
            </div>
            <h2 className="mt-3 text-[22px] sm:text-[26px] md:text-[30px] font-black tracking-[-0.032em] text-white leading-[0.92] break-words font-display">DUKUNG PELETON <span className="text-white">FAVORITMU!</span></h2>
            <p className="mt-3 text-[13px] sm:text-[13.5px] text-white/60 leading-relaxed max-w-xl">Beranda urut nomor tampil (01, 02, 03…) — SMP & SMA terpisah. Peringkat disembunyikan saat voting aktif.</p>
          </div>
          <Link href="/tim" className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/5 hover:border-white/15 px-4 py-2 text-xs font-semibold text-white hover:text-white transition-colors shrink-0">LIHAT SEMUA <ArrowRight className="h-3 w-3"/></Link>
        </div>

        {/* SMP */}
        <div className="mt-8 xs:mt-10">
          <div className="flex flex-wrap items-center gap-3 mb-4 xs:mb-5">
            <span className="inline-flex rounded-full bg-black/40 backdrop-blur border border-white/15 text-white px-3 xs:px-4 py-1 xs:py-1.5 text-[11px] xs:text-xs font-black tracking-wide">SMP / SEDERAJAT</span>
            <span className="text-[11px] xs:text-xs font-medium text-white/50 bg-white/5 px-2.5 py-1 rounded-full">{smp.length} tim</span>
          </div>
          {smp.length===0 ? <p className="text-sm text-white/40 py-6 text-center border border-dashed border-white/10 rounded-xl">Belum ada peleton SMP.</p> : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
            {smp.map((p:any, idx:number)=> <PeletonCard key={p.id} peleton={{...p, image: p.image_url || p.image, cover: p.image_url || p.cover}} eager={idx<2} />)}
          </div>
          )}
        </div>

        {/* SMA */}
        <div className="mt-8 xs:mt-10">
          <div className="flex flex-wrap items-center gap-3 mb-4 xs:mb-5">
            <span className="inline-flex rounded-full bg-black/40 backdrop-blur border border-white/15 text-white px-3 xs:px-4 py-1 xs:py-1.5 text-[11px] xs:text-xs font-black tracking-wide">SMA / SEDERAJAT</span>
            <span className="text-[11px] xs:text-xs font-medium text-white/50 bg-white/5 px-2.5 py-1 rounded-full">{sma.length} tim</span>
          </div>
          {sma.length===0 ? <p className="text-sm text-white/40 py-6 text-center border border-dashed border-white/10 rounded-xl">Belum ada peleton SMA.</p> : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
            {sma.map((p:any, idx:number)=> <PeletonCard key={p.id} peleton={{...p, image: p.image_url || p.image, cover: p.image_url || p.cover}} eager={idx<2} />)}
          </div>
          )}
        </div>

        <Link href="/tim" className="mt-6 flex md:hidden">
          <Button variant="outline" className="w-full rounded-full bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/20 h-11 text-sm font-semibold">Lihat Semua</Button>
        </Link>
      </div>
    </section>
  )
}
