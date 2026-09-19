"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

const AKSI_LABEL: Record<string,string> = {
  transaction_paid: "Pembayaran dukungan berhasil",
  transaction_paid_via_status_check: "Pembayaran dukungan terverifikasi",
  competition_field_update: "Pengaturan lomba diubah",
  competition_settings_update: "Pengaturan lomba diubah",
  offline_recap_add: "Dukungan offline dicatat",
  profiles_create: "Pengguna baru ditambahkan",
  profiles_update: "Data pengguna diperbarui",
  profiles_delete: "Pengguna dihapus",
  peletons_create: "Tim baru ditambahkan",
  peletons_update: "Data tim diperbarui",
  peletons_delete: "Tim dihapus",
  news_create: "Berita ditambahkan",
  news_update: "Berita diperbarui",
  news_delete: "Berita dihapus",
  announcements_create: "Pengumuman ditambahkan",
  announcements_update: "Pengumuman diperbarui",
  announcements_delete: "Pengumuman dihapus",
  timeline_stages_create: "Jadwal ditambahkan",
  timeline_stages_update: "Jadwal diperbarui",
  timeline_stages_delete: "Jadwal dihapus",
  judges_create: "Juri ditambahkan",
  judges_update: "Data juri diperbarui",
  judges_delete: "Juri dihapus",
  sponsors_create: "Sponsor ditambahkan",
  sponsors_update: "Data sponsor diperbarui",
  sponsors_delete: "Sponsor dihapus",
  faqs_create: "Tanya jawab ditambahkan",
  faqs_update: "Tanya jawab diperbarui",
  faqs_delete: "Tanya jawab dihapus",
  password_update: "Kata sandi pengguna diubah",
  sponsors: "Sponsor",
}

function humanAksi(action:string){
  return AKSI_LABEL[action] || action.replace(/_/g," ")
}

function humanDetail(log:any){
  const d = log.details || {}
  const a = log.action
  if(a?.startsWith("transaction_paid")){
    const jml = d.supports ? `${Number(d.supports).toLocaleString("id-ID")} dukungan` : ""
    const nominal = d.amount ? ` senilai Rp${Number(d.amount).toLocaleString("id-ID")}` : ""
    if(jml || nominal) return `Dukungan masuk: ${jml}${nominal ? ` (${nominal})` : ""}`.trim()
    return "Dukungan berhasil dicatat"
  }
  if(a==="competition_field_update" || a==="competition_settings_update"){
    if(d.field==="state"){
      const map:Record<string,string> = {
        NOT_STARTED:"Belum dimulai",
        VOTING_OPEN:"Masa dukungan dibuka",
        ACTIVE:"Masa dukungan dibuka",
        VOTING_CLOSED:"Masa dukungan ditutup",
        RESULT_VERIFICATION:"Verifikasi hasil",
        RESULT_PUBLISHED:"Hasil dipublikasikan",
        COMPLETED:"Selesai",
      }
      return `Status lomba diubah menjadi "${map[d.value]||d.value}"`
    }
    if(d.field==="show_provisional_result" || d.field==="show_final_result"){
      return d.value ? "Hasil ditampilkan di website" : "Hasil disembunyikan"
    }
    return "Pengaturan lomba diperbarui"
  }
  if(a==="offline_recap_add"){
    const jml = d.supports ? `${d.supports>0?"+":""}${d.supports} dukungan offline` : "dukungan offline"
    const catatan = d.note ? ` — catatan: ${d.note}` : ""
    return `${jml}${catatan}`
  }
  if(a?.includes("profiles")){
    if(d.role) return `Peran diubah menjadi ${d.role==="ADMIN"?"admin":"user"}`
    return "Data pengguna diperbarui"
  }
  if(a?.includes("peletons")){
    if(d.name) return `Tim "${d.name}"`
    return "Data tim diperbarui"
  }
  if(a?.includes("news") && d.title) return `"${d.title}"`
  if(a?.includes("announcements") && d.title) return `"${d.title}"`
  if(a?.includes("timeline") && d.title) return `"${d.title}"`
  if(a?.includes("judges") && d.name) return `Juri "${d.name}"`
  if(a?.includes("sponsors") && d.name) return `Sponsor "${d.name}"`
  if(a?.includes("faqs") && d.question) return `"${d.question.slice(0,60)}"`
  return d.note || d.title || d.name || "-"
}

