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

export default function AdminTransactionDetailPage(){
  const params = useParams() as { id: string }
  const id = params.id
  const { currentUser, isAdmin } = useApp()
  const [tx, setTx] = useState<any>(null)
  const [peleton, setPeleton] = useState<any>(null)
  const [payer, setPayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(()=>{
    if(!id) return
    const fetchTx = async ()=>{
      setLoading(true)
      try{
        // Admin harus bisa lihat SELURUH transaksi (milik siapa pun) -> pakai all=true
        const res = await fetch(`/api/transactions?id=${id}&all=true`)
        if(!res.ok){
          const j = await res.json().catch(()=> ({}))
          throw new Error(j.error || "Gagal memuat transaksi")
        }
        const data = await res.json()
        const t = Array.isArray(data) ? data[0] : data
        if(!t || (t as any).error) throw new Error("Transaksi tidak ditemukan")
        setTx(t)
        // Peleton: pakai join dulu, fallback query langsung
        if((t as any).peletons) setPeleton((t as any).peletons)
        if(t.peleton_id){
          const sup = createBrowserSupabase()
          const { data: p } = await sup.from("peletons").select("name,school,category,number,logo_url,image_url").eq("id", t.peleton_id).single()
          if(p) setPeleton(p)
        }
        // Pembayar: pakai join profiles dulu, fallback query langsung
        if((t as any).profiles) {
          setPayer((t as any).profiles)
        } else if(t.user_id){
          const sup = createBrowserSupabase()
          const { data: prof } = await sup.from("profiles").select("public_name,email,role").eq("id", t.user_id).maybeSingle()
          if(prof) setPayer(prof)
        }
      }catch(e:any){
        setError(e.message || "Gagal")
      }finally{
        setLoading(false)
      }
    }
    fetchTx()
  },[id])

  const isSuccess = tx?.status === "Success"
  const invoiceNo = tx ? `LKBB-${String(tx.id).slice(0,8).toUpperCase()}` : "-"
  const txDate = tx ? new Date(tx.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"
  const unitPrice = tx ? (tx.supports ? Math.round(Number(tx.amount) / Number(tx.supports)) : Number(tx.amount)) : 0
  const payerName = payer?.public_name || tx?.profiles?.public_name || tx?.user_name || tx?.profiles?.name || "-"
  const payerEmail = payer?.email || tx?.profiles?.email || tx?.user_email || "-"

  const handlePrint = ()=>{
    if(!isSuccess) return
    window.print()
  }

  if(!isAdmin){
    return (
      <div className="min-h-screen flex flex-col bg-[#09090b] text-white">
        <Navbar />
        <main className="flex-1 grid place-items-center p-8 bg-[#09090b]">
          <div className="text-center rounded-2xl border border-white/10 bg-[#111318] p-8">
            <div className="text-sm font-black">Akses Ditolak</div>
            <p className="text-sm text-white/60">Hanya admin yang dapat mengakses halaman ini.</p>
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
      {/* ===== PRINT-ONLY: invoice teks polos info lengkap ===== */}
      {tx && (
        <div id="invoice-print">
          <div style={{ fontFamily: "monospace, monospace", fontSize: 12, lineHeight: 1.6, color: "#000" }}>
            <div style={{ textAlign: "center", fontWeight: 700 }}>LKBB JAVASOMA — DETAIL TRANSAKSI (ADMIN)</div>
            <div style={{ textAlign: "center" }}>Astra Dharma Hayuning Budaya</div>
            <div>----------------------------------------</div>
            <div>No. Invoice&nbsp;&nbsp;&nbsp;: {invoiceNo}</div>
            <div>ID Transaksi : {tx.id}</div>
            <div>Tanggal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {txDate}</div>
            <div>Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: LUNAS / SUCCESS</div>
            <div>----------------------------------------</div>
            <div>PEMBAYAR</div>
            <div>Nama&nbsp;&nbsp;: {payerName}</div>
            <div>Email : {payerEmail}</div>
            <div>User ID: {tx.user_id || "-"}</div>
            <div>----------------------------------------</div>
            <div>PEMBELIAN</div>
            <div>Peleton&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {peleton?.name || tx.peletons?.name || "-"}</div>
            <div>Sekolah&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {peleton?.school || tx.peletons?.school || "-"}</div>
            <div>Kategori/No : {(peleton?.category || tx.peletons?.category || "-") + " / #" + (peleton?.number || tx.peletons?.number || "-")}</div>
            <div>Peleton ID&nbsp;&nbsp;&nbsp;: {tx.peleton_id || "-"}</div>
            <div>Jumlah&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.supports} ballot</div>
            <div>Harga satuan : Rp{Number(unitPrice).toLocaleString("id-ID")}</div>
            <div>Metode&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.method || "QRIS"}</div>
            <div>Provider&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.provider || "XENDIT"}</div>
            <div>Ref Provider : {tx.provider_ref || tx.doku_reference_no || "-"}</div>
            <div>Sumber&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {tx.source || "online"}</div>
            <div>----------------------------------------</div>
            <div style={{ fontWeight: 700 }}>TOTAL BAYAR : Rp{Number(tx.amount).toLocaleString("id-ID")}</div>
            <div>----------------------------------------</div>
            <div style={{ textAlign: "center" }}>Dicetak oleh admin: {currentUser?.name || currentUser?.email || "admin"}</div>
          </div>
        </div>
      )}
      <div className="no-print contents">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 bg-[#09090b]">
        <div className="mx-auto max-w-[720px] px-3 sm:px-4 md:px-6 py-6">
          <Link href="/admin/transaksi" className="text-xs font-semibold text-white/60 hover:text-white">← Kembali ke Riwayat</Link>
          <h1 className="mt-2 text-[22px] font-black tracking-tight">DETAIL TRANSAKSI</h1>
          <p className="text-xs text-white/50">Informasi lengkap transaksi — untuk audit &amp; verifikasi</p>

          {loading ? (
            <div className="mt-6 rounded-[16px] border border-white/10 bg-[#111318] p-8 text-center text-sm text-white">Memuat detail...</div>
          ) : error ? (
            <div className="mt-6 rounded-[16px] border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-400">{error}</div>
          ) : tx ? (
            <div className="mt-6 space-y-4">
              {/* Transaction Card */}
              <div className="rounded-[16px] border border-white/10 bg-[#111318] overflow-hidden">
                <div className="h-1 bg-[var(--primary)]" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.14em] text-[var(--primary)]">LKBB JAVASOMA — TRANSAKSI</div>
                      <div className="mt-1 font-mono text-xs text-white">{invoiceNo}</div>
                      <div className="font-mono text-[10px] text-white/40 break-all">ID: {tx.id}</div>
                      <div className="font-mono text-xs text-white/60 break-all">Provider Ref: {tx.provider_ref || tx.doku_reference_no || "-"}</div>
                      <div className="font-mono text-[10px] text-white/40 break-all">Peleton ID: {tx.peleton_id || "-"}</div>
                      <div className="font-mono text-[10px] text-white/40 break-all">User ID: {tx.user_id || "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tx.status==="Success" ? "bg-emerald-500 text-black" : tx.status==="Pending" ? "bg-amber-500 text-black" : "bg-red-500 text-black"}`}>{tx.status}</div>
                      <div className="mt-1 text-xs text-white/50">{txDate}</div>
                      <div className="mt-1 text-[10px] text-white/40">Sumber: {tx.source || "online"}</div>
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
                        <div className="min-w-0">
                          <div className="text-sm font-black break-words">{peleton?.name || tx.peletons?.name || "-"}</div>
                          <div className="text-xs text-white/60 break-words">{peleton?.school || tx.peletons?.school || ""}</div>
                          <div className="text-xs text-white/50">#{peleton?.number || tx.peletons?.number || ""} • {peleton?.category || tx.peletons?.category || ""}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-widest text-white/40">PEMBAYAR</div>
                      <div className="mt-2">
                        <div className="text-sm font-bold break-words">{payerName}</div>
                        <div className="text-xs text-white/60 break-words">{payerEmail}</div>
                        <div className="text-xs text-white/50 font-mono break-all">User ID: {tx.user_id || "-"}</div>
                        {(payer?.role || tx?.profiles?.role) && <div className="text-[10px] text-white/40">Role: {payer?.role || tx?.profiles?.role}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-2"><span className="text-white/50">Jumlah Ballot</span><span className="font-black tabular-nums">{tx.supports} ballot</span></div>
                      <div className="flex justify-between gap-2"><span className="text-white/50">Harga per Ballot</span><span className="tabular-nums">Rp{tx.supports ? Math.round(tx.amount / tx.supports).toLocaleString("id-ID") : Number(tx.amount).toLocaleString("id-ID")}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-white/50">Metode</span><span className="font-bold">{tx.method || "QRIS"} • {tx.provider || "XENDIT"}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-white/50">Provider Ref</span><span className="font-mono text-xs break-all text-right">{tx.provider_ref || tx.doku_reference_no || "-"}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-white/50">DOKU Ref</span><span className="font-mono text-xs break-all text-right">{tx.doku_reference_no || "-"}</span></div>
                      {tx.expires_at && <div className="flex justify-between gap-2"><span className="text-white/50">Kadaluarsa</span><span className="text-xs text-right">{new Date(tx.expires_at).toLocaleString("id-ID")}</span></div>}
                      <div className="hairline my-2 bg-white/10" />
                      <div className="flex justify-between text-[16px] gap-2"><span className="font-bold">Total Bayar</span><span className="font-black tabular-nums text-[var(--primary)]">Rp{Number(tx.amount).toLocaleString("id-ID")}</span></div>
                    </div>
                  </div>

                  {tx.status === "Pending" && (
                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                      <div className="text-xs font-bold tracking-widest">STATUS: MENUNGGU PEMBAYARAN</div>
                      <p className="mt-1 text-xs text-white/60">Transaksi ini belum lunas. Invoice belum dapat dicetak.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {isSuccess ? (
                  <Button className="rounded-full bg-primary text-black hover:bg-primary/90" onClick={handlePrint}>Cetak Detail</Button>
                ) : (
                  <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                    Detail hanya dapat dicetak setelah pembayaran <b>Success</b>. Status saat ini: <b>{tx.status}</b>.
                  </div>
                )}
                <Link href="/admin/transaksi"><Button variant="outline" className="rounded-full">Kembali</Button></Link>
              </div>

              <div className="mt-4 text-[11px] text-white/30 text-center">Detail ini sah sebagai bukti transaksi digital LKBB JAVASOMA THE IMPRESSION — Astra Dharma Hayuning Budaya</div>
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
