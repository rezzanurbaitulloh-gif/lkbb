"use client"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { createBrowserSupabase } from "@/lib/supabase"
import { CheckCircle2, Clock3, XCircle, Timer } from "lucide-react"
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
  useEffect(()=>{
    const supabase = createBrowserSupabase()
    if(slug) supabase.from("peletons").select("*").eq("slug", slug).single().then(({data})=> setPeleton(data))
    else supabase.from("peletons").select("*").eq("verified", true).eq("active", true).order("category", {ascending:true}).order("number", {ascending:true}).limit(1).single().then(({data})=> setPeleton(data))
    if(id) {
      // Fetch transaction from DB (via anon but RLS will filter to own)
      supabase.from("transactions").select("*").eq("id", id).single().then(({data})=> setTrx(data))
    }
  },[slug, id])

  // Generate QR data URL when trx has qr_content (DOKU)
  useEffect(()=>{
    const content = trx?.qr_content || trx?.qrContent
    if(content && trx?.status === "Pending"){
      QRCode.toDataURL(content, { width: 400, margin: 1, color: { dark: "#000000", light: "#FFFFFF" } }).then(url=> setQrDataUrl(url)).catch(()=> setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  },[trx?.qr_content, trx?.qrContent, trx?.status])

  // Ensure audio unlocked on mount (user gesture may have happened on dukungan page)
  useEffect(()=>{ unlockAudio() },[])

  // Poll transaction status every 3s when pending — webhook is authoritative, polling is UX only
  useEffect(()=>{
    if(!id || !trx || trx.status === "Success") return
    const interval = setInterval(async ()=>{
      try {
        const res = await fetch(`/api/payment/status/${id}`)
        if(res.ok){
          const data = await res.json()
          const newStatus = data.status || data.transaction?.status
          if(newStatus && newStatus !== trx.status){
            setTrx((prev:any)=> ({...prev, status: newStatus, ...(data.transaction || {})}))
            if(newStatus === "Success" || newStatus === "PAID"){
              clearInterval(interval)
              const peletonName = peleton?.name || "peleton"
              playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil — ${trx?.supports || ""} ballot`).catch(()=>{})
            }
          } else if(data.transaction?.qr_content && !trx.qr_content){
            setTrx((prev:any)=> ({...prev, qr_content: data.transaction.qr_content}))
          }
        } else {
          const supabase = createBrowserSupabase()
          const { data } = await supabase.from("transactions").select("status, qr_content").eq("id", id).single()
          if(data && data.status !== trx.status){
            setTrx((prev:any)=> ({...prev, status: data.status, qr_content: (data as any).qr_content}))
            if(data.status === "Success") {
              clearInterval(interval)
              const peletonName = peleton?.name || "peleton"
              playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil`).catch(()=>{})
            }
          }
        }
      } catch {}
    }, 3000)
    return ()=> clearInterval(interval)
  },[id, trx, peleton?.name])

  const handleCheckStatus = async ()=>{
    if(!id) return
    setPolling(true)
    unlockAudio()
    try {
      const res = await fetch(`/api/payment/status/${id}`)
      if(res.ok){
        const data = await res.json()
        // API returns {status, transaction}
        const newStatus = data.status || data.transaction?.status
        if(newStatus === "Success" || newStatus === "PAID"){
          const peletonName = peleton?.name || "peleton"
          playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil`).catch(()=>{})
        }
        if(data.transaction) setTrx(data.transaction)
        else if(data.status) setTrx((prev:any)=> ({...prev, status: data.status}))
        else {
          const supabase = createBrowserSupabase()
          const { data } = await supabase.from("transactions").select("*").eq("id", id).single()
          if(data) {
            if(data.status === "Success"){
              const peletonName = peleton?.name || "peleton"
              playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil`).catch(()=>{})
            }
            setTrx(data)
          }
        }
      } else {
        const supabase = createBrowserSupabase()
        const { data } = await supabase.from("transactions").select("*").eq("id", id).single()
        if(data) {
          if(data.status === "Success"){
            const peletonName = peleton?.name || "peleton"
            playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil`).catch(()=>{})
          }
          setTrx(data)
        }
      }
    } catch {}
    setPolling(false)
  }

  // Sandbox: simulate successful Xendit payment (server only allows XENDIT_MODE=test)
  const handleSimulate = async ()=>{
    if(!id || simulating) return
    setSimulating(true)
    unlockAudio()
    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      })
      const data = await res.json().catch(()=> ({}))
      if(res.ok && (data.status === "Success" || data.ok)){
        const peletonName = peleton?.name || "peleton"
        playNotificationSequenceForce(`Selamat! Dukungan untuk ${peletonName} berhasil`).catch(()=>{})
        setTrx((prev:any)=> ({...prev, status: "Success"}))
      }
    } catch {}
    setSimulating(false)
  }

  // If redirect with ?status=success but DB still Pending, poll status (webhook still authoritative)
  useEffect(()=>{
    const qsStatus = sp.get("status")
    if(qsStatus === "success" && trx && trx.status !== "Success"){
      handleCheckStatus()
    }
  },[trx?.id])

  if(!peleton) return <div className="mx-auto max-w-[560px] px-4 py-12 text-center text-sm text-muted-foreground">Memuat peleton...</div>
  const p: any = peleton
  const status = (trx?.status?.toLowerCase() === "success" ? "success" : trx?.status?.toLowerCase() === "failed" ? "failed" : trx?.status?.toLowerCase() === "expired" ? "expired" : "pending") as string
  const qty = trx ? String(trx.supports) : (sp.get("qty") || "50")
  const total = trx ? String(trx.amount) : (sp.get("total") || "150000")

  // DOKU disabled — Xendit Sandbox is current
  const isXendit = trx?.provider === "XENDIT" || !trx?.provider
  const config = {
    success: { title:"DUKUNGAN BERHASIL", desc:`Terima kasih telah memberikan dukungan kepada ${p.name} — ballot telah masuk setelah pembayaran terverifikasi`, icon: CheckCircle2, color:"bg-emerald-500", bg:"bg-emerald-500/10 border-emerald-500/20" },
    pending: { title:"PEMBAYARAN MENUNGGU", desc: isXendit ? "Selesaikan pembayaran QRIS via Xendit. Ballot hanya bertambah setelah pembayaran terverifikasi." : "Selesaikan pembayaran QRIS. Ballot hanya bertambah setelah pembayaran terverifikasi webhook.", icon: Clock3, color:"bg-amber-500", bg:"bg-amber-500/10 border-amber-500/20" },
    failed: { title:"PEMBAYARAN TIDAK BERHASIL", desc:"Pembayaran gagal. Silakan coba lagi.", icon: XCircle, color:"bg-red-500", bg:"bg-red-500/10 border-red-500/20" },
    expired: { title:"TRANSAKSI KEDALUWARSA", desc:"Waktu pembayaran telah habis", icon: Timer, color:"bg-zinc-500", bg:"bg-zinc-500/10 border-zinc-500/20" },
  }[status as string] || { title:"PEMBAYARAN MENUNGGU", desc: isXendit ? "Menunggu verifikasi Xendit (webhook)" : "Menunggu verifikasi", icon: Clock3, color:"bg-amber-500", bg:"bg-amber-500/10 border-amber-500/20" }

  const Icon = config.icon

  return (
    <div className="mx-auto max-w-[560px] px-3 sm:px-4 md:px-6 py-8">
      <div className={`rounded-[20px] border p-6 md:p-8 text-center ${config.bg}`}>
        <div className={`mx-auto h-20 w-20 rounded-full ${config.color} grid place-items-center text-white shadow-lg`}>
          <Icon className="h-10 w-10" />
        </div>
        <h1 className="mt-5 text-[20px] font-black tracking-tight">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">{config.desc}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-left">
          <div className="flex gap-3">
            <img src={p.image_url || p.image} alt="" className="h-14 w-14 rounded-xl object-cover border border-white/10" />
            <div>
              <div className="text-sm font-black">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.school}</div>
              <div className="text-xs font-bold tabular-nums">{qty} BALLOT • Rp{Number(total).toLocaleString("id-ID")}</div>
            </div>
          </div>
          <div className="hairline my-3" />
          <div className="grid gap-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">ID Invoice</span><span className="font-mono font-bold">LKBB-{id.slice(0,8).toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ID Transaksi</span><span className="font-mono font-bold text-[10px]">{id.slice(0,12)}...</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span className="font-bold">QRIS</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-black">{status.toUpperCase()}</span></div>
          </div>
        </div>

        {status==="pending" && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
            <div className="text-xs font-bold tracking-widest">BAYAR VIA QRIS</div>
            <div className="tabular-nums text-[24px] font-black text-amber-600">Menunggu</div>
            <div className="mx-auto mt-3 h-[220px] w-[220px] rounded-xl border border-white/10 bg-white grid place-items-center p-2 overflow-hidden">
              {qrDataUrl ? (
                <img id="qris-image" src={qrDataUrl} alt="QRIS" className="h-full w-full object-contain" />
              ) : trx?.qr_content ? (
                <div className="text-[11px] leading-tight text-center text-muted-foreground break-all p-2">
                  QRIS<br/><span className="font-mono text-[10px] break-all">{String(trx.qr_content).slice(0,60)}...</span><br/>
                  <span className="text-[10px]">Gagal render QR, gunakan String di atas</span>
                </div>
              ) : (
                <div className="text-[11px] leading-tight text-center text-muted-foreground">
                  QRIS<br/><span className="font-bold text-foreground">Menyiapkan QR...</span><br/>
                  <span className="text-[10px]">Jika QR tidak muncul, klik Cek Status atau refresh</span>
                </div>
              )}
            </div>
            {qrDataUrl && (
              <Button
                variant="outline"
                className="mt-3 w-full rounded-full gap-2"
                onClick={()=>{
                  if(!qrDataUrl) return
                  const a = document.createElement('a')
                  a.href = qrDataUrl
                  a.download = `qris-${id || 'lkbb'}.png`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
              >
                ⬇ Download QR
              </Button>
            )}
            {trx?.doku_reference_no && <div className="mt-2 text-[11px] font-mono text-muted-foreground">Ref: {trx.doku_reference_no.slice(0,16)}...</div>}
            <p className="mt-2 text-xs text-muted-foreground">Ballot <b>tidak</b> langsung bertambah. Menunggu pembayaran terverifikasi. Scan QR dengan e-wallet / m-banking, selesaikan dalam 15 menit.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Jika sudah bayar, klik Cek Status. Polling tiap 3 detik (hanya UX).</p>
            {trx?.expires_at && <p className="mt-1 text-[11px] text-muted-foreground">Kadaluarsa: {new Date(trx.expires_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>}
          </div>
        )}

          <div className="mt-6 grid gap-2">
            {status==="success" ? (
              <>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700">Pembayaran terverifikasi via Xendit webhook. Ballot masuk ke ledger.</div>
                <Link href="/profile/dukungan"><Button className="w-full rounded-full h-11">Lihat Transaksi</Button></Link>
                <Link href="/"><Button variant="outline" className="w-full rounded-full">Kembali ke Beranda</Button></Link>
              </>
            ) : status==="pending" ? (
              <>
                <Button className="w-full rounded-full h-11" onClick={handleCheckStatus} disabled={polling}>{polling ? "Memeriksa..." : "Cek Status Pembayaran"}</Button>
                <Button variant="outline" className="w-full rounded-full h-11 border-dashed" onClick={handleSimulate} disabled={simulating}>{simulating ? "Mensimulasikan..." : "Simulasi Bayar (Sandbox)"}</Button>
                <p className="text-center text-[11px] text-muted-foreground">Tombol simulasi khusus sandbox — seolah-olah QR sudah dibayar.</p>
              <p className="text-center text-[11px] text-muted-foreground">Webhook Xendit adalah satu-satunya penentu PAID — jangan bypass via frontend.</p>
              <Link href="/peleton"><Button variant="outline" className="w-full rounded-full">Batal</Button></Link>
            </>
          ) : (
            <>
              <Link href={`/dukungan?peleton=${slug}`}><Button className="w-full rounded-full h-11">Coba Lagi</Button></Link>
              <Link href="/"><Button variant="outline" className="w-full rounded-full">Kembali</Button></Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Butuh bantuan? <a href="/kontak" className="font-semibold text-foreground hover:underline">Hubungi Panitia</a>
      </div>
    </div>
  )
}

export default function CheckoutPage(){
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white/5 backdrop-blur/20 pb-[72px] md:pb-0">
        <Suspense fallback={<div className="p-8 text-center">Memuat…</div>}>
          <CheckoutInner />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
