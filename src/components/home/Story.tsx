import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Story({ sponsors, event }: { sponsors?: any[] | null; event?: any }){
  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-10 md:py-14">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="label-gold">Tentang LKBB</div>
          <h2 className="mt-2 text-[28px] md:text-[36px] font-black tracking-[-0.04em] leading-[0.9] text-foreground text-balance">
            LEBIH DARI<br/>SEKADAR BARISAN.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground text-pretty">
            Lomba Ketangkasan Baris-Berbaris (LKBB) merupakan ajang kompetisi bergengsi yang mempertemukan peleton-peleton terbaik dari berbagai sekolah untuk menunjukkan disiplin, kerja sama, dan semangat juang. Setiap gerakan adalah cerita — tentang dedikasi, identitas, dan kebanggaan.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/tentang"><Button variant="outline" className="rounded-full">Selengkapnya</Button></Link>
            <Link href="/kompetisi"><Button className="rounded-full">Tentang Kompetisi</Button></Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              ["DISIPLIN","Fondasi utama setiap gerakan presisi"],
              ["KEKOMPAKAN","Kekuatan dalam kebersamaan"],
              ["KEBANGGAAN","Identitas sekolah & daerah"],
            ].map(([t,d])=> (
              <div key={t}>
                <div className="text-xs font-black tracking-[0.12em] text-foreground">{t}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/5 backdrop-blur aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1599707367072-cd6ada2bc32d?w=900&auto=format&fit=crop&q=70" alt="LKBB" className="h-full w-full object-cover" />
          </div>
          {/* Poster card */}
          <div className="absolute -bottom-4 -left-4 hidden md:flex gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 shadow-elevated max-w-[320px]">
            <img src="/assets/poster/lkbb-poster.jpg" alt="Poster" className="h-20 w-14 rounded-lg object-cover border border-white/10" />
            <div>
              <div className="text-xs font-bold leading-tight">LKBB JAVASOMA 2026</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Pendaftaran Agustus s.d. kuota terpenuhi • Pelaksanaan 24 Okt 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors row within story — DB-driven, no hardcode */}
      {sponsors && sponsors.length>0 && (
        <div className="mt-10 rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <div className="label-ceremonial">Didukung Oleh</div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold">
              {sponsors.slice(0,6).map((s:any)=> (
                <span key={s.id || s.name} className="rounded-full bg-secondary px-3 py-1.5">{s.name}</span>
              ))}
            </div>
          </div>
          <Link href="/sponsor" className="text-sm font-semibold text-primary hover:underline">Lihat semua sponsor →</Link>
        </div>
      )}
    </section>
  )
}
