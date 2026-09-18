import Link from "next/link"

export function ParticipantsMini({ teams }: { teams: any[] }){
  const sma = teams.filter(t=> t.category==="SMA").slice(0,3)
  const list = (sma.length>0 ? sma : teams.slice(0,3))
  return (
    <section className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-bold tracking-tight">THE PARTICIPANTS</h2>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] p-1">
            <span className="rounded-full bg-[#D9FF3F] px-3 py-1 text-[9px] font-bold text-black">SMA</span>
            <span className="px-3 py-1 text-[9px] font-bold text-[#92918C]">SMP</span>
          </div>
        </div>
        <div className="mt-5 divide-y divide-white/[0.06]">
          {list.map((p:any,i:number)=> (
            <Link key={p.id||i} href={`/tim/${p.slug}`} className="group flex items-center gap-4 py-3.5">
              <span className="font-display text-[36px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.3)" }}>{String(i+1).padStart(2,"0")}</span>
              <img src={p.image_url || p.image || "/assets/brand/lkbb-logo.jpg"} alt="" className="h-9 w-9 rounded-md border border-white/[0.08] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[12px] font-bold">{p.name}</span>
                <span className="block truncate text-[10px] tracking-[0.12em] text-[#92918C]">{p.school || "SATRIYA DHARMA"}</span>
              </span>
              <span className="text-[12px] font-bold tabular-nums text-[#F2F0E9]">{(1250-i*70).toLocaleString("id-ID")}.</span>
            </Link>
          ))}
        </div>
        <div className="mt-2 text-right">
          <Link href="/tim" className="text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white">VIEW ALL →</Link>
        </div>
      </div>
    </section>
  )
}

export function ResultsTeaser({ image }: { image?: string | null }){
  // Visual: foto peleton asli DB → poster resmi lokal. Tanpa stock.
  const src = (typeof image === "string" && image && !/unsplash|picsum|placehold|dummyimage|loremflickr/i.test(image)) ? image : "/assets/poster/lkbb-poster.jpg"
  return (
    <section className="border border-white/[0.08] bg-[#0A0A09]">
      <div className="mx-auto grid max-w-[1280px] gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-center rounded-l-2xl border border-white/[0.08] bg-[#111110] p-8">
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">THE RESULTS</div>
          <h2 className="mt-2 font-display text-[30px] font-bold leading-[0.95]">ARE STILL<br />UNDER WRAP.</h2>
          <p className="mt-3 max-w-[280px] text-[12px] leading-relaxed text-[#92918C]">The final result will be revealed after the event.</p>
          <div className="mt-4 text-[16px] text-[#D9FF3F]">✳</div>
        </div>
        <div className="relative min-h-[220px] overflow-hidden rounded-r-2xl border border-white/[0.08]">
          <img src={src} alt="Peleton LKBB" className="absolute inset-0 h-full w-full object-cover grayscale" />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      </div>
    </section>
  )
}
