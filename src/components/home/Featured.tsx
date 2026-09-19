import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Featured({ peletons, showSementara, showFinal }: { peletons: any[]; showSementara?: boolean; showFinal?: boolean }){
  const sorted = [...(peletons || [])].sort((a:any,b:any)=>{
    if(a.category!==b.category) return String(a.category).localeCompare(String(b.category))
    return parseInt(String(a.number).replace(/^0+/,"")||"0") - parseInt(String(b.number).replace(/^0+/,"")||"0")
  })
  const smp = sorted.filter((p:any)=> p.category==="SMP")
  const sma = sorted.filter((p:any)=> p.category==="SMA")

  const renderGroup = (teams: any[], label: string) => {
    if (teams.length===0) return <p className="text-sm text-muted-foreground py-8 text-center border border-border">Belum ada peleton {label}.</p>
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((p:any, idx:number) => {
          const logo = p.logo_url || null
          return (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111110]">
              {/* Kepala kartu: nomor + nama/sekolah di atas gambar, logo murni di kanan */}
              <div className="flex items-start gap-3 p-4 pb-3">
                <span className="font-display text-[34px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.4)" }}>{String(p.number).padStart(2,"0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-[15px] font-bold tracking-tight text-[#F2F0E9]">{p.name}</h3>
                  <div className="mt-0.5 truncate text-[10px] tracking-[0.12em] text-[#92918C]">{p.school || p.category}</div>
                </div>
                {logo && <img src={logo} alt={`Logo ${p.name}`} className="h-11 w-11 shrink-0 object-contain" loading="lazy" />}
              </div>
              {/* Gambar tim */}
              <Link href={`/tim/${p.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-black/30">
                <img
                  src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading={idx<2 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-white backdrop-blur">#{String(p.number).padStart(2,"0")}</span>
              </Link>
              <div className="flex items-center gap-3 p-4 pt-3">
                <Link href={`/dukungan?peleton=${p.slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-[11px] font-bold tracking-wide hover:bg-primary/90 transition-colors">
                  DUKUNG <ArrowRight className="h-3 w-3" />
                </Link>
                <Link href={`/tim/${p.slug}`} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  LIHAT →
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <section className="bg-background border-y border-border">
      <div className="container-editorial">
        <div className="flex flex-wrap items-end justify-between gap-4 py-8 border-b border-border">
          <div>
            <div className="meta-label">PESERTA</div>
            <h2 className="mt-2 font-display font-bold text-[32px] lg:text-[44px] leading-[0.9] tracking-[-0.03em] text-foreground">
              SIAPA YANG<br />AKAN KAMU <span className="text-primary">DUKUNG?</span>
            </h2>
            <p className="mt-3 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
              Urutan nomor tampil (01, 02, 03…) — SMP & SMA terpisah. Peringkat disembunyikan saat dukungan berlangsung.
            </p>
          </div>
          <Link href="/tim" className="hidden md:inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold tracking-wide hover:bg-muted transition-colors">
            LIHAT SEMUA <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="py-10 lg:py-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold tracking-wide">SMP / SEDERAJAT</span>
            <span className="text-xs text-muted-foreground">{smp.length} tim</span>
          </div>
          {renderGroup(smp, "SMP")}
        </div>

        <div className="hairline" />

        <div className="py-10 lg:py-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold tracking-wide">SMA / SEDERAJAT</span>
            <span className="text-xs text-muted-foreground">{sma.length} tim</span>
          </div>
          {renderGroup(sma, "SMA")}
        </div>
      </div>
    </section>
  )
}
