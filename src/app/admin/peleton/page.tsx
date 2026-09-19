"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { createBrowserSupabase } from "@/lib/supabase"
import { useOwnEventFilter } from "@/hooks/useOwnEventFilter"
import { useToast } from "@/components/ui/toast"
import { ImageUploadGrid } from "@/components/ui/image-upload-grid"
import { Pencil, Trash2 } from "lucide-react"

export default function AdminPeleton(){
  const { toast } = useToast()
  const [teams, setTeams] = useState<any[]>([])
  const [filter, setFilter] = useState<"All"|"SMP"|"SMA">("All")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [delTarget, setDelTarget] = useState<any|null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({ number:"", name:"", school:"", city:"Kertosono", province:"Jawa Timur", category:"SMA", image_url:"", logo_url:"", active:true })

  const { ready: evReady, isSuper: evSuper, eventIds: ownEvents } = useOwnEventFilter()
  const load = ()=>{
    if(!evReady) return
    const supabase = createBrowserSupabase()
    // nomor urut = urutan tampil, order per kategori lalu nomor (SMP 1.., SMK 1.. terpisah)
    let q: any = supabase.from("peletons").select("*").order("category", {ascending:true}).order("number", {ascending:true})
    if(!evSuper && ownEvents.length>0) q = q.in("event_id", ownEvents)
    q.then(({data}: any)=> {
      // fallback sort by numeric number if string like "01"
      const sorted = (data||[]).sort((a:any,b:any)=>{
        if(a.category!==b.category) return a.category.localeCompare(b.category)
        return parseInt(String(a.number).replace(/^0+/, "")||"0") - parseInt(String(b.number).replace(/^0+/, "")||"0")
      })
      setTeams(sorted)
    })
  }
  useEffect(()=>{ load() },[evReady])

  const filtered = filter==="All" ? teams : teams.filter(t=>t.category===filter)

  const toggleSelect = (id:string)=>{
    const next = new Set(selected)
    if(next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }
  const toggleAll = ()=>{
    if(selected.size===filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(t=>t.id)))
  }
  const handleBulkDelete = async ()=>{
    if(selected.size===0) return
    for(const id of selected){
      await fetch(`/api/admin/crud?table=peletons&id=${id}`, { method:"DELETE" })
    }
    toast({ title:`${selected.size} tim dihapus`, variant:"success"})
    setSelected(new Set())
    load()
  }

  // upload via grid — no url input, drag & drop

  const openAdd = ()=>{
    setEditing(null)
    setForm({ number:"", name:"", school:"", city:"Kertosono", province:"Jawa Timur", category:"SMA", image_url:"", logo_url:"", active:true })
    setOpen(true)
  }
  const openEdit = (p:any)=>{
    setEditing(p)
    setForm({ number:p.number, name:p.name, school:p.school, city:p.city, province:p.province, category:p.category, image_url:p.image_url||"", logo_url:p.logo_url||"", active:p.active })
    setOpen(true)
  }
  const handleSave = async ()=>{ if(saving) return; setSaving(true);
    if(!form.number || !form.name || !form.school || !form.category){
      toast({ title:"Lengkapi data", description:"Nomor, nama, sekolah, kategori wajib diisi", variant:"error" })
      setSaving(false)
      return
    }
    // nomor urut = urutan tampil, set display_order = number (numeric)
    const numForOrder = parseInt(String(form.number).replace(/^0+/, "") || "0") || 0
    const payload = { ...form, display_order: numForOrder, slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + "-" + form.number }
    try {
      let res
      if(editing){
        res = await fetch("/api/admin/crud", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"peletons", id: editing.id, data: payload }) })
      } else {
        res = await fetch("/api/admin/crud", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"peletons", data: payload }) })
      }
      const j = await res.json()
      if(!res.ok) throw new Error(j.error || "Gagal menyimpan")
      toast({ title: editing ? "Tim diperbarui" : "Tim ditambahkan", variant:"success" })
      setOpen(false)
      load()
    } catch(e:any){
      toast({ title:"Gagal", description:e.message, variant:"error" })
    } finally { setSaving(false) }
  }
  const handleDelete = async ()=>{
    if(!delTarget) return
    const res = await fetch(`/api/admin/crud?table=peletons&id=${delTarget.id}`, { method:"DELETE" })
    if(res.ok){ toast({ title:"Dihapus", variant:"success" }); load() } else { const j=await res.json(); toast({ title:"Gagal hapus", description:j.error, variant:"error" }) }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-black">Kelola Tim Peserta</h1>
        </div>
        <div className="flex gap-2">
          {selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5"/>Hapus {selected.size} dipilih</Button>}
          <Button size="sm" className="rounded-full" onClick={openAdd}>Tambah Tim</Button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {(["All","SMP","SMA"] as const).map(c=>(
          <button key={c} onClick={()=>{ setFilter(c); setSelected(new Set()) }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold border backdrop-blur ${filter===c ? "bg-primary text-black border-primary shadow-sm" : "bg-white/[0.03] text-white/65 border-white/[0.07] hover:bg-white/[0.06] hover:text-white hover:border-white/12"}`}>{c==="All" ? "Semua" : c==="SMP" ? "SMP / Sederajat" : "SMA / Sederajat"}</button>
        ))}
      </div>

      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        {/* Desktop table — URUTAN dihapus, nomor urut = urutan tampil per kategori */}
        <div className="hidden md:block overflow-x-auto">
          <div className="grid grid-cols-[40px_60px_1fr_80px_80px_110px] gap-2 px-4 py-3 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/30">
            <div><input type="checkbox" checked={filtered.length>0 && selected.size===filtered.length} onChange={toggleAll} /></div><div>NO</div><div>TIM</div><div>KELOMPOK</div><div>TAMPIL</div><div className="text-right">AKSI</div>
          </div>
          {filtered.map(p=> (
            <div key={p.id} className="grid grid-cols-[40px_60px_1fr_80px_80px_110px] gap-2 px-4 py-3 items-center border-b border-white/[0.06]/50 last:border-0">
              <div><input type="checkbox" checked={selected.has(p.id)} onChange={()=> toggleSelect(p.id)} /></div>
              <div className="font-mono text-sm">#{p.number}</div>
              <Link href={`/admin/peleton/${p.id}`} className="flex gap-3 min-w-0 hover:opacity-80 transition-opacity">
                <img src={p.image_url} alt="" className="h-9 w-9 rounded-lg object-cover border" />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate hover:text-primary transition-colors">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.school} • #{p.number}</div>
                </div>
              </Link>
              <div className="text-xs"><Badge variant="outline">{p.category}</Badge></div>
              <div><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${p.active ? "bg-emerald-500 text-black" : "bg-zinc-500 text-black"}`}>{p.active ? "Tampil" : "Disembunyikan"}</span></div>
              <div className="flex justify-end gap-1.5">
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(p)}><Pencil className="h-3 w-3"/>Ubah</Button>
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs text-red-600 gap-1" onClick={()=> setDelTarget(p)}><Trash2 className="h-3 w-3"/>Hapus</Button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada tim di kelompok ini.</div>}
        </div>
        {/* Mobile cards */}
        <div className="md:hidden space-y-2 p-3">
          {filtered.map(p=> (
            <div key={p.id} className="rounded-xl border border-white/[0.06] p-3 flex flex-col gap-2">
              <div className="flex gap-3">
                <input type="checkbox" className="mt-1" checked={selected.has(p.id)} onChange={()=> toggleSelect(p.id)} />
                <Link href={`/admin/peleton/${p.id}`} className="flex gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">#{p.number}</span>
                      <Badge variant="outline" className="text-[11px]">{p.category}</Badge>
                      <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${p.active ? "bg-emerald-500 text-black" : "bg-zinc-500 text-black"}`}>{p.active ? "Tampil" : "Sembunyi"}</span>
                    </div>
                    <div className="text-sm font-bold truncate hover:text-primary transition-colors">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.school}</div>
                  </div>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="w-full rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(p)}><Pencil className="h-3 w-3"/>Ubah</Button>
                <Button variant="outline" size="sm" className="w-full rounded-full h-7 text-xs text-red-600 border-red-200 gap-1" onClick={()=> setDelTarget(p)}><Trash2 className="h-3 w-3"/>Hapus</Button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="p-6 text-center text-sm text-muted-foreground">Belum ada tim di kelompok ini.</div>}
        </div>
        {filtered.length>0 && (
          <div className="p-3 border-t border-white/[0.06] bg-white/[0.04] backdrop-blur/20 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===filtered.length && filtered.length>0} onChange={toggleAll} /> Pilih semua ({filtered.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Tim" : "Tambah Tim Baru"}</DialogTitle>
            <DialogDescription>Tim akan langsung tampil di website.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div><label className="text-xs font-bold">Nomor Peserta *</label><Input value={form.number} onChange={e=> setForm({...form, number:e.target.value})} placeholder="01" /></div>
              <div><label className="text-xs font-bold">Kelompok *</label><Select value={form.category} onValueChange={v=> setForm({...form, category:v})} options={[{value:"SMP",label:"SMP / Sederajat"},{value:"SMA",label:"SMA / Sederajat"}]} /></div>
            </div>
            <div><label className="text-xs font-bold">Nama Tim *</label><Input value={form.name} onChange={e=> setForm({...form, name:e.target.value})} placeholder="SMKN 1 KERTOSONO" /></div>
            <div><label className="text-xs font-bold">Nama Sekolah *</label><Input value={form.school} onChange={e=> setForm({...form, school:e.target.value})} placeholder="SMK Negeri 1 Kertosono" /></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div><label className="text-xs font-bold">Kota</label><Input value={form.city} onChange={e=> setForm({...form, city:e.target.value})} /></div>
              <div><label className="text-xs font-bold">Provinsi</label><Input value={form.province} onChange={e=> setForm({...form, province:e.target.value})} /></div>
            </div>
            <div>
              <ImageUploadGrid
                label="Foto Tim"
                value={form.image_url || null}
                onChange={(url)=> setForm((prev:any)=> ({...prev, image_url: url || ""}))}
                folder="peleton"
                description="Foto tim asli, tidak di-crop lingkaran"
              />
            </div>
            <div>
              <ImageUploadGrid
                label="Logo Sekolah"
                value={form.logo_url || null}
                onChange={(url)=> setForm((prev:any)=> ({...prev, logo_url: url || ""}))}
                folder="peleton"
                logoMode
                description="Pilih dengan/tanpa latar belakang — tanpa latar akan benar transparan"
              />
            </div>
            <div><label className="text-xs font-bold">Tampilkan di Website?</label><Select value={form.active ? "true":"false"} onValueChange={v=> setForm({...form, active: v==="true"})} options={[{value:"true",label:"Ya, tampilkan"},{value:"false",label:"Sembunyikan"}]} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Memproses..." : editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o)=> !o && setDelTarget(null)} title="Hapus tim?" description={`Yakin hapus ${delTarget?.name} (#${delTarget?.number})? Data tidak bisa dikembalikan.`} onConfirm={handleDelete} />
    </div>
  )
}
