"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

// ── Mini icons as inline SVG (no external deps) ──
function IconSearch(props:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>}
function IconAward(props:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><path d="M12 15a5 5 0 100-10 5 5 0 000 10z"/><path d="M9 15l-2 5 5-2 5 2-2-5"/><path d="M7 7H7.01"/><path d="M17 7H17.01"/></svg>}
function IconFAQ(props:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>}
function IconGift(props:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><path d="M12 8v12"/><path d="M20 8H4v4h16z"/><path d="M4 8c0-2 2-4 4-4s4 2 4 4"/><path d="M12 8c0-2 2-4 4-4s4 2 4 4"/></svg>}
function IconUsers(props:any){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}

const countdown = [
  { v:"12", l:"Hari" },
  { v:"03", l:"Jam" },
  { v:"45", l:"Menit" },
  { v:"27", l:"Detik" },
]

const peserta = [
  { n:"01", name:"SMA N 1 Kertosono", sub:"Putra • Kertosono", vote:"12.430", img:"https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&auto=format&fit=crop&q=60" },
  { n:"02", name:"SMA N 2 Kediri", sub:"Putra • Kediri", vote:"10.243", img:"https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&auto=format&fit=crop&q=60" },
  { n:"03", name:"SMA N 3 Tulungagung", sub:"Putri • Tulungagung", vote:"9.876", img:"https://images.unsplash.com/photo-1511635001-e5f7437c2a64?w=600&auto=format&fit=crop&q=60" },
  { n:"04", name:"SMA N 1 Blitar", sub:"Campuran • Blitar", vote:"8.542", img:"https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&auto=format&fit=crop&q=60" },
  { n:"05", name:"SMA N 1 Madiun", sub:"Putri • Madiun", vote:"7.921", img:"https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&auto=format&fit=crop&q=60" },
  { n:"06", name:"SMA N 2 Malang", sub:"Campuran • Malang", vote:"6.782", img:"https://images.unsplash.com/photo-1522543558187-00b65e9d00f5?w=600&auto=format&fit=crop&q=60" },
  { n:"07", name:"SMA N 1 Jombang", sub:"Putra • Jombang", vote:"5.421", img:"https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60" },
  { n:"08", name:"SMA N 1 Nganjuk", sub:"Putri • Nganjuk", vote:"4.983", img:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=60" },
]

const leaderboard = [
  { r:1, name:"SMA N 1 Kertosono", sub:"Putra • Kertosono", vote:"12.430", pct:"18.6%" },
  { r:2, name:"SMA N 2 Kediri", sub:"Putra • Kediri", vote:"10.243", pct:"15.3%" },
  { r:3, name:"SMA N 3 Tulungagung", sub:"Putri • Tulungagung", vote:"9.876", pct:"14.8%" },
  { r:4, name:"SMA N 1 Blitar", sub:"Campuran • Blitar", vote:"8.542", pct:"12.8%" },
  { r:5, name:"SMA N 1 Madiun", sub:"Putri • Madiun", vote:"7.921", pct:"11.9%" },
]

function useCountdown(target: string){
  const [diff,setDiff]=useState({ d:12,h:3,m:45,s:27 })
  useEffect(()=>{
    const id=setInterval(()=> setDiff(p=> {
      let s=p.s-1, m=p.m, h=p.h, d=p.d
      if(s<0){ s=59; m-- } if(m<0){ m=59; h-- } if(h<0){ h=23; d-- } if(d<0){ d=0;h=0;m=0;s=0; clearInterval(id) }
      return { d,h,m,s }
    }),1000)
    return ()=>clearInterval(id)
  },[])
  return diff
}

export function JawasomaHeritage({ peletons, event }: { peletons?: any[]; event?: any } = {}){
  const cd=useCountdown("2026-10-24T00:00:00+07:00")
  // Jika ada data real dari DB, mapping ke format card heritage (isolasi per event)
  const dynamicPeserta = (peletons && peletons.length > 0) ? peletons.slice(0,8).map((p:any, i:number)=> ({
    n: String(p.number || i+1).padStart(2,"0"),
    name: p.name,
    sub: `${p.category || "Putra"} • ${p.city || "Kertosono"}`,
    vote: p.vote || p.total_ballots || p.online_ballots || "—",
    img: p.image_url || p.image || "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=60",
  })) : null
  const displayPeserta = dynamicPeserta || peserta
  return (
    <div className="min-h-screen bg-[#060504] text-[#FFF8E7] selection:bg-[#C9A86A]/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0907]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/assets/brand/lkbb-logo.jpg" alt="JAWASOMA" className="h-7 w-7 object-contain rounded-sm" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-[Cinzel] text-[14px] font-extrabold tracking-[0.14em] text-[#F5E6C8]">JAWASOMA</span>
              <span className="text-[9px] tracking-[0.18em] text-white/50 font-[Inter] -mt-0.5">THE IMPRESSION 2026</span>
            </span>
            <span className="sm:hidden font-[Cinzel] text-sm font-bold text-[#F5E6C8]">JAWASOMA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-medium tracking-[0.06em] text-white/60">
            <Link href="/" className="text-[#F5E6C8] border-b border-[#C9A86A] pb-0.5">Beranda</Link>
            <Link href="/tentang" className="hover:text-white">Tentang</Link>
            <Link href="/tim" className="hover:text-white">Peserta</Link>
            <Link href="/dukungan" className="hover:text-white">Voting</Link>
            <Link href="/kompetisi" className="hover:text-white">Hasil</Link>
            <Link href="/sponsor" className="hover:text-white">Sponsor</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button aria-label="Search" className="hidden sm:grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white"><IconSearch className="h-4 w-4"/></button>
            <Link href="/login" className="rounded-full bg-[#E8D9B8] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#D9C08A]">Masuk</Link>
            <button className="lg:hidden h-8 w-8 grid place-items-center rounded-full border border-white/10"><span className="text-sm">≡</span></button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1518544866330-95a2f0664541?w=1600&auto=format&fit=crop&q=80" alt="Prambanan at sunset" className="h-full w-full object-cover object-[50%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0907] via-[#0A0907]/55 to-[#0A0907]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060504] via-transparent to-black/20" />
        </div>
        {/* Gunungan ornament right */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[340px] lg:block opacity-90" aria-hidden>
          <svg viewBox="0 0 340 700" fill="none" className="h-full w-full">
            <path d="M240 0 C 260 80 300 180 280 280 C 260 380 200 480 240 700 L340 700 L340 0 Z" fill="#0A0907" opacity="0.95"/>
            <path d="M255 18 Q 285 90 270 180 Q 255 250 265 320 Q 245 420 255 600" stroke="#C9A86A" strokeWidth="1.2" fill="none" opacity="0.9"/>
            <path d="M272 40 Q 295 110 280 190" stroke="#C9A86A" strokeWidth="0.8" opacity="0.6" fill="none"/>
            <g stroke="#C9A86A" strokeWidth="0.6" opacity="0.5" fill="none">
              <circle cx="270" cy="120" r="28"/><circle cx="270" cy="200" r="18"/><path d="M250 90 L290 90 M250 130 L290 130 M258 105 L282 105"/>
            </g>
          </svg>
        </div>
        {/* Batik bottom */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[36px] opacity-[0.18]" style={{backgroundImage:`radial-gradient(circle at 1px 1px, #C9A86A 1px, transparent 0)`, backgroundSize:"18px 18px"}} />

        <div className="relative mx-auto grid max-w-[1280px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.9fr] lg:py-10">
          {/* Left copy */}
          <div className="relative py-2">
            <div className="text-[10px] font-bold tracking-[0.18em] text-[#C9A86A]">LKBB EVENT</div>
            <h1 className="mt-1 font-[Cinzel] text-[42px] font-extrabold leading-[0.9] tracking-[-0.01em] sm:text-[56px]">
              <span className="block text-[#F5E6C8]" style={{textShadow:"0 2px 20px rgba(0,0,0,0.8)"}}>JAWASOMA</span>
              <span className="mt-1 block h-px w-[280px] max-w-full bg-gradient-to-r from-[#C9A86A] to-transparent" />
              <span className="mt-2 block text-[13px] font-[Inter] font-semibold tracking-[0.28em] text-[#E8D9B8]">THE IMPRESSION 2026</span>
            </h1>
            <p className="mt-4 max-w-[360px] text-[12.5px] leading-relaxed text-white/70 font-[Inter]">
              Langkah Tegas, Jiwa Ksatria,<br/>Untuk Negeri yang Lebih Baik
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#C9A86A]"/>24 Oktober 2026</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-[#C9A86A]">◎</span> Kertosono, Jawa Timur</span>
            </div>
            <Link href="/dukungan" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#E8D9B8] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#D9C08A] shadow-lg">Mulai Voting <span>→</span></Link>

            {/* Countdown - mobile inline bottom */}
            <div className="mt-6 flex gap-3 lg:hidden">
              {countdown.map(c=> (
                <div key={c.l} className="min-w-[56px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center backdrop-blur">
                  <div className="font-[Cinzel] text-lg font-bold text-[#F5E6C8]">{c.v}</div>
                  <div className="text-[10px] tracking-widest text-white/50">{c.l}</div>
                </div>
              ))}
            </div>

            {/* Countdown desktop - absolute */}
            <div className="hidden lg:flex absolute -bottom-2 right-0 gap-2">
              {[
                {v:String(cd.d).padStart(2,"0"), l:"Hari"},
                {v:String(cd.h).padStart(2,"0"), l:"Jam"},
                {v:String(cd.m).padStart(2,"0"), l:"Menit"},
                {v:String(cd.s).padStart(2,"0"), l:"Detik"},
              ].map(c=> (
                <div key={c.l} className="min-w-[64px] rounded-xl border border-[#C9A86A]/20 bg-[#0A0907]/70 px-3 py-2.5 text-center backdrop-blur">
                  <div className="font-[Cinzel] text-xl font-bold leading-none text-[#F5E6C8]">{c.v}</div>
                  <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-white/50">{c.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: PLETON HERO IMAGE (cutout) - back view towards temple */}
          <div className="relative hidden lg:block min-h-[420px]">
            <img src="https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=900&auto=format&fit=crop&q=70" alt="Peleton JAWASOMA" className="absolute inset-0 h-full w-full object-cover object-top rounded-[16px] border border-[#C9A86A]/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
            <div className="absolute inset-0 rounded-[16px] bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 rounded-[16px] ring-1 ring-[#C9A86A]/10" />
            <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold tracking-widest text-[#C9A86A] border border-[#C9A86A]/20">2026</div>
          </div>
        </div>

        {/* Bottom 4 quick links */}
        <div className="relative border-t border-white/10 bg-[#0A0907]/70 backdrop-blur">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-4 sm:px-6 lg:grid-cols-4">
            {[
              { icon: IconUsers, title:"Peserta", sub:"Lihat semua tim", href:"/tim" },
              { icon: IconAward, title:"Cara Voting", sub:"Panduan pemilihan", href:"/dukungan" },
              { icon: IconGift, title:"Hadiah", sub:"Total hadiah menarik", href:"/kompetisi" },
              { icon: IconFAQ, title:"FAQ", sub:"Pertanyaan umum", href:"/peraturan" },
            ].map(item=> (
              <Link key={item.title} href={item.href} className="flex items-center gap-3 border-r border-white/10 px-4 py-4 last:border-r-0 hover:bg-white/[0.04]">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#C9A86A]/20 bg-[#C9A86A]/10 text-[#C9A86A]"><item.icon className="h-5 w-5"/></span>
                <span><span className="block text-xs font-bold text-[#F5E6C8]">{item.title}</span><span className="block text-[11px] text-white/50">{item.sub}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PESERTA GRID ── */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[Cinzel] text-[22px] font-bold text-[#F5E6C8]">Peserta</h2>
            <p className="text-xs text-white/50">Pilih tim favoritmu dan berikan dukungan terbaik!</p>
          </div>
          <Link href="/tim" className="hidden sm:inline text-xs text-white/60 hover:text-white">Lihat Semua</Link>
        </div>

        <div className="mt-4 flex gap-2">
          {["Semua","Putra","Putri","Campuran"].map((f,i)=> (
            <span key={f} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${i===0 ? "bg-[#E8D9B8] text-black border-[#E8D9B8]" : "border-white/10 text-white/60 hover:text-white"}`}>{f}</span>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayPeserta.map(p=> (
            <article key={p.n} className="group overflow-hidden rounded-[14px] border border-white/10 bg-[#141210] hover:border-[#C9A86A]/30 hover:shadow-[0_0_20px_rgba(201,168,106,0.15)] transition">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#1C1914]">
                <span className="absolute left-2 top-2 z-10 rounded-full bg-[#0A0907]/70 px-2 py-0.5 text-[11px] font-bold text-[#C9A86A] border border-white/10"> {p.n}</span>
                <button aria-label="Favorite" className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white">♡</button>
                <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>
              <div className="p-3">
                <div className="text-sm font-bold leading-tight text-[#F5E6C8]">{p.name}</div>
                <div className="text-xs text-white/50">{p.sub}</div>
                <div className="mt-3 flex items-center justify-between">
                  <Link href="/dukungan" className="rounded-full bg-[#E8D9B8] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#D9C08A]">Vote Sekarang</Link>
                  <span className="text-xs text-white/50 inline-flex items-center gap-1">◎ {p.vote}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── LEADERBOARD + DETAIL (two col demo) ── */}
      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[1.4fr_0.9fr]">
        {/* Left: Detail placeholder */}
        <div className="rounded-[16px] border border-white/10 bg-[#141210] p-4">
          <div className="flex gap-3">
            <img src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=60" alt="SMA N 1" className="h-24 w-24 rounded-xl object-cover border border-white/10"/>
            <div>
              <div className="inline-flex rounded-full bg-[#C9A86A] px-2 py-0.5 text-[11px] font-bold text-black">01</div>
              <h3 className="mt-1 font-[Cinzel] text-lg font-bold leading-tight text-[#F5E6C8]">SMA N 1<br/>Kertosono</h3>
              <p className="mt-2 max-w-[420px] text-xs leading-relaxed text-white/60">Dengan semangat juang dan disiplin tinggi, SMA N 1 Kertosono menampilkan penampilan terbaik di JAWASOMA 2026.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Total Vote</div><div className="font-bold text-[#F5E6C8]">12.430</div></div>
            <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Persentase</div><div className="font-bold text-[#C9A86A]">18.6%</div></div>
            <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Posisi</div><div className="font-bold text-[#F5E6C8]">#1</div></div>
          </div>
          <button className="mt-4 w-full rounded-full bg-[#E8D9B8] py-2.5 text-sm font-bold text-black">Dukung Tim Ini</button>
          <p className="mt-2 text-center text-xs text-white/40">Berikan suaramu untuk SMA N 1 Kertosono</p>
          <Link href="/dukungan" className="mt-3 flex w-full justify-center rounded-full bg-[#E8D9B8] py-2 text-xs font-bold text-black">Voting Sekarang</Link>
        </div>

        {/* Right: Leaderboard */}
        <div className="rounded-[16px] border border-white/10 bg-[#0F0D0A] p-4">
          <h3 className="font-[Cinzel] text-lg font-bold text-[#F5E6C8]">Leaderboard</h3>
          <p className="text-xs text-white/50">Perolehan suara sementara</p>
          <div className="mt-4 space-y-2">
            {leaderboard.map(r=> (
              <div key={r.r} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1A1814] px-3 py-2.5">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${r.r===1 ? "bg-[#C9A86A] text-black" : r.r===2 ? "bg-white/10 text-white" : r.r===3 ? "bg-[#8C6522] text-white" : "bg-white/5 text-white/60"}`}>{r.r}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2A2216] text-[#C9A86A] text-xs">♔</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#F5E6C8]">{r.name}</span><span className="block truncate text-xs text-white/50">{r.sub}</span></span>
                <span className="text-right"><span className="block text-sm font-bold text-[#F5E6C8]">{r.vote}</span><span className="block text-xs text-white/50">{r.pct}</span></span>
              </div>
            ))}
          </div>
          <Link href="/tim" className="mt-3 block text-right text-xs text-white/60 hover:text-white">Lihat Semua →</Link>
        </div>
      </section>

      {/* ── HASIL AKHIR + FOOTER TEASER ── */}
      <section className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6">
        <div className="rounded-[16px] border border-white/10 bg-[#0F0D0A] p-6">
          <h3 className="font-[Cinzel] text-lg font-bold text-[#F5E6C8]">Hasil Akhir</h3>
          <p className="text-xs text-white/50">Pemenang Event JAWASOMA 2026</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
            <div className="rounded-xl border border-white/10 bg-[#1A1814] p-3 text-center">
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=60" alt="Juara 2" className="mx-auto h-16 w-16 rounded-xl object-cover"/>
              <div className="mt-2 text-sm font-bold text-[#F5E6C8]">SMA N 2 Kediri</div>
              <div className="text-xs text-white/50">Juara 2 • 10.243 (15.3%)</div>
            </div>
            <div className="rounded-xl border border-[#C9A86A]/30 bg-[#1A1814] p-4 text-center shadow-[0_0_30px_rgba(201,168,106,0.15)]">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-[#C9A86A] bg-[#2A2216] text-[#C9A86A]">♔</div>
              <div className="mt-2 text-sm font-bold text-[#F5E6C8]">SMA N 1 Kertosono</div>
              <div className="text-xs font-bold text-[#C9A86A]">Juara 1 • 12.430 (18.6%)</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#1A1814] p-3 text-center">
              <img src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=300&auto=format&fit=crop&q=60" alt="Juara 3" className="mx-auto h-16 w-16 rounded-xl object-cover"/>
              <div className="mt-2 text-sm font-bold text-[#F5E6C8]">SMA N 3 Tulungagung</div>
              <div className="text-xs text-white/50">Juara 3 • 9.876 (14.8%)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[#0A0907]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="font-[Cinzel] text-sm font-bold tracking-widest text-[#F5E6C8]">JAWASOMA</div>
              <div className="text-[11px] tracking-[0.18em] text-white/40">THE IMPRESSION 2026</div>
              <p className="mt-3 max-w-[420px] text-xs leading-relaxed text-white/50">Event LKBB tingkat nasional yang mengangkat semangat persatuan dan sportifitas. Lebih dari kompetisi — panggung seni, disiplin, dan budaya.</p>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Quick Link</div>
              <ul className="mt-3 space-y-1.5 text-xs text-white/50">
                <li><Link href="/" className="hover:text-white">Beranda</Link></li>
                <li><Link href="/tentang" className="hover:text-white">Tentang</Link></li>
                <li><Link href="/tim" className="hover:text-white">Peserta</Link></li>
                <li><Link href="/dukungan" className="hover:text-white">Voting</Link></li>
                <li><Link href="/kompetisi" className="hover:text-white">Hasil</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">Kontak</div>
              <p className="mt-3 text-xs leading-relaxed text-white/50">JAWASOMA<br/>info@jawasoma.id<br/>Kertosono, Jawa Timur</p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/30">
            <span>© 2026 JAWASOMA. All rights reserved.</span>
            <span>The Impression 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
