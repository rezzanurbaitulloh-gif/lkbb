"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { createBrowserSupabase } from "@/lib/supabase"
import { useOwnEventFilter } from "@/hooks/useOwnEventFilter"
import { useToast } from "@/components/ui/toast"
import { ImageUploadGrid } from "@/components/ui/image-upload-grid"
import { Pencil, Trash2 } from "lucide-react"

export default function Page(){
  const { toast } = useToast()
  const [list,setList]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<any|null>(null)
  const [delTarget,setDelTarget]=useState<any|null>(null)
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState<any>({ name:"", role:"Juri PBB", bio:"", photo_url:"", sort_order:1 })
  // upload via grid
  const { ready: evReady, isSuper: evSuper, eventIds: ownEvents } = useOwnEventFilter()
  const load = ()=>{ if(!evReady) return; const s=createBrowserSupabase(); let jq: any = s.from("judges").select("*").order("sort_order")
      if(!evSuper && ownEvents.length>0) jq = jq.in("event_id", ownEvents)
      jq.then(({data}: any)=> setList(data||[])) }
  useEffect(()=>{ load() },[evReady])
  const toggleSelect = (id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n) }
  const toggleAll = ()=>{ if(selected.size===list.length) setSelected(new Set()); else setSelected(new Set(list.map((i:any)=>i.id))) }
  const handleBulkDelete = async ()=>{ if(selected.size===0) return; for(const id of selected){ await fetch(`/api/admin/crud?table=judges&id=${id}`, { method:"DELETE" }) } ; toast({ title: `${selected.size} data dihapus`, variant:"success"}); setSelected(new Set()); load() }
  const openAdd = ()=>{ setEditing(null); setForm({ name:"", role:"Juri PBB", bio:"", photo_url:"", sort_order:1 }); setOpen(true) }
  const openEdit = (item:any)=>{ setEditing(item); setForm({ name: item.name ?? "", role: item.role ?? "", bio: item.bio ?? "", photo_url: item.photo_url ?? "", sort_order: item.sort_order ?? 1 }); setOpen(true) }
  const handleSave = async ()=>{ if(saving) return; setSaving(true);
    const payload:any = { ...form, sort_order: parseInt(form.sort_order)||1, active:true };
    if(!payload.title && !payload.name && !payload.question) { toast({ title:"Lengkapi data", variant:"error" }); return }
    try{
      let res
      if(editing) res = await fetch("/api/admin/crud", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"judges", id: editing.id, data: payload }) })
      else res = await fetch("/api/admin/crud", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"judges", data: payload }) })
      const j = await res.json()
      if(!res.ok) throw new Error(j.error)
      toast({ title: editing ? "Diperbarui" : "Ditambahkan", variant:"success" })
      setOpen(false); load()
    } catch(e:any){ toast({ title:"Gagal", description:e.message, variant:"error" }) } finally { setSaving(false) }
  }
  const handleDelete = async ()=>{
    if(!delTarget) return
    const res = await fetch(`/api/admin/crud?table=judges&id=${delTarget.id}`, { method:"DELETE" })
    if(res.ok){ toast({ title:"Dihapus", variant:"success" }); load() } else { const j=await res.json(); toast({ title:"Gagal hapus", description:j.error, variant:"error" }) }
    setDelTarget(null)
  }
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-[18px] font-black">Dewan Juri</h1></div><div className="flex gap-2">{selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5"/>Hapus {selected.size} dipilih</Button>}<Button size="sm" className="rounded-full" onClick={openAdd}>Tambah Baru</Button></div></div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-3 sm:p-4 overflow-hidden">
        <div className="grid gap-3">
          {list.length===0 ? <div className="p-8 text-center text-sm text-muted-foreground">Belum ada data.</div> :
            list.map((item:any)=> (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-white/[0.06] p-3 min-w-0 overflow-hidden">
              <div className="flex gap-2.5 min-w-0 flex-1">
                <input type="checkbox" checked={selected.has(item.id)} onChange={()=> toggleSelect(item.id)} className="mt-1 sm:mt-0 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate pr-2">{item.title || item.name || item.question}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.category || item.role || item.tier || ""} • {new Date(item.created_at).toLocaleDateString("id-ID")}</div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(item)}><Pencil className="h-3 w-3"/>Ubah</Button>
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs text-red-600 gap-1" onClick={()=> setDelTarget(item)}><Trash2 className="h-3 w-3"/>Hapus</Button>
              </div>
            </div>
          ))}
        </div>
        {list.length>0 && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===list.length && list.length>0} onChange={toggleAll} /> Pilih semua ({list.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Ubah Dewan Juri" : "Tambah Dewan Juri"}</DialogTitle><DialogDescription>Isi semua kolom yang wajib.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><label className="text-xs font-bold">Nama Juri *</label><Input value={form.name} onChange={e=> setForm({...form, name:e.target.value})} placeholder="Tulis nama juri" /></div>
            <div><label className="text-xs font-bold">Jabatan</label><Input value={form.role} onChange={e=> setForm({...form, role:e.target.value})} placeholder="Contoh: Juri PBB" /></div>
            <div><label className="text-xs font-bold">Biodata Singkat</label><textarea value={form.bio} onChange={e=> setForm({...form, bio:e.target.value})} placeholder="Tulis latar belakang juri" className="w-full min-h-[80px] rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm" /></div>
            <ImageUploadGrid
              label="Foto Juri"
              value={form.photo_url || null}
              onChange={(url)=> setForm((p:any)=> ({...p, photo_url: url || ""}))}
              folder="juri"
              description="Drag & drop atau klik grid untuk upload foto juri"
            />
            <div><label className="text-xs font-bold">Urutan Tampil</label><Input type="number" value={form.sort_order} onChange={e=> setForm({...form, sort_order: parseInt(e.target.value)||0})} placeholder="1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Memproses..." : editing ? "Simpan" : "Tambah"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!delTarget} onOpenChange={(o:any)=> !o && setDelTarget(null)} title="Hapus data?" description={`Yakin hapus ${delTarget?.title || delTarget?.name || ""}?`} onConfirm={handleDelete} />
    </div>
  )
}
