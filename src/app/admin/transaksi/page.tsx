"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Trash2, Pencil } from "lucide-react"

function statusBadge(status: string){
  if(status==="Success") return "bg-emerald-500 text-black"
  if(status==="Pending") return "bg-amber-500 text-black"
  if(status==="Failed") return "bg-red-500 text-black"
  return "bg-zinc-500 text-white" // Expired & lainnya — selaras dengan dashboard
}

export default function Transaksi(){
  const { toast } = useToast()
  const [txs,setTxs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<any|null>(null)
  const [delTarget, setDelTarget] = useState<any|null>(null)

  // Admin melihat KESELURUHAN transaksi semua pengguna (admin + user biasa)
  const load = ()=>{
    setLoading(true)
    fetch("/api/transactions?all=true")
      .then(r=> r.json())
      .then(data=> { setTxs(Array.isArray(data)? data : []); setLoading(false) })
      .catch(()=> setLoading(false))
  }
  useEffect(()=>{ load() },[])
  const toggleSelect = (id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n) }
  const toggleAll = ()=>{ if(selected.size===txs.length) setSelected(new Set()); else setSelected(new Set(txs.map((t:any)=>t.id))) }
  const handleBulkDelete = async ()=>{ if(selected.size===0) return; for(const id of selected){ await fetch(`/api/admin/crud?table=transactions&id=${id}`, { method:"DELETE" }) } toast({ title:`${selected.size} transaksi dihapus`, variant:"success"}); setSelected(new Set()); load() }

  const openEdit = (t:any)=> setEditTarget({ id: t.id, status: t.status })

  const saveEdit = async ()=>{
    if(!editTarget) return
    const res = await fetch("/api/admin/crud", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "transactions", id: editTarget.id, data: { status: editTarget.status } }),
    })
    if(!res.ok){
      const j = await res.json().catch(()=> ({}))
      toast({ title: j.error || "Gagal menyimpan", variant: "error" })
      return
    }
    toast({ title: "Status diperbarui", variant: "success" })
    setEditTarget(null)
    load()
  }

  const confirmDelete = async ()=>{
    if(!delTarget) return
    await fetch(`/api/admin/crud?table=transactions&id=${delTarget.id}`, { method:'DELETE' })
    toast({ title: "Dihapus", variant: "success" })
    setDelTarget(null)
    load()
  }

  const detailHref = (id:string)=> `/admin/transaksi/${id}`
  const payerName = (t:any)=> t?.profiles?.public_name || t?.user_name || t?.profiles?.name || (t.user_id ? `User ${String(t.user_id).slice(0,8)}` : "-")
  const payerEmail = (t:any)=> t?.profiles?.email || t?.user_email || "-"
  const peletonName = (t:any)=> t?.peletons?.name || t?.name || "-"
  const peletonSub = (t:any)=> t?.peletons ? `${t.peletons.school || ""} • #${t.peletons.number || ""}`.trim() : (t.school ? `${t.school} • #${t.number || ""}` : "")

  return (
  <div>
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-black">Riwayat Transaksi</h1>
          <p className="text-xs text-muted-foreground">Seluruh transaksi seluruh pengguna (admin &amp; user biasa) — {loading ? "memuat..." : `${txs.length} transaksi`}</p>
        </div>
        {selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5"/>Hapus {selected.size} dipilih</Button>}
      </div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        {/* Desktop table — tiap field Link ke detail */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1020px] grid grid-cols-[36px_110px_110px_1fr_1fr_60px_110px_110px_90px_110px] gap-2 px-4 py-3 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/30">
            <div><input type="checkbox" checked={selected.size===txs.length && txs.length>0} onChange={toggleAll} /></div>
            <div>ID TRX</div><div>TANGGAL</div><div>PEMBAYAR</div><div>PELETON</div><div>QTY</div><div>NOMINAL</div><div>METODE</div><div>STATUS</div><div className="text-right">AKSI</div>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Memuat seluruh transaksi...</div>
          : txs.length===0 ? <div className="p-8 text-center text-sm text-muted-foreground">Belum ada transaksi.</div> :
            txs.map((t:any)=> {
              const href = detailHref(t.id)
              return (
              <div key={t.id} className="min-w-[1020px] grid grid-cols-[36px_110px_110px_1fr_1fr_60px_110px_110px_90px_110px] gap-2 px-4 py-3 items-center border-b border-white/[0.06]/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                <div onClick={(e)=> e.stopPropagation()}><input type="checkbox" checked={selected.has(t.id)} onChange={()=> toggleSelect(t.id)} /></div>
                <Link href={href} className="font-mono text-xs hover:text-primary transition-colors break-all" title={t.id}>{String(t.id).slice(0,8)}<div className="font-mono text-[10px] text-muted-foreground truncate" title={t.provider_ref || t.doku_reference_no || ""}>{((t.doku_reference_no || t.provider_ref || "") as string).slice(0,12)}</div></Link>
                <Link href={href} className="text-xs hover:text-primary transition-colors">{new Date(t.created_at).toLocaleDateString("id-ID")}<div className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleTimeString("id-ID", {hour:'2-digit', minute:'2-digit'})}</div></Link>
                <Link href={href} className="min-w-0 hover:opacity-80 transition-opacity">
                  <div className="text-sm font-bold truncate hover:text-primary transition-colors">{payerName(t)}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{payerEmail(t)}</div>
                </Link>
                <Link href={href} className="min-w-0 hover:opacity-80 transition-opacity">
                  <div className="text-sm font-bold truncate hover:text-primary transition-colors">{peletonName(t)}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{peletonSub(t)}</div>
                </Link>
                <Link href={href} className="text-xs tabular-nums hover:text-primary transition-colors">{t.supports}</Link>
                <Link href={href} className="text-xs tabular-nums font-bold hover:text-primary transition-colors">Rp{Number(t.amount).toLocaleString("id-ID")}</Link>
                <Link href={href} className="text-[11px] hover:text-primary transition-colors">{t.method || "QRIS"}<div className="text-[10px] text-muted-foreground">{t.provider || "XENDIT"}</div></Link>
                <Link href={href}><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold hover:opacity-80 ${statusBadge(t.status)}`}>{t.status}</span></Link>
                <div className="flex justify-end gap-1.5" onClick={(e)=> e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(t)}><Pencil className="h-3 w-3"/>Ubah</Button>
                  <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs text-red-600 gap-1" onClick={()=> setDelTarget(t)}><Trash2 className="h-3 w-3"/>Hapus</Button>
                </div>
              </div>
            )})}
        </div>
        {/* Mobile cards — tiap field Link ke detail */}
        <div className="md:hidden space-y-2 p-3">
          {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Memuat...</div>
          : txs.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada transaksi.</div> :
            txs.map((t:any)=> {
              const href = detailHref(t.id)
              return (
              <div key={t.id} className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-start">
                  <input type="checkbox" className="mt-1" checked={selected.has(t.id)} onChange={()=> toggleSelect(t.id)} />
                  <div className="flex-1 min-w-0">
                    <Link href={href} className="font-mono text-[11px] text-white/60 hover:text-primary transition-colors">{String(t.id).slice(0,12)}</Link>
                    <Link href={href} className="block text-sm font-bold truncate hover:text-primary transition-colors">{payerName(t)}</Link>
                    <Link href={href} className="block text-xs text-muted-foreground truncate hover:text-primary transition-colors">{payerEmail(t)}</Link>
                    <Link href={href} className="block text-xs mt-1 hover:text-primary transition-colors">Tim: <b>{peletonName(t)}</b> • {t.supports} ballot • Rp{Number(t.amount).toLocaleString("id-ID")}</Link>
                    <div className="mt-1 flex items-center justify-between">
                      <Link href={href} className="text-[11px] text-muted-foreground hover:text-primary transition-colors">{new Date(t.created_at).toLocaleString("id-ID")} • {t.method || "QRIS"}/{t.provider || "XENDIT"}</Link>
                      <Link href={href}><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(t.status)}`}>{t.status}</span></Link>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="outline" size="sm" className="w-full rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(t)}><Pencil className="h-3 w-3"/>Ubah</Button>
                  <Button variant="outline" size="sm" className="w-full rounded-full h-7 text-xs text-red-600 border-red-200 gap-1" onClick={()=> setDelTarget(t)}><Trash2 className="h-3 w-3"/>Hapus</Button>
                </div>
              </div>
            )})}
        </div>
        {txs.length>0 && (
          <div className="p-3 border-t border-white/[0.06] bg-white/[0.04] backdrop-blur/20 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===txs.length && txs.length>0} onChange={toggleAll} /> Pilih semua ({txs.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>
    </div>
    <Dialog open={!!editTarget} onOpenChange={()=> setEditTarget(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Ubah Transaksi</DialogTitle>
            <DialogDescription>Ubah status transaksi secara manual (berlaku untuk seluruh pengguna)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <label className="text-xs font-bold">Status</label>
              <select value={editTarget?.status || ""} onChange={(e)=> setEditTarget(editTarget ? {...editTarget, status: e.target.value} : e)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=> setEditTarget(null)}>Batal</Button>
          <Button onClick={saveEdit} disabled={!editTarget}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={!!delTarget} onOpenChange={()=> setDelTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Transaksi?</DialogTitle>
          <DialogDescription>{`Yakin hapus transaksi #${delTarget?.id?.slice(0,8) || ""}? Data tidak bisa dikembalikan.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={()=> setDelTarget(null)}>Batal</Button>
          <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  )
}
