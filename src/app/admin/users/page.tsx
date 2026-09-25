"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { Pencil, Trash2 } from "lucide-react"

// Kelola Pengguna TERBATAS event saat ini (bukan global):
// - hanya user yang terasosiasi ke event ini (daftar/login di domain ini, atau admin event ini)
// - akun SUPER_ADMIN platform selalu disembunyikan
// - hapus = keluarkan dari event ini (baris event_members), bukan hapus akun global
export default function Users(){
  const { toast } = useToast()
  const [members,setMembers]=useState<any[]>([])
  const [eventInfo,setEventInfo]=useState<any>(null)
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<any|null>(null)
  const [role,setRole]=useState("USER")
  const [newPassword,setNewPassword]=useState("")
  const [showPass,setShowPass]=useState(false)
  const [saving,setSaving]=useState(false)
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const load = ()=>{
    fetch("/api/admin/users").then(async r=> {
      const j = await r.json().catch(()=> ({}))
      if(!r.ok){ toast({ title:"Gagal memuat", description:j.error, variant:"error" }); return }
      setMembers(j.members||[]); setEventInfo(j.event||null)
    }).catch(()=>{})
  }
  useEffect(()=>{ load() },[])
  const toggleSelect = (id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n) }
  const toggleAll = ()=>{ if(selected.size===members.length) setSelected(new Set()); else setSelected(new Set(members.map((m:any)=>m.id))) }
  const removeFromEvent = async (memberId:string)=>{
    const res = await fetch(`/api/admin/event-members?id=${memberId}`, { method:"DELETE" })
    const j = await res.json().catch(()=> ({}))
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return false }
    return true
  }
  const handleBulkRemove = async ()=>{
    if(selected.size===0) return
    if(!confirm(`Keluarkan ${selected.size} pengguna dari event ini? (Akun tidak dihapus, hanya asosiasi event ini.)`)) return
    for(const id of selected){ await removeFromEvent(id) }
    toast({ title:`${selected.size} pengguna dikeluarkan dari event`, variant:"success" }); setSelected(new Set()); load()
  }
  const openEdit = (m:any)=>{ setEditing(m); setRole(m.role==="ADMIN" ? "ADMIN" : "USER"); setNewPassword(""); setShowPass(false); setOpen(true) }
  const handleSave = async ()=>{ if(saving) return; setSaving(true)
    if(!editing) return
    // Peran = keanggotaan event ini (bukan role global).
    const res = await fetch("/api/admin/event-members", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ event_id: editing.event_id, user_id: editing.user_id, role }) })
    const j = await res.json().catch(()=> ({}))
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); setSaving(false); return }
    if(newPassword){
      if(newPassword.length<6){ toast({ title:"Kata sandi minimal 6 karakter", variant:"error"}); setSaving(false); return }
      const rp = await fetch("/api/admin/users/password", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: editing.user_id, newPassword }) })
      const jp = await rp.json().catch(()=> ({}))
      if(!rp.ok){ toast({ title:"Gagal ubah kata sandi", description:jp.error, variant:"error"}); setSaving(false); return }
    }
    toast({ title:"Pengguna diperbarui", variant:"success" }); setOpen(false); load(); setSaving(false)
  }
  const roleBadge = (r:string)=> r==="ADMIN" ? "bg-amber-500 text-black" : "bg-secondary"
  const roleLabel = (r:string)=> r==="ADMIN" ? "admin event" : "user"
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black">Kelola Pengguna</h1>
          <p className="text-xs text-muted-foreground">Hanya pengguna event {eventInfo ? <b>{eventInfo.name || eventInfo.slug}</b> : "ini"} — user web lain & super admin disembunyikan.</p>
        </div>
        <div className="flex items-center gap-2">{selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={handleBulkRemove}><Trash2 className="h-3.5 w-3.5"/>Keluarkan {selected.size}</Button>}</div>
      </div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="grid grid-cols-[40px_1.4fr_1.2fr_120px_110px_100px] gap-2 px-4 py-3 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/30">
            <div><input type="checkbox" checked={selected.size===members.length && members.length>0} onChange={toggleAll} /></div><div>NAMA</div><div>EMAIL</div><div>PERAN</div><div>STATUS</div><div>AKSI</div>
          </div>
          {members.length===0 ? <div className="p-8 text-center text-sm text-muted-foreground">Belum ada pengguna di event ini.</div> :
            members.map((m:any)=> (
            <div key={m.id} className="grid grid-cols-[40px_1.4fr_1.2fr_120px_110px_100px] gap-2 px-4 py-3 items-center border-b border-white/[0.06]/50 text-sm">
              <div><input type="checkbox" checked={selected.has(m.id)} onChange={()=> toggleSelect(m.id)} /></div>
              <div className="font-bold truncate">{m.profile?.public_name || "-"}</div>
              <div className="text-muted-foreground text-xs truncate">{m.profile?.email}</div>
              <div><span className={`rounded-full px-2 py-1 text-xs font-bold ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span></div>
              <div className="text-xs text-muted-foreground">{m.status}</div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(m)}><Pencil className="h-3 w-3"/>Kelola</Button>
              </div>
            </div>
          ))}
        </div>
        {/* Mobile */}
        <div className="md:hidden space-y-2 p-3">
          {members.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada pengguna di event ini.</div> :
            members.map((m:any)=> (
            <div key={m.id} className="rounded-xl border border-white/[0.06] p-3 flex gap-3">
              <input type="checkbox" className="mt-1" checked={selected.has(m.id)} onChange={()=> toggleSelect(m.id)} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{m.profile?.public_name || "-"}</div>
                <div className="text-xs text-muted-foreground truncate">{m.profile?.email}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{m.status}</span>
                  <span className="rounded-full bg-emerald-500 text-black px-2 py-0.5 text-[11px] font-bold">Aktif</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1 shrink-0" onClick={()=> openEdit(m)}><Pencil className="h-3 w-3"/>Kelola</Button>
            </div>
          ))}
        </div>
        {members.length>0 && (
          <div className="p-3 border-t border-white/[0.06] bg-white/[0.04] backdrop-blur/20 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===members.length && members.length>0} onChange={toggleAll} /> Pilih semua ({members.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Kelola Pengguna</DialogTitle><DialogDescription>{editing?.profile?.public_name} — {editing?.profile?.email}</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><label className="text-xs font-bold">Peran di event ini</label><Select value={role} onValueChange={setRole} options={[{value:"USER",label:"user — Pengguna event ini"},{value:"ADMIN",label:"admin — Admin event ini"}]} /></div>
            <p className="-mt-1 text-[11px] text-muted-foreground">Hanya berlaku di event ini. Menurunkan admin menjadi user tidak menghapus akunnya.</p>
            <div>
              <label className="text-xs font-bold">Kata Sandi Baru (opsional, super admin)</label>
              <div className="flex gap-2">
                <input type={showPass ? "text" : "password"} value={newPassword} onChange={e=> setNewPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" className="flex-1 h-10 rounded-xl border border-white/[0.08] px-3 text-sm" />
                <Button variant="outline" size="sm" onClick={()=> setShowPass(!showPass)}>{showPass ? "Sembunyikan" : "Lihat"}</Button>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-red-600 justify-self-start" onClick={async ()=>{ if(!editing) return; if(!confirm("Keluarkan pengguna ini dari event?")) return; if(await removeFromEvent(editing.id)){ setOpen(false); load() } }}>Keluarkan dari event ini</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setOpen(false)}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Memproses..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
