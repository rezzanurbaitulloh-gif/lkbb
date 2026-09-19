"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import Link from "next/link"
import { createBrowserSupabase } from "@/lib/supabase"
import { useApp } from "@/lib/store"

function DukunganInner(){
  const sp = useSearchParams()
  const router = useRouter()
  const { currentUser } = useApp()
  const slug = sp.get("peleton")
  const [peleton, setPeleton] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [qty,setQty]=useState(Number(sp.get("qty"))||10)
  const [custom, setCustom]=useState(false)
  const [loading, setLoading]=useState(false)
  const [error, setError]=useState("")
  const [loadError, setLoadError] = useState("")
  useEffect(()=>{
    const supabase = createBrowserSupabase()
    if(slug){
      supabase.from("peletons").select("*").eq("slug", slug).single().then(({data, error})=> {
        if(error || !data) setLoadError("Peleton tidak ditemukan. Pilih dari halaman Tim.")
        else setPeleton(data)
      })
    } else {
      supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("number",{ascending:true}).limit(1).single().then(({data, error})=>{
        if(error || !data) setLoadError("Belum ada peleton aktif.")
        else setPeleton(data)
      })
    }
    supabase.from("competitions").select("*").order("created_at",{ascending:false}).limit(1).single().then(({data})=> setEvent(data))
  },[slug])

  if(loadError) return (
    <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
      <div className="rounded-2xl border border-white/[0.08] p-8">
        <div className="font-display font-bold">Peleton tidak ditemukan</div>
        <Link href="/tim" className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5">Pilih Peleton di Tim →</Link>
      </div>
    </div>
  )
  if(!peleton) return <div className="p-8 text-center text-sm text-[#92918C]">Memuat peleton...</div>

  const onlinePrice = event?.settings?.online_price ?? 3000
  // Preset jumlah dukungan dari pengaturan event (dinamis) — fallback bila event belum termuat.
  const presets: number[] = Array.isArray(event?.settings?.ballot_presets) && event.settings.ballot_presets.length>0
    ? event.settings.ballot_presets.map(Number).filter((n:number)=> n>0).slice(0,4)
    : [10,50,100]
  const total = qty * onlinePrice
  const state = (event?.state as string) || ""
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isClosed = event ? !isActive : false

  const handlePay = async ()=>{
    if(loading) return
    if(isClosed){ setError("Dukungan ditutup"); return }
    if(!currentUser){ router.push(`/login?redirect=${encodeURIComponent(`/dukungan?peleton=${peleton.slug}`)}`); return }
    const safeQty = Math.max(1, Math.min(10000, Math.floor(Number(qty)||1)))
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peletonId: peleton.id, slug: peleton.slug, quantity: safeQty })
      })
      const data = await res.json()
      if(!res.ok){
        if(res.status===401){ router.push(`/login?redirect=${encodeURIComponent(`/dukungan?peleton=${peleton.slug}`)}`); return }
        setError(data.error || "Gagal membuat transaksi"); setLoading(false); return
      }
      if(data.paymentUrl && data.paymentUrl.startsWith("http")) window.location.href = data.paymentUrl
      else router.push(data.paymentUrl)
    } catch(e:any){ setError(e.message); setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* kiri: foto peleton */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111110]">
          <img src={peleton.image_url} alt={peleton.name} className="aspect-[16/10] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <div className="font-display text-[15px] font-bold text-white">{peleton.name}</div>
            <div className="text-[10px] tracking-[0.14em] text-white/60">{peleton.category}{peleton.city ? ` • ${String(peleton.city).toUpperCase()}` : ""}</div>
          </div>
        </div>
        {/* kanan: kartu pilih dukungan */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111110] p-6">
          <div className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[110px] font-light leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.18)" }}>02</div>
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">→ DUKUNGAN</div>
          <h2 className="mt-2 font-display text-[26px] font-bold leading-[0.95] tracking-tight">TENTUKAN<br /><span className="text-[#D9FF3F]">DUKUNGANMU.</span></h2>
          <div className={`mt-5 grid gap-2 ${presets.length>3 ? "grid-cols-4" : "grid-cols-3"}`}>
            {presets.map(n=> (
              <button key={n} onClick={()=>{setQty(n); setCustom(false)}} className={`h-11 rounded-lg border text-[13px] font-bold transition-colors ${qty===n&&!custom ? "border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#D9FF3F]" : "border-white/[0.08] hover:border-white/20"}`}>{n}</button>
            ))}
          </div>
          <button onClick={()=> setCustom(!custom)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] text-[10px] font-bold tracking-[0.16em] text-[#92918C] hover:text-white">JUMLAH LAIN</button>
          {custom && (
            <input type="number" min={1} max={10000} value={qty} onChange={e=> setQty(Number(e.target.value))} className="mt-2 h-10 w-full rounded-lg border border-[#D9FF3F]/40 bg-black/40 px-3 text-sm font-bold tabular-nums focus:outline-none" />
          )}
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/30 p-4">
            <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">TOTAL</div>
            <div className="mt-1 text-[13px] font-bold tabular-nums">{qty} SUARA</div>
            <div className="text-[11px] text-[#92918C] tabular-nums">Rp{onlinePrice.toLocaleString("id-ID")} / suara</div>
            <div className="text-[15px] font-bold tabular-nums">Rp{total.toLocaleString("id-ID")}</div>
          </div>
          {error && <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
          <button onClick={handlePay} disabled={loading} className="mt-4 grid h-11 w-full place-items-center rounded-full bg-[#D9FF3F] text-[11px] font-bold tracking-wide text-black hover:brightness-105 disabled:opacity-60">
            {loading ? "Memproses..." : "LANJUT →"}
          </button>
          <button onClick={()=> router.back()} className="mt-3 w-full text-center text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white">← KEMBALI</button>
        </div>
      </div>
    </div>
  )
}

export default function DukunganPage(){
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A09] text-[#F2F0E9]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Suspense fallback={<div className="p-8 text-center text-sm text-[#92918C]">Memuat…</div>}>
          <DukunganInner />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
