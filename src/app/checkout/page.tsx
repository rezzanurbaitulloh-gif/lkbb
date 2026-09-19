"use client"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { createBrowserSupabase } from "@/lib/supabase"
import { unlockAudio, playNotificationSequenceForce } from "@/lib/sound"
import QRCode from "qrcode"

function CheckoutInner(){
  const sp = useSearchParams()
  const id = sp.get("id") || ""
  const slug = sp.get("peleton")
  const [peleton,setPeleton]=useState<any>(null)
  const [trx,setTrx]=useState<any>(null)
  const [polling,setPolling]=useState(false)
  const [simulating,setSimulating]=useState(false)
  const [qrDataUrl,setQrDataUrl]=useState<string | null>(null)
  const [method, setMethod]=useState("va")
  useEffect(()=>{
    const supabase = createBrowserSupabase()
    if(slug) supabase.from("peletons").select("*").eq("slug", slug).single().then(({data})=> setPeleton(data))
    else supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("number",{ascending:true}).limit(1).single().then(({data})=> setPeleton(data))
    if(id) supabase.from("transactions").select("*").eq("id", id).single().then(({data})=> setTrx(data))
  },[slug, id])

  useEffect(()=>{
    const content = trx?.qr_content || trx?.qrContent
    if(content && trx?.status === "Pending"){
      QRCode.toDataURL(content, { width: 400, margin: 1, color: { dark: "#000000", light: "#FFFFFF" } }).then(url=> setQrDataUrl(url)).catch(()=> setQrDataUrl(null))
    } else setQrDataUrl(null)
  },[trx?.qr_content, trx?.qrContent, trx?.status])

  useEffect(()=>{ unlockAudio() },[])

  useEffect(()=>{
    if(!id || !trx || trx.status === "Success") return
    const interval = setInterval(async ()=>{
      try {
        const res = await fetch('/api/payment/status/' + id)
        if(res.ok){
          const data = await res.json()
          const newStatus = data.status || data.transaction?.status
          if(newStatus && newStatus !== trx.status){
            setTrx((prev:any)=> ({...prev, status: newStatus, ...(data.transaction || {})}))
            if(newStatus === "Success" || newStatus === "PAID"){
              clearInterval(interval)
              playNotificationSequenceForce(`Selamat! Dukungan berhasil`).catch(()=>{})
            }
          }
        }
      } catch {}
    }, 3000)
    return ()=> clearInterval(interval)
  },[id, trx])

  const handleCheckStatus = async ()=>{
    if(!id) return
    setPolling(true); unlockAudio()
    try {
      const res = await fetch('/api/payment/status/' + id)
      if(res.ok){
        const data = await res.json()
        if(data.transaction) setTrx(data.transaction)
        else if(data.status) setTrx((prev:any)=> ({...prev, status: data.status}))
        if(data.status==="Success") playNotificationSequenceForce(`Selamat! Dukungan berhasil`).catch(()=>{})
      }
    } catch {}
    setPolling(false)
  }
  const handleSimulate = async ()=>{
    if(!id || simulating) return
    setSimulating(true); unlockAudio()
    try {
      const res = await fetch("/api/payment/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: id }) })
      const data = await res.json().catch(()=> ({}))
      if(res.ok && (data.status === "Success" || data.ok)) setTrx((prev:any)=> ({...prev, status: "Success"}))
    } catch {}
    setSimulating(false)
  }

  if(!peleton) return <div className="mx-auto max-w-[560px] px-4 py-12 text-center text-sm text-[#92918C]">Memuat peleton...</div>
  const p: any = peleton
  const status = (trx?.status?.toLowerCase() === "success" ? "success" : "pending")
  const qty = trx ? String(trx.supports) : (sp.get("qty") || "75")
  const total = trx ? Number(trx.amount) : 225000

  // SUCCESS — plek PNG: SUPPORT RECEIVED
  if(status==="success"){
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/[0.08]">
            <img src={p.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[#D9FF3F] text-[22px] text-[#D9FF3F]">✓</div>
              <h2 className="mt-4 font-display text-[28px] font-bold leading-[0.95]">SUPPORT<br /><span className="text-[#D9FF3F]">RECEIVED.</span></h2>
              <p className="mt-2 text-[12px] text-white/70">Your voice has been counted.</p>
              <Link href="/tim" className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[11px] font-bold tracking-wide hover:bg-white/10">BACK TO EVENT →</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111110] p-6">
            <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">→ PAYMENT</div>
            <div className="mt-2 text-[13px] font-bold">{qty} BALLOTS • Rp{Number(total).toLocaleString("id-ID")}</div>
            <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">Pembayaran terverifikasi. Ballot masuk.</div>
            <Link href="/profile/dukungan" className="mt-4 grid h-11 place-items-center rounded-full bg-[#D9FF3F] text-[11px] font-bold text-black">LIHAT TRANSAKSI</Link>
          </div>
        </div>
      </div>
    )
  }

  // PAYMENT — plek PNG: Complete Your Payment
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]">
          <img src={p.image_url} alt="" className="aspect-[16/10] w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <div className="font-display text-[15px] font-bold text-white">{p.name}</div>
            <div className="text-[10px] tracking-[0.14em] text-white/60">{qty} BALLOTS • Rp{Number(total).toLocaleString("id-ID")}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111110] p-6">
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">→ PAYMENT</div>
          <h2 className="mt-2 font-display text-[18px] font-bold">Complete Your Payment</h2>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3">
            <span className="text-[11px] text-[#92918C]">Total Amount</span>
            <span className="text-[13px] font-bold tabular-nums">Rp{Number(total).toLocaleString("id-ID")}</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { k:"qris", t:"QRIS", s: trx?.provider ? `via ${trx.provider}` : "Scan QR dari e-wallet / m-banking" },
              { k:"va", t:"Virtual Account", s: trx?.method && trx.method!=="QRIS" ? String(trx.method) : "Transfer bank" },
              { k:"ew", t:"E-Wallet", s: "OVO • GoPay • DANA • LinkAja" },
              { k:"cc", t:"Credit / Debit Card", s: "VISA • Mastercard" },
            ].map(o=> (
              <button key={o.k} onClick={()=> setMethod(o.k)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${method===o.k ? "border-[#D9FF3F]/50 bg-[#D9FF3F]/[0.05]" : "border-white/[0.08] hover:border-white/20"}`}>
                <span className="flex items-center gap-3">
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${method===o.k ? "border-[#D9FF3F]" : "border-white/20"}`}>{method===o.k && <span className="h-2 w-2 rounded-full bg-[#D9FF3F]" />}</span>
                  <span><span className="block text-[12px] font-bold">{o.t}</span><span className="block text-[10px] text-[#92918C]">{o.s}</span></span>
                </span>
                <span className="text-[#92918C]">›</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-[#92918C]">Kanal aktual mengikuti invoice {trx?.provider || "Xendit"}{trx?.method ? ` • ${trx.method}` : ""}. Pilihan di atas preferensi tampilan.</p>
          {qrDataUrl ? (
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-white p-3">
              <img src={qrDataUrl} alt="QRIS" className="mx-auto h-[180px] w-[180px] object-contain" />
            </div>
          ) : (
            <p className="mt-3 text-center text-[11px] text-[#92918C]">QR / VA muncul setelah metode dipilih{ id ? "" : " — buat transaksi dulu via Dukungan" }.</p>
          )}
          <button onClick={handleCheckStatus} disabled={polling || !id} className="mt-4 grid h-11 w-full place-items-center rounded-full bg-[#D9FF3F] text-[11px] font-bold text-black hover:brightness-105 disabled:opacity-50">
            {polling ? "Memeriksa..." : "PAY NOW"}
          </button>
          {!id && <Link href={`/dukungan?peleton=${slug||""}`} className="mt-2 grid h-11 w-full place-items-center rounded-full border border-white/15 text-[11px] font-bold">BUAT TRANSAKSI DULU</Link>}
          {id && <button onClick={handleSimulate} disabled={simulating} className="mt-2 h-9 w-full rounded-full border border-dashed border-white/15 text-[11px] font-bold text-[#92918C]">{simulating ? "Mensimulasikan..." : "Simulasi Bayar (Sandbox)"}</button>}
          <button onClick={()=> history.back()} className="mt-3 w-full text-center text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white">→ BACK</button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage(){
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A09] text-[#F2F0E9]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Suspense fallback={<div className="p-8 text-center">Memuat…</div>}>
          <CheckoutInner />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
