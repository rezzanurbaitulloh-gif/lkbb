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
      <div className="space-y-16 lg:space-y-24">
        {teams.map((p:any, idx:number) => {
          const isEven = idx % 2 === 1
          return (
            <article key={p.id} className={`grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-12 items-start ${isEven ? "lg:[&>*:first-child]:order-2" : ""}`}>
              {/* Text */}
              <div className="order-2 lg:order-1">
                <div className="flex items-baseline gap-4">
                  <span className="number-display text-[80px] lg:text-[120px]">{String(p.number).padStart(2,"0")}</span>
                  <span className="meta-label hidden sm:inline">{p.category} • {p.school}</span>
                </div>
                <h3 className="mt-2 font-display font-bold text-[28px] lg:text-[36px] leading-[0.9] tracking-[-0.02em] text-foreground">
                  {p.name}
                </h3>
                <div className="mt-2 meta-label lg:hidden">{p.category} • {p.school}</div>
                <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {p.description || "Peleton disiplin tinggi, kekompakan solid, semangat juang luar biasa."}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Link href={`/tim/${p.slug}`} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold tracking-wide hover:bg-primary/90 transition-colors">
                    SUPPORT <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link href={`/tim/${p.slug}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    VIEW →
                  </Link>
                </div>
              </div>
              {/* Image — editorial crop, not card */}
              <Link href={`/tim/${p.slug}`} className="order-1 lg:order-2 group relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading={idx<2 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
              </Link>
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
            <div className="meta-label">PARTICIPANTS</div>
            <h2 className="mt-2 font-display font-bold text-[32px] lg:text-[44px] leading-[0.9] tracking-[-0.03em] text-foreground">
              WHO WILL<br />THE CROWD <span className="text-primary">CHOOSE?</span>
            </h2>
            <p className="mt-3 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
              Beranda urut nomor tampil (01, 02, 03…) — SMP & SMA terpisah. Peringkat disembunyikan saat voting aktif.
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
