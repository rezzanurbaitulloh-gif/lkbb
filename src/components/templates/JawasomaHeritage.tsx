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
  { n:"01", name:"SMA N 1 Kertosono", sub:"Putra • Kertosono", vote:"12.430", img:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=60" },
  { n:"02", name:"SMA N 2 Kediri", sub:"Putra • Kediri", vote:"10.243", img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=60" },
  { n:"03", name:"SMA N 3 Tulungagung", sub:"Putri • Tulungagung", vote:"9.876", img:"https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=60" },
  { n:"04", name:"SMA N 1 Blitar", sub:"Campuran • Blitar", vote:"8.542", img:"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=60" },
  { n:"05", name:"SMA N 1 Madiun", sub:"Putri • Madiun", vote:"7.921", img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=60" },
  { n:"06", name:"SMA N 2 Malang", sub:"Campuran • Malang", vote:"6.782", img:"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=60" },
  { n:"07", name:"SMA N 1 Jombang", sub:"Putra • Jombang", vote:"5.421", img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=60" },
  { n:"08", name:"SMA N 1 Nganjuk", sub:"Putri • Nganjuk", vote:"4.983", img:"https://images.unsplash.com/photo-1577896859043-0c5e0a6d803b?w=600&auto=format&fit=crop&q=60" },
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
  const cd=useCountdown(event?.event_date ? `${event.event_date}T00:00:00+07:00` : "2026-10-24T00:00:00+07:00")
  // Data dinamis realtime — preview tanpa props tampilkan sampel, event real kosong tampilkan empty
  const isPreview = peletons === undefined
  const hasRealData = !!(peletons && peletons.length > 0)
  const dynamicPeserta = hasRealData ? peletons!.slice(0,8).map((p:any, i:number)=> ({
    n: String(p.number || i+1).padStart(2,"0"),
    name: p.name,
    sub: `${p.category || "Putra"} • ${p.city || p.school?.split(" ").pop() || "Kertosono"}`,
    vote: p.vote ?? p.total_ballots ?? p.online_ballots ?? 0,
    img: p.image_url || p.image || p.logo_url || "",
  })) : null
  const displayPeserta = dynamicPeserta || (isPreview ? peserta : [])
  // Leaderboard dinamis dari data real, sort by vote desc
  const dynamicLeaderboard = hasRealData ? [...peletons!].sort((a:any,b:any)=>{
    const av = Number(a.total_ballots ?? a.online_ballots ?? a.vote ?? 0)
    const bv = Number(b.total_ballots ?? b.online_ballots ?? b.vote ?? 0)
    return bv - av
  }).slice(0,5).map((p:any,i:number)=> ({
    r: i+1,
    name: p.name,
    sub: `${p.category || "Putra"} • ${p.city || "Kertosono"}`,
    vote: String(p.total_ballots ?? p.online_ballots ?? p.vote ?? 0),
    pct: p.pct || `${((Number(p.total_ballots||0)/ Math.max(1, peletons!.reduce((s:any,x:any)=> s+Number(x.total_ballots||0),0)))*100).toFixed(1)}%`,
  })) : null
  const displayLeaderboard = dynamicLeaderboard || leaderboard
  const topTeam = hasRealData ? peletons![0] : null
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
        {/* Gunungan ornament right - authentic wayang kulit kayon from Wikimedia Commons */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[380px] lg:block overflow-hidden opacity-[0.92]" aria-hidden>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ filter: "sepia(1) hue-rotate(18deg) saturate(1.2) brightness(0.85) contrast(1.1)", mixBlendMode: "screen" }}
            loading="lazy"
            onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0A0907]/20 to-[#0A0907]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0907] via-transparent to-transparent w-[40px]" />
        </div>
        {/* Batik bottom - authentic Mega Mendung pattern */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[42px] opacity-[0.14] overflow-hidden" aria-hidden>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/800px-Batik_Mega_Mendung.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
            style={{ filter: "sepia(0.6) saturate(0.7) brightness(0.6)", mixBlendMode: "soft-light" }}
            loading="lazy"
            onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060504] to-transparent" />
        </div>

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
            <div className="mt-6 flex gap-2 sm:gap-3 lg:hidden">
              {[
                {v:String(cd.d).padStart(2,"0"), l:"Hari"},
                {v:String(cd.h).padStart(2,"0"), l:"Jam"},
                {v:String(cd.m).padStart(2,"0"), l:"Menit"},
                {v:String(cd.s).padStart(2,"0"), l:"Detik"},
              ].map(c=> (
                <div key={c.l} className="min-w-[56px] flex-1 rounded-xl border border-[#C9A86A]/20 bg-[#0A0907]/60 px-2 py-2 text-center backdrop-blur sm:px-3">
                  <div className="font-[Cinzel] text-base font-bold text-[#F5E6C8] sm:text-lg">{c.v}</div>
                  <div className="text-[9px] tracking-[0.14em] text-white/50 sm:text-[10px]">{c.l}</div>
                </div>
              ))}
            </div>

            {/* Countdown desktop - inside hero */}
            <div className="hidden lg:flex absolute bottom-4 right-0 gap-2">
              {[
                {v:String(cd.d).padStart(2,"0"), l:"Hari"},
                {v:String(cd.h).padStart(2,"0"), l:"Jam"},
                {v:String(cd.m).padStart(2,"0"), l:"Menit"},
                {v:String(cd.s).padStart(2,"0"), l:"Detik"},
              ].map(c=> (
                <div key={c.l} className="min-w-[64px] rounded-xl border border-[#C9A86A]/25 bg-[#0A0907]/80 px-3 py-2.5 text-center backdrop-blur shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <div className="font-[Cinzel] text-xl font-bold leading-none text-[#F5E6C8]">{c.v}</div>
                  <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#C9A86A]">{c.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: PLETON HERO IMAGE - back view towards temple, plek referensi */}
          <div className="relative hidden lg:block min-h-[420px]">
            <img src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=900&auto=format&fit=crop&q=70" alt="Peleton JAWASOMA" className="absolute inset-0 h-full w-full object-cover object-[50%_20%] rounded-[16px] border border-[#C9A86A]/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
            <div className="absolute inset-0 rounded-[16px] bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-0 rounded-[16px] ring-1 ring-[#C9A86A]/15" />
            <div className="absolute bottom-3 right-3 rounded-full bg-[#0A0907]/70 px-3 py-1 text-[10px] font-bold tracking-widest text-[#C9A86A] border border-[#C9A86A]/20 backdrop-blur">2026</div>
          </div>
        </div>

        {/* Bottom 4 quick links */}
          <div className="relative border-t border-white/[0.07] bg-[#0A0907]/80 backdrop-blur">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-4 sm:px-6 lg:grid-cols-4">
            {[
              { icon: IconUsers, title:"Peserta", sub:"Lihat semua tim", href:"/tim" },
              { icon: IconAward, title:"Cara Voting", sub:"Panduan pemilihan", href:"/dukungan" },
              { icon: IconGift, title:"Hadiah", sub:"Total hadiah menarik", href:"/kompetisi" },
              { icon: IconFAQ, title:"FAQ", sub:"Pertanyaan umum", href:"/peraturan" },
            ].map(item=> (
              <Link key={item.title} href={item.href} className="flex items-center gap-3 border-r border-white/[0.06] px-4 py-4 last:border-r-0 hover:bg-white/[0.04] transition">
                <span className="grid h-9 w-9 place-items-center rounded-xl border text-[#C9A86A]" style={{backgroundColor:'rgba(201,168,106,0.10)', borderColor:'rgba(201,168,106,0.18)'}}><item.icon className="h-5 w-5"/></span>
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

        {displayPeserta.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm text-white/60">Belum ada peserta di event ini.</p>
            <p className="mt-1 text-xs text-white/30">Admin akan menambahkan tim — data akan muncul realtime.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayPeserta.map(p=> (
              <article key={p.n} className="group overflow-hidden rounded-[14px] border border-white/10 bg-[#141210] hover:border-[#C9A86A]/30 hover:shadow-[0_0_20px_rgba(201,168,106,0.15)] transition">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#1C1914]">
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-[#0A0907]/80 px-2 py-0.5 text-[11px] font-bold text-[#C9A86A] border border-[#C9A86A]/30"> {p.n}</span>
                  <button aria-label="Favorite" className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white">♡</button>
                  {p.img ? <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy"/> : <div className="h-full w-full grid place-items-center text-white/20 text-xs">No Image</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold leading-tight text-[#F5E6C8]">{p.name}</div>
                  <div className="text-xs text-white/50">{p.sub}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href="/dukungan" className="rounded-full bg-[#E8D9B8] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#D9C08A]">Vote Sekarang</Link>
                    <span className="text-xs text-white/50 inline-flex items-center gap-1">◎ {typeof p.vote === 'number' ? p.vote.toLocaleString("id-ID") : p.vote}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── LEADERBOARD + DETAIL (two col demo) — data dinamis realtime ── */}
      <section className="mx-auto grid max-w-[1280px] gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[1.4fr_0.9fr]">
        {/* Left: Detail top team */}
        <div className="rounded-[16px] border border-white/10 bg-[#141210] p-4">
          {topTeam ? (
            <>
              <div className="flex gap-3">
                <img src={topTeam.image_url || topTeam.image || displayPeserta[0]?.img} alt={topTeam.name} className="h-24 w-24 rounded-xl object-cover border border-white/10"/>
                <div>
                  <div className="inline-flex rounded-full bg-[#C9A86A] px-2 py-0.5 text-[11px] font-bold text-black">{String(topTeam.number || "01").padStart(2,"0")}</div>
                  <h3 className="mt-1 font-[Cinzel] text-lg font-bold leading-tight text-[#F5E6C8]">{topTeam.name?.split(" ").slice(0,3).join(" ")}<br/>{topTeam.name?.split(" ").slice(3).join(" ") || topTeam.school?.split(" ").pop() || "Kertosono"}</h3>
                  <p className="mt-2 max-w-[420px] text-xs leading-relaxed text-white/60">{topTeam.description || `Dengan semangat juang dan disiplin tinggi, ${topTeam.name} menampilkan penampilan terbaik di JAWASOMA 2026.`}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {[
                  { icon:"👤", label:"Nama Tim", value: topTeam.name },
                  { icon:"🎓", label:"Pelatih", value: (topTeam as any).coach || "Bapak Andi Pratama" },
                  { icon:"🏷️", label:"Kategori", value: topTeam.category || "Putra" },
                  { icon:"👥", label:"Jumlah Anggota", value: `${(topTeam as any).member_count || 25} Orang` },
                  { icon:"🏫", label:"Asal Sekolah", value: topTeam.school || "SMA Negeri 1 Kertosono" },
                  { icon:"🎯", label:"Motivasi", value: (topTeam as any).motto || "Disiplin • Kompak • Juara" },
                ].map(item=> (
                  <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0A0907]/50 px-3 py-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#C9A86A]/10 border border-[#C9A86A]/20 text-[11px]">{item.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] leading-none text-white/40">{item.label}</span><span className="block truncate text-xs font-bold text-[#F5E6C8]">{item.value}</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Total Suara</div><div className="font-bold text-[#F5E6C8]">{Number(topTeam.total_ballots ?? topTeam.online_ballots ?? topTeam.vote ?? displayLeaderboard[0]?.vote ?? 0).toLocaleString("id-ID")}</div></div>
                <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Persentase</div><div className="font-bold text-[#C9A86A]">{displayLeaderboard[0]?.pct || "—"}</div></div>
                <div className="rounded-xl border border-white/10 bg-[#0A0907]/50 p-3"><div className="text-xs text-white/50">Posisi</div><div className="font-bold text-[#F5E6C8]">#1</div></div>
              </div>
              {/* Galeri - 3 foto tim */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold tracking-widest text-white/60">Galeri</h4>
                  <Link href={`/tim/${topTeam.slug || ""}`} className="text-[11px] text-white/40 hover:text-white">Lihat Semua ›</Link>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[0,1,2].map(i=> (
                    <img key={i} src={displayPeserta[i % displayPeserta.length]?.img} alt="Galeri" className="aspect-[4/3] w-full rounded-lg object-cover border border-white/10"/>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="mt-4 rounded-xl border border-[#C9A86A]/15 bg-[#0A0907]/40 p-3">
                <div className="text-lg leading-none text-[#C9A86A]">“</div>
                <p className="text-xs leading-relaxed text-white/70">Kami bukan hanya tim, kami adalah keluarga yang berjuang bersama untuk satu tujuan.</p>
                <p className="mt-2 text-[11px] text-white/30">— {topTeam.name}</p>
              </div>

              <Link href={`/tim/${topTeam.slug || ""}`} className="mt-4 flex w-full justify-center rounded-full bg-[#E8D9B8] py-2.5 text-sm font-bold text-black hover:bg-[#D9C08A]">Dukung Tim Ini</Link>
              <p className="mt-2 text-center text-xs text-white/40">Berikan suaramu untuk {topTeam.name}</p>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-white/50">Belum ada tim terdaftar di event ini.</p>
              <p className="mt-1 text-xs text-white/30">Data peserta akan muncul otomatis setelah admin menambahkan tim.</p>
            </div>
          )}
          <Link href="/dukungan" className="mt-3 flex w-full justify-center rounded-full bg-[#E8D9B8] py-2 text-xs font-bold text-black">Voting Sekarang</Link>
        </div>

        {/* Right: Leaderboard dinamis */}
        <div className="rounded-[16px] border border-white/10 bg-[#0F0D0A] p-4">
          <h3 className="font-[Cinzel] text-lg font-bold text-[#F5E6C8]">Leaderboard</h3>
          <p className="text-xs text-white/50">Perolehan suara sementara {hasRealData ? "• realtime" : ""}</p>
          <div className="mt-4 space-y-2">
            {displayLeaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/30">Belum ada suara masuk.</div>
            ) : displayLeaderboard.map(r=> (
              <div key={r.r} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1A1814] px-3 py-2.5 hover:border-[#C9A86A]/20">
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

      {/* ── HASIL AKHIR + FOOTER TEASER — dinamis ── */}
      <section className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6">
        <div className="rounded-[16px] border border-white/10 bg-[#0F0D0A] p-6">
          <h3 className="font-[Cinzel] text-lg font-bold text-[#F5E6C8]">Hasil Akhir</h3>
          <p className="text-xs text-white/50">Pemenang Event JAWASOMA 2026</p>
          {displayLeaderboard.length >= 3 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
              <div className="rounded-xl border border-white/10 bg-[#1A1814] p-3 text-center">
                <img src={displayPeserta[1]?.img} alt={displayLeaderboard[1]?.name} className="mx-auto h-16 w-16 rounded-xl object-cover"/>
                <div className="mt-2 text-sm font-bold text-[#F5E6C8]">{displayLeaderboard[1]?.name}</div>
                <div className="text-xs text-white/50">Juara 2 • {displayLeaderboard[1]?.vote} ({displayLeaderboard[1]?.pct})</div>
              </div>
              <div className="rounded-xl border border-[#C9A86A]/30 bg-[#1A1814] p-4 text-center shadow-[0_0_30px_rgba(201,168,106,0.15)]">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-[#C9A86A] bg-[#2A2216] text-[#C9A86A] text-xl">♔</div>
                <div className="mt-2 text-sm font-bold text-[#F5E6C8]">{displayLeaderboard[0]?.name}</div>
                <div className="text-xs font-bold text-[#C9A86A]">Juara 1 • {displayLeaderboard[0]?.vote} ({displayLeaderboard[0]?.pct})</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1A1814] p-3 text-center">
                <img src={displayPeserta[2]?.img} alt={displayLeaderboard[2]?.name} className="mx-auto h-16 w-16 rounded-xl object-cover"/>
                <div className="mt-2 text-sm font-bold text-[#F5E6C8]">{displayLeaderboard[2]?.name}</div>
                <div className="text-xs text-white/50">Juara 3 • {displayLeaderboard[2]?.vote} ({displayLeaderboard[2]?.pct})</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/40">Belum ada hasil — voting masih berlangsung.</div>
          )}
        </div>
      </section>

      {/* ── FOOTER — with dancer & batik, plek referensi bawah ── */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#0A0907]">
        {/* Batik footer background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{backgroundImage:`url("https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/400px-Batik_Mega_Mendung.jpg")`, backgroundSize:"300px"}} />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sendratari.jpg/400px-Sendratari.jpg" alt="" className="pointer-events-none absolute bottom-0 left-0 hidden h-[280px] w-[300px] object-cover object-top opacity-[0.18] lg:block" style={{maskImage:"linear-gradient(to right, black 60%, transparent)", WebkitMaskImage:"linear-gradient(to right, black 60%, transparent)"}} />
        <div className="relative mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="lg:pl-[320px]">
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
