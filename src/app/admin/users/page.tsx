"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { createBrowserSupabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import { Pencil, Trash2 } from "lucide-react"

export default function Users(){
  const { toast } = useToast()
  const [users,setUsers]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<any|null>(null)
  const [role,setRole]=useState("USER")
  const [newPassword,setNewPassword]=useState("")
  const [showPass,setShowPass]=useState(false)
  const [saving,setSaving]=useState(false)
  const [selected,setSelected]=useState<Set<string>>(new Set())
  const [membersByUser,setMembersByUser]=useState<Record<string,{slug:string;role:string}[]>>({})
  const load = ()=>{
    const s=createBrowserSupabase();
    s.from("profiles").select("*").order("created_at",{ascending:false}).then(({data})=> setUsers(data||[]))
    // Peran per event: admin event A tampil sebagai user di event lain
    fetch("/api/admin/event-members").then(r=> r.json()).then(j=>{
      const evMap: Record<string,string> = {}
      for(const e of Object.values((j.events||{}) as Record<string,any>)) evMap[(e as any).id] = (e as any).slug
      const m: Record<string,{slug:string;role:string}[]> = {}
      for(const mem of (j.members||[])){
        const mm = mem as any
        ;(m[mm.user_id] = m[mm.user_id] || []).push({ slug: evMap[mm.event_id] || mm.event_id.slice(0,8), role: mm.role })
      }
      setMembersByUser(m)
    }).catch(()=>{})
  }
  useEffect(()=>{ load() },[])
  const toggleSelect = (id:string)=>{ const n=new Set(selected); if(n.has(id)) n.delete(id); else n.add(id); setSelected(n) }
  const toggleAll = ()=>{ if(selected.size===users.length) setSelected(new Set()); else setSelected(new Set(users.map((u:any)=>u.id))) }
  const handleBulkDelete = async ()=>{ if(selected.size===0) return; for(const id of selected){ await fetch(`/api/admin/crud?table=profiles&id=${id}`, { method:"DELETE" }) } ; toast({ title: `${selected.size} pengguna dihapus`, variant:"success"}); setSelected(new Set()); load() }
  const openEdit = (u:any)=>{ setEditing(u); setRole(u.role==="ADMIN" ? "ADMIN" : "USER"); setNewPassword(""); setShowPass(false); setOpen(true) }
  const handleSave = async ()=>{ if(saving) return; setSaving(true);
    if(!editing) return
    // update role via crud
    let res = await fetch("/api/admin/crud", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"profiles", id: editing.id, data: { role } }) })
    let j = await res.json()
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); setSaving(false); return }
    // if password provided, update via admin api
    if(newPassword){
      if(newPassword.length<6){ toast({ title:"Kata sandi minimal 6 karakter", variant:"error"}); return }
      res = await fetch("/api/admin/users/password", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: editing.id, newPassword }) })
      j = await res.json()
      if(!res.ok){ toast({ title:"Gagal ubah kata sandi", description:j.error, variant:"error"}); setSaving(false); return }
    }
    toast({ title:"Pengguna diperbarui", variant:"success" }); setOpen(false); load(); setSaving(false)
  }
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-[18px] font-black">Kelola Pengguna</h1><div className="flex items-center gap-2">{selected.size>0 && <Button variant="outline" size="sm" className="rounded-full text-red-600 gap-2" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5"/>Hapus {selected.size} dipilih</Button>}</div></div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="grid grid-cols-[40px_1.4fr_1.2fr_120px_100px] gap-2 px-4 py-3 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/30">
            <div><input type="checkbox" checked={selected.size===users.length && users.length>0} onChange={toggleAll} /></div><div>NAMA</div><div>EMAIL</div><div>PERAN</div><div>AKSI</div>
          </div>
          {users.length===0 ? <div className="p-8 text-center text-sm text-muted-foreground">Belum ada pengguna.</div> :
            users.map((u:any)=> (
            <div key={u.id} className="grid grid-cols-[40px_1.4fr_1.2fr_120px_100px] gap-2 px-4 py-3 items-center border-b border-white/[0.06]/50 text-sm">
              <div><input type="checkbox" checked={selected.has(u.id)} onChange={()=> toggleSelect(u.id)} /></div>
              <div className="font-bold truncate">{u.public_name || "-"}</div>
              <div className="text-muted-foreground text-xs truncate">{u.email}</div>
              <div>
                <div><span className={`rounded-full px-2 py-1 text-xs font-bold ${u.role==="SUPER_ADMIN" ? "bg-primary text-black" : u.role==="ADMIN" ? "bg-amber-500 text-black" : "bg-secondary"}`}>{u.role==="SUPER_ADMIN" ? "super admin" : u.role==="ADMIN" ? "admin" : "user"}</span></div>
                {u.role!=="SUPER_ADMIN" && (membersByUser[u.id]||[]).length>0 && (
                  <div className="mt-1 flex flex-wrap gap-1">{(membersByUser[u.id]||[]).map((m:any,i:number)=>(<span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">admin@{m.slug}</span>))}</div>
                )}
                {u.role!=="SUPER_ADMIN" && !(membersByUser[u.id]||[]).length && (
                  <div className="mt-1 text-[10px] text-muted-foreground">user di semua event</div>
                )}
              </div>
              <div><Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1" onClick={()=> openEdit(u)}><Pencil className="h-3 w-3"/>Kelola</Button></div>
            </div>
          ))}
        </div>
        {/* Mobile */}
        <div className="md:hidden space-y-2 p-3">
          {users.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada pengguna.</div> :
            users.map((u:any)=> (
            <div key={u.id} className="rounded-xl border border-white/[0.06] p-3 flex gap-3">
              <input type="checkbox" className="mt-1" checked={selected.has(u.id)} onChange={()=> toggleSelect(u.id)} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{u.public_name || "-"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                <div className="mt-1 flex flex-wrap gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${u.role==="SUPER_ADMIN" ? "bg-primary text-black" : u.role==="ADMIN" ? "bg-amber-500 text-black" : "bg-secondary"}`}>{u.role==="SUPER_ADMIN" ? "super admin" : u.role==="ADMIN" ? "admin" : "user"}</span>{u.role!=="SUPER_ADMIN" && (membersByUser[u.id]||[]).map((m:any,i:number)=>(<span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">admin@{m.slug}</span>))}<span className="rounded-full bg-emerald-500 text-black px-2 py-0.5 text-[11px] font-bold">Aktif</span></div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs gap-1 shrink-0" onClick={()=> openEdit(u)}><Pencil className="h-3 w-3"/>Kelola</Button>
            </div>
          ))}
        </div>
        {users.length>0 && (
          <div className="p-3 border-t border-white/[0.06] bg-white/[0.04] backdrop-blur/20 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.size===users.length && users.length>0} onChange={toggleAll} /> Pilih semua ({users.length})</label>
            {selected.size>0 && <span className="text-xs font-bold">{selected.size} dipilih</span>}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Kelola Pengguna</DialogTitle><DialogDescription>{editing?.public_name} — {editing?.email}</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><label className="text-xs font-bold">Peran Pengguna</label><Select value={role} onValueChange={setRole} options={[{value:"USER",label:"user — User Biasa"},{value:"ADMIN",label:"admin — Event sendiri"}]} /></div>
            <p className="-mt-1 text-[11px] text-muted-foreground">Peran ADMIN membutuhkan keanggotaan event — atur di halaman Akses &amp; Admin setelah menyimpan.</p>
            <div>
              <label className="text-xs font-bold">Kata Sandi Baru (opsional)</label>
              <div className="flex gap-2">
                <input type={showPass ? "text" : "password"} value={newPassword} onChange={e=> setNewPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" className="flex-1 h-10 rounded-xl border border-white/[0.08] px-3 text-sm" />
                <Button variant="outline" size="sm" onClick={()=> setShowPass(!showPass)}>{showPass ? "Sembunyikan" : "Lihat"}</Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Demi keamanan, kata sandi lama tidak bisa dilihat. Masukkan kata sandi baru jika ingin mengubah.</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setOpen(false)}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Memproses..." : "Simpan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
