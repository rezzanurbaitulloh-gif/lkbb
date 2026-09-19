"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { createBrowserSupabase } from "@/lib/supabase"
import QRCode from "qrcode"

export default function InvoicePage(){
  const params = useParams() as { id: string }
  const id = params.id
  const { currentUser } = useApp()
  const [tx, setTx] = useState<any>(null)
  const [peleton, setPeleton] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  useEffect(()=>{
    if(!id) return
    const fetchTx = async ()=>{
      setLoading(true)
      try{
        const res = await fetch(`/api/transactions?id=${id}`)
        if(!res.ok){
          const j = await res.json().catch(()=> ({}))
          throw new Error(j.error || "Gagal memuat transaksi")
        }
        const data = await res.json()
        // API returns single object when id query, or array
        const t = Array.isArray(data) ? data[0] : data
        if(!t || t.error) throw new Error("Transaksi tidak ditemukan")
        setTx(t)
        // fetch peleton detail for invoice
        if(t.peleton_id){
          const sup = createBrowserSupabase()
          const { data: p } = await sup.from("peletons").select("name,school,category,number,logo_url,image_url").eq("id", t.peleton_id).single()
          if(p) setPeleton(p)
          else if(t.peletons) setPeleton(t.peletons)
        } else if(t.peletons){
          setPeleton(t.peletons)
        }
      }catch(e:any){
        setError(e.message || "Gagal")
      }finally{
        setLoading(false)
      }
    }
    fetchTx()
  },[id])

  // Generate QR for pending - persist until status changes
  useEffect(()=>{
    const content = tx?.qr_content || tx?.qrContent
    if(content && tx?.status === "Pending"){
      QRCode.toDataURL(content, { width: 400, margin: 1, color: { dark: "#000000", light: "#FFFFFF" } }).then(url=> setQrDataUrl(url)).catch(()=> setQrDataUrl(null))
    } else {
      setQrDataUrl(null)
    }
  },[tx?.qr_content, tx?.qrContent, tx?.status])

  // Poll status while pending - QR auto hilang saat success/failed
  useEffect(()=>{
    if(!tx || tx.status !== "Pending" || !id) return
    const interval = setInterval(async ()=>{
      try{
        const statusUrl = '/api/payment/status/' + id; const res = await fetch(statusUrl)
        if(res.ok){
          const data = await res.json()
          const newStatus = data.status || data.transaction?.status
          if(newStatus && newStatus !== tx.status){
            setTx((prev:any)=> ({...prev, status: newStatus, ...(data.transaction || {})}))
          }
        }
      }catch{}
    }, 3000)
    return ()=> clearInterval(interval)
  },[tx?.status, id])

  const isSuccess = tx?.status === "Success"
  const invoiceNo = tx ? `LKBB-${String(tx.id).slice(0,8).toUpperCase()}` : "-"
  const txDate = tx ? new Date(tx.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"
  const unitPrice = tx ? (tx.supports ? Math.round(Number(tx.amount) / Number(tx.supports)) : Number(tx.amount)) : 0
  const statusId = ({ Success: "Berhasil", Pending: "Menunggu", Failed: "Gagal", Expired: "Kedaluarsa" } as Record<string,string>)[tx?.status || ""] || tx?.status || "-"

  const handlePrint = ()=>{
    if(!isSuccess) return
    window.print()
  }

  if(!currentUser){
    return (
      <div className="min-h-screen flex flex-col bg-[#09090b] text-white">
        <Navbar />
        <main className="flex-1 grid place-items-center p-8 bg-[#09090b]">
          <div className="text-center rounded-2xl border border-white/10 bg-[#111318] p-8">
            <div className="text-sm font-black">Belum Masuk</div>
            <p className="text-sm text-white/60">Masuk untuk melihat invoice.</p>
            <Link href="/login"><Button className="mt-3 rounded-full">Masuk</Button></Link>
          </div>
        </main>
        <Footer /><BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-white">
      <style>{`
        @media print {
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #fff !important;
            color: #000 !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
        #invoice-print { display: none; }
        @media print {
          #invoice-print { display: block !important; }
        }
      `}</style>
      {/* ===== PRINT-ONLY: invoice teks polos, hanya info penting ===== */}
      {tx && (
        <div id="invoice-print">
          <div style={{ fontFamily: "monospace, monospace", fontSize: 12, lineHeight: 1.6, color: "#000" }}>
            <div style={{ textAlign: "center", fontWeight: 700 }}>LKBB JAVASOMA — INVOICE PEMBAYARAN</div>
            <div style={{ textAlign: "center" }}>Astra Dharma Hayuning Budaya</div>
            <div>----------------------------------------</div>
            <div>No. Invoice&nbsp;&nbsp;&nbsp;: {invoiceNo}</div>
            <div>ID Transaksi : {tx.id}</div>
            <div>Tanggal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {txDate}</div>
            <div>Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: LUNAS</div>
            <div>----------------------------------------</div>
            <div>PEMBAYAR</div>
            <div>Nama&nbsp;&nbsp;: {currentUser.name}</div>
            <div>Email : {currentUser.email}</div>
            <div>User ID: {currentUser.id}</div>
            <div>----------------------------------------</div>
            <div>PEMBELIAN</div>
            <div>Peleton&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {peleton?.name || tx.peletons?.name || "-"}</div>
            <div>Sekolah&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {peleton?.school || "-"}</div>
            <div>Kategori/No : {(peleton?.category || "-") + " / #" + (peleton?.number || "-")}</div>
            <div>Jumlah&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.supports} suara</div>
            <div>Harga satuan : Rp{Number(unitPrice).toLocaleString("id-ID")}</div>
            <div>Metode&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.method || "QRIS"}</div>
            <div>Provider&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.provider || "XENDIT"}</div>
            <div>Ref Provider : {tx.provider_ref || tx.doku_reference_no || "-"}</div>
            <div>----------------------------------------</div>
            <div style={{ fontWeight: 700 }}>TOTAL BAYAR : Rp{Number(tx.amount).toLocaleString("id-ID")}</div>
            <div>----------------------------------------</div>
            <div style={{ textAlign: "center" }}>Invoice sah sebagai bukti transaksi digital.</div>
          </div>
        </div>
      )}
      <div className="no-print contents">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 bg-[#09090b]">
        <div className="mx-auto max-w-[720px] px-3 sm:px-4 md:px-6 py-6">
          <Link href="/profile/dukungan" className="text-xs font-semibold text-white/60 hover:text-white">← Kembali ke Riwayat</Link>
          <h1 className="mt-2 text-[22px] font-black tracking-tight">INVOICE TRANSAKSI</h1>
          <p className="text-xs text-white/50">Detail lengkap transaksi dukungan — simpan sebagai bukti</p>

          {loading ? (
            <div className="mt-6 rounded-[16px] border border-white/10 bg-[#111318] p-8 text-center text-sm text-white">Memuat invoice...</div>
          ) : error ? (
            <div className="mt-6 rounded-[16px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-400">{error}</div>
          ) : tx ? (
            <div className="mt-6 space-y-4">
              {/* Invoice Card */}
              <div className="rounded-[16px] border border-white/10 bg-[#111318] overflow-hidden">
                <div className="h-1 bg-[var(--primary)]" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.14em] text-[var(--primary)]">LKBB JAVASOMA — INVOICE</div>
                      <div className="mt-1 font-mono text-xs text-white">LKBB-{tx.id.slice(0,8).toUpperCase()}</div>
                      <div className="font-mono text-[10px] text-white/40">ID: {tx.id.slice(0,12)}...</div>
                      <div className="font-mono text-xs text-white/60">Ref: {tx.provider_ref || tx.doku_reference_no || "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tx.status==="Success" ? "bg-emerald-500 text-black" : tx.status==="Pending" ? "bg-amber-500 text-black" : "bg-red-500 text-black"}`}>{statusId}</div>
                      <div className="mt-1 text-xs text-white/50">{new Date(tx.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</div>
                    </div>
                  </div>

                  <div className="hairline my-4 bg-white/10" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-widest text-white/40">PELETON</div>
                      <div className="mt-2 flex gap-3">
                        <div className="h-12 w-12 bg-transparent grid place-items-center shrink-0">
                          <img src={peleton?.logo_url || peleton?.image_url || "/assets/brand/lkbb-logo.jpg"} alt="" className="h-full w-full object-contain bg-transparent" />
                        </div>
                        <div>
                          <div className="text-sm font-black">{peleton?.name || tx.peletons?.name || "-"}</div>
                          <div className="text-xs text-white/60">{peleton?.school || ""}</div>
                          <div className="text-xs text-white/50">#{peleton?.number || ""} • {peleton?.category || ""}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-widest text-white/40">PEMBAYAR</div>
                      <div className="mt-2">
                        <div className="text-sm font-bold">{currentUser.name}</div>
                        <div className="text-xs text-white/60">{currentUser.email}</div>
                        <div className="text-xs text-white/50">User ID: {currentUser.id.slice(0,8)}...</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/50">Jumlah Suara</span><span className="font-black tabular-nums">{tx.supports} suara</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Harga per Suara</span><span className="tabular-nums">Rp{tx.supports ? Math.round(tx.amount / tx.supports).toLocaleString("id-ID") : tx.amount?.toLocaleString("id-ID")}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Metode</span><span className="font-bold">{tx.method || "QRIS"} • {tx.provider || "XENDIT"}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Provider Ref</span><span className="font-mono text-xs">{tx.provider_ref?.slice(0,16) || "-"}...</span></div>
                      {tx.expires_at && <div className="flex justify-between"><span className="text-white/50">Kadaluarsa</span><span className="text-xs">{new Date(tx.expires_at).toLocaleString("id-ID")}</span></div>}
                      <div className="hairline my-2 bg-white/10" />
                      <div className="flex justify-between text-[16px]"><span className="font-bold">Total Bayar</span><span className="font-black tabular-nums text-[var(--primary)]">Rp{Number(tx.amount).toLocaleString("id-ID")}</span></div>
                    </div>
                  </div>

                  {tx.status === "Pending" && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
                      <div className="text-xs font-bold tracking-widest text-center">BAYAR VIA QRIS</div>
                      <div className="tabular-nums text-[18px] font-black text-amber-600 text-center">Menunggu Pembayaran</div>
                      <div className="mx-auto mt-3 h-[220px] w-[220px] rounded-xl border border-white/10 bg-white grid place-items-center p-2 overflow-hidden">
                        {qrDataUrl ? (
                          <img src={qrDataUrl} alt="QRIS" className="h-full w-full object-contain" />
                        ) : tx.qr_content ? (
                          <div className="text-[10px] font-mono break-all text-white/60 p-2 text-center">{tx.qr_content.slice(0,60)}...</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Menyiapkan QR...</div>
                        )}
                      </div>
                      {qrDataUrl && (
                        <Button
                          variant="outline"
                          className="mt-3 w-full rounded-full"
                          onClick={()=>{
                            if(!qrDataUrl) return
                            const a=document.createElement('a'); a.href=qrDataUrl; a.download=`qris-LKBB-${tx.id.slice(0,8)}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a)
                          }}
                        >
                          ⬇ Unduh QR
                        </Button>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground text-center">QR tetap terlihat sampai status berubah. Akan otomatis hilang saat Berhasil/Batal.</p>
                      {polling && <p className="mt-1 text-[11px] text-muted-foreground text-center">Memeriksa status...</p>}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2">
                    {isSuccess ? (
                      <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePrint}>Cetak Invoice</Button>
                    ) : (
                      <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        Invoice hanya dapat dicetak setelah pembayaran <b>berhasil</b>. Status saat ini: <b>{statusId}</b>.
                      </div>
                    )}
                    <Link href="/profile/dukungan"><Button variant="outline" className="rounded-full">Kembali</Button></Link>
                  </div>

                  <div className="mt-4 text-[11px] text-white/30 text-center">Invoice ini sah sebagai bukti transaksi digital LKBB JAVASOMA THE IMPRESSION — Astra Dharma Hayuning Budaya</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#111318] p-4">
                <h3 className="text-xs font-black tracking-wide">BANTUAN</h3>
                <p className="mt-1 text-xs text-white/50">Jika status masih Menunggu setelah bayar, gunakan Cek Status di halaman Pembayaran atau hubungi panitia via Kontak.</p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
      <BottomNav />
      </div>
    </div>
  )
}