export default function AuditLog(){
  const { toast } = useToast()
  const [logs,setLogs]=useState<any[]>([])
  const [users,setUsers]=useState<Record<string,string>>({})
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const [confirmClear,setConfirmClear]=useState(false)
  const [delTarget,setDelTarget]=useState<string|null>(null)
  const [isSuper,setIsSuper]=useState(false)
  const load = ()=>{
    // Matriks: API mengembalikan log event sendiri (admin) atau semua (super).
    fetch("/api/admin/audit-logs?limit=50").then((r)=> r.json()).then((j)=>{
      const logs = Array.isArray(j.logs) ? j.logs : []
      setLogs(logs)
      const m: Record<string,string> = {}
      const umap = (j.users || {}) as Record<string, { id: string; public_name?: string; email?: string }>
      Object.keys(umap).forEach((k)=>{
        const uu = umap[k]
        m[uu.id] = uu.public_name || (uu.email ? uu.email.split("@")[0] : "Pengguna")
      })
      setUsers(m)
    }).catch(()=>{})
    fetch("/api/me/admin", { cache:"no-store" }).then((r)=> r.json()).then((j)=> setIsSuper(!!j.isSuper)).catch(()=>{})
  }
  useEffect(()=>{ load() },[])
  const toggleSelect = (id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n) }
  const toggleAll = ()=>{ if(selected.size===logs.length) setSelected(new Set()); else setSelected(new Set(logs.map((l:any)=>l.id))) }
  const handleDelete = async (id:string)=>{
    const res = await fetch(`/api/admin/crud?table=audit_logs&id=${id}`, { method:"DELETE" })
    if(res.ok){ toast({ title:"Log dihapus", variant:"success"}); setLogs(prev=> prev.filter(l=>l.id!==id)); setSelected(prev=>{ const n=new Set(prev); n.delete(id); return n }) }
    else { const j=await res.json(); toast({ title:"Gagal hapus", description:j.error, variant:"error"}) }
  }
  const handleBulkDelete = async ()=>{
    if(selected.size===0) return
    for(const id of selected){ await fetch(`/api/admin/crud?table=audit_logs&id=${id}`, { method:"DELETE" }) }
    toast({ title:`${selected.size} log dihapus`, variant:"success"}); setSelected(new Set()); load()
  }
  const handleClearAll = async ()=>{
    for(const l of logs){ await fetch(`/api/admin/crud?table=audit_logs&id=${l.id}`, { method:"DELETE" }) }
    toast({ title:"Semua log dihapus", variant:"success"}); setLogs([]); setSelected(new Set()); setConfirmClear(false)
  }
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-black">Riwayat Aktivitas</h1>
          
        </div>
        <div className="flex gap-2 items-center">
          {!isSuper && <span className="text-[11px] text-muted-foreground">Mode baca saja — log event Anda</span>}
          {isSuper && selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={()=> setDelTarget("bulk")}><Trash2 className="h-3.5 w-3.5"/>Hapus {selected.size} dipilih</Button>}
          {isSuper && logs.length>0 && <Button variant="ghost" size="sm" className="rounded-full text-red-600 gap-1" onClick={()=> setConfirmClear(true)}><Trash2 className="h-3.5 w-3.5"/>Hapus Semua</Button>}
        </div>
      </div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-[32px_140px_120px_180px_1fr_60px] gap-2 px-4 py-3 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/30">
            {isSuper ? <div><input type="checkbox" checked={selected.size===logs.length && logs.length>0} onChange={toggleAll} /></div> : <div />}
            <div>WAKTU</div><div>PENGGUNA</div><div>KEJADIAN</div><div>RINCIAN</div>
            {isSuper ? <div>AKSI</div> : <div />}
          </div>
          {logs.length===0 ? <div className="p-8 text-center text-sm text-muted-foreground">Belum ada aktivitas.</div> :
            logs.map((l:any,i:number)=> (
            <div key={l.id || i} className="min-w-[640px] grid grid-cols-[32px_140px_120px_180px_1fr_60px] gap-3 px-4 py-3 text-xs border-b border-white/[0.06]/50 items-start">
              {isSuper ? <div><input type="checkbox" checked={selected.has(l.id)} onChange={()=> toggleSelect(l.id)} /></div> : <div />}
              <div className="tabular-nums text-muted-foreground">{new Date(l.created_at).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              <div className="font-bold truncate">{l.user_id ? (users[l.user_id] || "Pengguna") : "Sistem"}</div>
              <div className="font-medium">{humanAksi(l.action)}</div>
              <div className="text-muted-foreground leading-relaxed line-clamp-2">{humanDetail(l)}</div>
              {isSuper ? <div className="flex justify-center"><Button variant="ghost" size="sm" className="rounded-full h-6 w-6 p-0 text-red-600" onClick={()=> setDelTarget(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div> : <div />}
            </div>
          ))}
        </div>
        {/* Mobile */}
        <div className="md:hidden space-y-2 p-3">
          {logs.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</div> :
            logs.map((l:any,i:number)=> (
            <div key={l.id || i} className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">{isSuper ? <input type="checkbox" checked={selected.has(l.id)} onChange={()=> toggleSelect(l.id)} /> : null}{new Date(l.created_at).toLocaleDateString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</label>
                <span className="text-[11px] font-bold truncate">{l.user_id ? (users[l.user_id] || "Pengguna") : "Sistem"}</span>
              </div>
              <div className="text-sm font-bold">{humanAksi(l.action)}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{humanDetail(l)}</div>
              {isSuper ? <div className="flex justify-end"><Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={()=> setDelTarget(l.id)}><Trash2 className="h-3.5 w-3.5 mr-1" />Hapus</Button></div> : null}
            </div>
          ))}
        </div>
        {logs.length>0 && (
          <div className="p-3 border-t border-white/[0.06] bg-white/[0.04] backdrop-blur/20 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===logs.length && logs.length>0} onChange={toggleAll} /> Pilih semua ({logs.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>
      <AlertDialog open={!!delTarget} onOpenChange={(o)=> !o && setDelTarget(null)} title={delTarget==="bulk" ? "Hapus log terpilih?" : "Hapus log ini?"} description={delTarget==="bulk" ? `Yakin hapus ${selected.size} log terpilih?` : "Log yang dihapus tidak bisa dikembalikan."} onConfirm={async()=>{ if(delTarget==="bulk") await handleBulkDelete(); else if(delTarget) await handleDelete(delTarget); setDelTarget(null)}} />
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear} title="Hapus semua log?" description={`Yakin hapus semua ${logs.length} log? Tindakan ini tidak bisa dibatalkan.`} onConfirm={handleClearAll} />
    </div>
  )
}
