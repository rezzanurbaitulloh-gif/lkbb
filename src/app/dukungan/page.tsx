"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Minus, Plus, ShieldCheck, ArrowRight } from "lucide-react"
import { createBrowserSupabase } from "@/lib/supabase"
import { useApp } from "@/lib/store"

function DukunganInner(){
  const sp = useSearchParams()
  const router = useRouter()
  const { currentUser } = useApp()
  const slug = sp.get("peleton")
  const [peleton, setPeleton] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [qty,setQty]=useState(50)
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
      supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("category", {ascending:true}).order("number", {ascending:true}).limit(1).single().then(({data, error})=>{
        if(error || !data) setLoadError("Belum ada peleton aktif.")
        else setPeleton(data)
      })
    }
    supabase.from("competitions").select("*").order("created_at", {ascending:false}).limit(1).single().then(({data})=> setEvent(data))
  },[slug])

  if(loadError) return (
    <div className="mx-auto max-w-[480px] px-4 py-12 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
        <div className="text-sm font-bold">{loadError}</div>
        <Link href="/tim" className="mt-4 inline-flex"><Button className="rounded-full">Pilih Peleton di Tim</Button></Link>
      </div>
    </div>
  )
  if(!peleton) return <div className="p-8 text-center text-sm text-muted-foreground">Memuat peleton...</div>

  const onlinePrice = event?.settings?.online_price ?? 3000
  const total = qty * onlinePrice
  const presets = event?.settings?.ballot_presets || [10,50,100,300]
  const state = (event?.state as string) || ""
  const isNotStarted = state === "NOT_STARTED"
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isVotingClosed = state === "VOTING_CLOSED"
  const isPublished = state === "RESULT_PUBLISHED"
  const isClosed = event ? !isActive : false
  const closedMessage =
    isNotStarted ? "Belum dimulai — transaksi belum dibuka" :
    isVotingClosed ? "Voting ditutup — transaksi dihentikan. Peringkat online saja ditampilkan." :
    isPublished ? "Hasil dipublikasikan — transaksi dihentikan. Lihat podium juara." :
    "Transaksi ditutup"

  const handlePay = async ()=>{
    if(loading) return
    if(isClosed){
      setError(closedMessage)
      return
    }
    if(!currentUser){
      router.push(`/login?redirect=${encodeURIComponent(`/dukungan?peleton=${peleton.slug}`)}`)
      return
    }
    // Validate qty manual input
    const safeQty = Math.max(1, Math.min(10000, Math.floor(Number(qty)||1)))
    if(safeQty !== qty) setQty(safeQty)
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peletonId: peleton.id, slug: peleton.slug, quantity: safeQty })
      })
      const data = await res.json()
      if(!res.ok){
        if(res.status===401){
          router.push(`/login?redirect=${encodeURIComponent(`/dukungan?peleton=${peleton.slug}`)}`)
          return
        }
        setError(data.error || "Gagal membuat transaksi")
        setLoading(false)
        return
      }
      // Do NOT add ballot here — only after DOKU webhook PAID (verified)
      // Redirect to checkout with transaction id — will show DOKU QRIS (sandbox)
      if(data.paymentUrl && data.paymentUrl.startsWith("http")){
        window.location.href = data.paymentUrl
      } else {
        router.push(data.paymentUrl)
      }
    } catch(e:any){
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] px-3 xs:px-4 sm:px-6 py-4 xs:py-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-4 xs:gap-6">
      <div className="space-y-4">
        <div className="rounded-[12px] xs:rounded-[16px] border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
          <div className="h-1.5 xs:h-2 bg-primary" />
          <div className="p-3 xs:p-4 sm:p-5 flex gap-3 xs:gap-4">
            <img src={peleton.image_url} alt="" className="h-16 w-16 xs:h-20 xs:w-20 rounded-xl object-cover border border-white/10 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 xs:gap-2">
                <Badge variant="outline" className="text-[11px] xs:text-xs bg-white/5 backdrop-blur border-white/10 text-white">#{peleton.number}</Badge>
                <Badge variant="outline" className="text-[11px] xs:text-xs bg-white/5 backdrop-blur border-white/10 text-white">{peleton.category}</Badge>
              </div>
              <div className="mt-1 text-[14px] xs:text-[15px] sm:text-[16px] font-black leading-tight break-words">{peleton.name}</div>
              <div className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground line-clamp-1 break-words">{peleton.school} • {peleton.city}</div>
            </div>
          </div>
          <div className="px-3 xs:px-5 pb-3 xs:pb-5">
            <div className="rounded-xl bg-white/5 backdrop-blur/50 border border-white/10 p-2.5 xs:p-3 text-[11px] xs:text-xs leading-relaxed text-muted-foreground">
              Dukungan untuk <b className="text-foreground">{peleton.name}</b> akan tercatat sebagai ballot resmi <b>hanya setelah pembayaran terverifikasi</b>. {isClosed && <span className="text-red-600 font-bold">{closedMessage}. Riwayat transaksi lama tetap diproses.</span>}
            </div>
            {isClosed && <div className="mt-2.5 xs:mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] xs:text-xs font-bold text-amber-700 leading-relaxed">{closedMessage}</div>}
          </div>
        </div>

        <div className="rounded-[12px] xs:rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-3 xs:p-4 sm:p-5">
          <h3 className="text-[13px] xs:text-sm font-black">Pilih Paket Dukungan</h3>
          <p className="text-[11px] xs:text-xs text-muted-foreground">Harga resmi (dari DB): Rp{onlinePrice.toLocaleString("id-ID")} / ballot (online)</p>
          {isClosed && <p className="mt-2 text-[11px] xs:text-xs font-bold text-red-600">Pilih Paket dinonaktifkan — transaksi dihentikan.</p>}
          <div className={`mt-3 xs:mt-4 grid grid-cols-2 gap-2 xs:gap-3 ${isClosed ? "opacity-50 pointer-events-none" : ""}`}>
            {presets.map((n:number)=> {
              const price = n * onlinePrice
              const isPop = n===50
              return (
                <button key={n} disabled={isClosed} onClick={()=>setQty(n)} className={`relative rounded-xl border backdrop-blur transition-all duration-200 ${qty===n ? "border-primary bg-primary text-black scale-[1.02] shadow-[0_2px_12px_rgba(201,168,106,0.25)]" : "border-white/15 bg-transparent hover:border-white/25 text-white/85 hover:scale-[1.01]"} ${isClosed ? "cursor-not-allowed" : ""}`}>
                  {isPop && <span className="absolute -top-1.5 xs:-top-2 right-2 xs:right-3 rounded-full bg-primary px-1.5 xs:px-2 py-0.5 text-[9px] xs:text-[10px] font-black text-black border border-primary shadow-sm">POPULER</span>}
                  <div className={`text-[10px] xs:text-xs font-bold tracking-widest ${qty===n ? "text-black/70" : "text-white/60"}`}>{n} Dukungan</div>
                  <div className="mt-1 text-[15px] xs:text-[17px] sm:text-[18px] font-black tabular-nums">Rp{price.toLocaleString("id-ID")}</div>
                  <div className={`text-[11px] xs:text-xs ${qty===n ? "text-black/60" : "text-white/50"}`}>{n} ballot</div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 xs:mt-5">
            <div className="label-ceremonial text-[11px] xs:text-xs">Atur Jumlah Ballot</div>
            <p className="mt-1 text-[11px] xs:text-xs text-muted-foreground leading-relaxed">Ketik langsung atau gunakan tombol plus/minus. Maks 10.000 per transaksi.</p>
            <div className={`mt-2.5 xs:mt-2 flex items-center gap-2 xs:gap-3 ${isClosed ? "opacity-50 pointer-events-none" : ""}`}>
              <button disabled={isClosed || loading} onClick={()=>setQty(q=>Math.max(1, (Number(q)||1)-1))} className="h-10 w-10 xs:h-11 xs:w-11 rounded-full border border-white/10 bg-white/5 backdrop-blur grid place-items-center hover:bg-white/5 backdrop-blur disabled:cursor-not-allowed disabled:opacity-50 shrink-0"><Minus className="h-3.5 w-3.5 xs:h-4 xs:w-4"/></button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                value={qty}
                onChange={e=>{
                  const v = e.target.value
                  if(v==="") setQty(1)
                  else {
                    const n = parseInt(v,10)
                    if(!isNaN(n)) setQty(Math.max(1, Math.min(10000, n)))
                  }
                }}
                disabled={isClosed}
                className="flex-1 min-w-0 rounded-full border border-white/10 bg-white/5 backdrop-blur h-10 xs:h-11 text-center text-[15px] xs:text-base font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 px-2"
              />
              <button disabled={isClosed || loading} onClick={()=>setQty(q=> Math.min(10000, (Number(q)||1)+1))} className="h-10 w-10 xs:h-11 xs:w-11 rounded-full border border-white/10 bg-white/5 backdrop-blur grid place-items-center hover:bg-white/5 backdrop-blur disabled:cursor-not-allowed disabled:opacity-50 shrink-0"><Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4"/></button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-[76px] h-fit space-y-4">
        <div className="rounded-[12px] xs:rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-3 xs:p-4 sm:p-5">
          <h3 className="text-[13px] xs:text-sm font-black">Ringkasan Dukungan</h3>
          <div className="mt-3 xs:mt-4 space-y-2 text-[13px] xs:text-sm">
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">Peleton</span><span className="font-bold truncate text-right">{peleton.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Ballot</span><span className="font-bold tabular-nums">{qty}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Harga per ballot</span><span className="tabular-nums text-xs xs:text-sm">Rp{onlinePrice.toLocaleString("id-ID")}</span></div>
            <div className="hairline-thin my-3" />
            <div className="flex justify-between text-[15px] xs:text-[16px]"><span className="font-bold">Total</span><span className="font-black tabular-nums">Rp{total.toLocaleString("id-ID")}</span></div>
          </div>
           {error && <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] xs:text-xs text-red-600 leading-relaxed">{error}</div>}
           <Button onClick={handlePay} disabled={loading || isClosed} className={`mt-4 xs:mt-5 w-full rounded-full h-[44px] xs:h-[46px] gap-2 text-[13px] xs:text-sm ${isClosed ? "opacity-50 cursor-not-allowed" : ""}`} title={isClosed ? "Transaksi dihentikan — voting nonaktif" : ""}>{loading ? "Memproses..." : isClosed ? "DUKUNGAN DITUTUP" : "Lanjutkan ke Pembayaran"} <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4"/></Button>
           {isClosed && <p className="mt-2 text-center text-[11px] xs:text-xs font-bold text-red-600 leading-relaxed">Transaksi baru dihentikan — voting nonaktif. Riwayat transaksi lama tetap diproses.</p>}
           {!isClosed && <p className="mt-2 text-center text-[11px] xs:text-xs text-muted-foreground leading-relaxed">Server akan menghitung harga dan memverifikasi event state. Klik Bayar tidak langsung menambah ballot.</p>}
          <div className="mt-3 xs:mt-4 flex items-center justify-center gap-1.5 xs:gap-2 text-[11px] xs:text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0"/> Pembayaran aman — webhook terverifikasi</div>
        </div>
      </div>
    </div>
  )
}

export default function DukunganPage(){
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white/5 backdrop-blur/20 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-white/5 backdrop-blur">
          <div className="mx-auto max-w-[1080px] px-3 xs:px-4 sm:px-6 py-3.5 xs:py-4">
            <div className="label-gold text-[11px] xs:text-xs">Dukung Tim</div>
            <h1 className="text-[18px] xs:text-[20px] font-black tracking-tight leading-none">DUKUNG PELETON FAVORITMU</h1>
          </div>
        </div>
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat…</div>}>
          <DukunganInner />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
