"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Minus, Plus, ArrowRight } from "lucide-react"
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
      supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("category",{ascending:true}).order("number",{ascending:true}).limit(1).single().then(({data, error})=>{
        if(error || !data) setLoadError("Belum ada peleton aktif.")
        else setPeleton(data)
      })
    }
    supabase.from("competitions").select("*").order("created_at",{ascending:false}).limit(1).single().then(({data})=> setEvent(data))
  },[slug])

  if(loadError) return (
    <div className="container-editorial py-16 text-center">
      <div className="border border-border p-8 max-w-md mx-auto">
        <div className="font-display font-bold">Peleton tidak ditemukan</div>
        <Link href="/tim" className="mt-4 inline-flex border border-border px-4 py-2 text-xs font-bold hover:bg-muted transition-colors">Pilih Peleton di Tim →</Link>
      </div>
    </div>
  )
  if(!peleton) return <div className="p-8 text-center text-sm text-muted-foreground">Memuat peleton...</div>

  const onlinePrice = event?.settings?.online_price ?? 3000
  const total = qty * onlinePrice
  const state = (event?.state as string) || ""
  const isActive = state === "ACTIVE" || state === "VOTING_OPEN"
  const isClosed = event ? !isActive : false
  const closedMessage = state === "NOT_STARTED" ? "Belum dimulai" : state === "VOTING_CLOSED" ? "Voting ditutup" : state === "RESULT_PUBLISHED" ? "Hasil dipublikasikan" : "Transaksi ditutup"

  const handlePay = async ()=>{
    if(loading) return
    if(isClosed){ setError(closedMessage); return }
    if(!currentUser){ router.push(`/login?redirect=${encodeURIComponent(`/dukungan?peleton=${peleton.slug}`)}`); return }
    const safeQty = Math.max(1, Math.min(10000, Math.floor(Number(qty)||1)))
    if(safeQty !== qty) setQty(safeQty)
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
    <div className="container-editorial py-8">
      {/* Header — editorial, not card */}
      <div className="border-b border-border pb-6">
        <div className="meta-label">Dukung Tim • #{peleton.number}</div>
        <h1 className="mt-2 font-display font-bold text-[28px] lg:text-[36px] leading-[0.9] tracking-[-0.02em]">
          DUKUNG {peleton.name}
        </h1>
        <div className="mt-2 meta-label">{peleton.school} • {peleton.category} • {peleton.city}</div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 mt-8">
        {/* Left: peleton photo — editorial crop */}
        <div>
          <div className="aspect-[4/3] overflow-hidden bg-muted border border-border">
            <img src={peleton.image_url} alt={peleton.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-4 meta-label">Tentang Peleton</div>
          <p className="mt-2 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
            Dukungan untuk <b className="text-foreground">{peleton.name}</b> akan tercatat sebagai ballot resmi <b>hanya setelah pembayaran terverifikasi</b>.
            {isClosed && <span className="text-destructive font-bold"> {closedMessage}.</span>}
          </p>
          {isClosed && <div className="mt-3 border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-700">{closedMessage}</div>}
        </div>

        {/* Right: CHOOSE YOUR BALLOT — main event */}
        <div className="border border-border p-6 lg:p-8">
          <div className="meta-label">Support</div>
          <h2 className="mt-2 font-display font-bold text-[24px] leading-[0.9] tracking-[-0.02em]">
            CHOOSE YOUR<br /><span className="text-primary">BALLOT.</span>
          </h2>

          <div className={`mt-6 grid grid-cols-3 gap-2 ${isClosed ? "opacity-50 pointer-events-none" : ""}`}>
            {[10,50,100].map(n=> (
              <button key={n} onClick={()=>setQty(n)} className={`h-12 border text-sm font-bold tracking-wide transition-colors ${qty===n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                {n}
              </button>
            ))}
          </div>
          <button onClick={()=>setQty(25)} className="mt-2 w-full h-9 border border-border text-xs font-bold tracking-[0.14em] uppercase hover:bg-muted transition-colors">CUSTOM</button>

          <div className="mt-6 flex items-center gap-2">
            <button disabled={isClosed} onClick={()=>setQty(q=>Math.max(1, (Number(q)||1)-1))} className="h-9 w-9 grid place-items-center border border-border hover:bg-muted disabled:opacity-50"><Minus className="h-3 w-3"/></button>
            <div className="flex-1 h-9 grid place-items-center border border-border tabular-nums text-sm font-bold">{qty}</div>
            <button disabled={isClosed} onClick={()=>setQty(q=> Math.min(10000, (Number(q)||1)+1))} className="h-9 w-9 grid place-items-center border border-border hover:bg-muted disabled:opacity-50"><Plus className="h-3 w-3"/></button>
          </div>

          <div className="mt-6 border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold tabular-nums">{qty} BALLOTS</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Harga per ballot</span><span className="tabular-nums">Rp{onlinePrice.toLocaleString("id-ID")}</span></div>
            <div className="hairline my-2" />
            <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold tabular-nums">Rp{total.toLocaleString("id-ID")}</span></div>
          </div>

          {error && <div className="mt-4 border border-destructive bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <Button onClick={handlePay} disabled={loading || isClosed} className="mt-6 w-full h-11 rounded-none font-bold tracking-wide">
            {loading ? "Memproses..." : isClosed ? "DUKUNGAN DITUTUP" : "CONTINUE →"}
          </Button>
          {!isClosed && <p className="mt-2 text-center text-xs text-muted-foreground">Server akan menghitung harga dan memverifikasi event state.</p>}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Pembayaran aman — webhook terverifikasi
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DukunganPage(){
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat…</div>}>
          <DukunganInner />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
