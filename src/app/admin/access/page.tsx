"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Shield, Users, Lock, Crown, Edit3 } from "lucide-react"
import { createBrowserSupabase } from "@/lib/supabase"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin — akses penuh",
  USER: "User — tanpa akses admin",
}

export default function AccessControl(){
  const { toast } = useToast()
  const [perms, setPerms]=useState<any[]>([])
  const [rolePerms, setRolePerms]=useState<any[]>([])
  const [profiles, setProfiles]=useState<any[]>([])
  const [loading, setLoading]=useState(true)
  const [selectedRole, setSelectedRole]=useState<string>("ADMIN")
  const [editingUser, setEditingUser]=useState<any|null>(null)
  const [newRole, setNewRole]=useState<string>("USER")

  const load = async ()=>{
    setLoading(true)
    const res = await fetch("/api/admin/permissions")
    const j = await res.json()
    if(res.ok){
      setPerms(j.permissions||[])
      setRolePerms(j.role_permissions||[])
      setProfiles(j.profiles||[])
    }
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const isGranted = (role:string, key:string)=>{
    const found = rolePerms.find((r:any)=> r.role===role && r.permission_key===key)
    if(found) return !!found.granted
    // fallback defaults are in DB seed, so treat missing as false
    return false
  }
  const toggleRolePerm = async (role:string, key:string)=>{
    const current = isGranted(role, key)
    const res = await fetch("/api/admin/permissions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ role, permission_key: key, granted: !current }) })
    if(res.ok){ toast({ title: !current ? "Diaktifkan" : "Dimatikan", variant:"success" }); load() } else { const j=await res.json(); toast({ title:"Gagal", description:j.error, variant:"error" }) }
  }

  const openEditUser = (u:any)=>{
    setEditingUser(u)
    setNewRole(u.role)
  }
  const handleSaveUserRole = async ()=>{
    if(!editingUser) return
    const supabase = createBrowserSupabase()
    // Use crud endpoint for profiles role update (only admin allowed via RLS/service — use service via API)
    const res = await fetch("/api/admin/crud",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ table:"profiles", id: editingUser.id, data: { role: newRole } }) })
    const j = await res.json()
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title:"Peran diperbarui", variant:"success" })
    setEditingUser(null)
    load()
  }

  const grouped: Record<string, any[]> = {}
  for(const p of perms){
    if(!grouped[p.category]) grouped[p.category]=[]
    grouped[p.category].push(p)
  }

  if(loading) return <div className="p-8 text-sm">Memuat hak akses...</div>

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-black flex items-center gap-2"><Shield className="h-5 w-5"/> Hak Akses & Kontrol Admin</h1>
          
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Lihat matrix:</span>
          <Select value={selectedRole} onValueChange={setSelectedRole} options={[{value:"ADMIN",label:"admin"},{value:"USER",label:"USER"}]} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(ROLE_LABEL).map(([role,label])=> (
          <div key={role} className={`rounded-[16px] border p-4 ${role==="ADMIN" ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white border-foreground" : "bg-white/[0.04] backdrop-blur/20 border-white/[0.06]"}`}>
            <div className="flex items-center gap-2">
              {role==="ADMIN" ? <Crown className="h-4 w-4 text-amber-500"/> : <Shield className="h-4 w-4"/>}
              <span className="text-sm font-black">{role}</span>
            </div>
            <div className="text-xs mt-1 opacity-70">{label}</div>
            <div className="mt-2 text-xs">Granted: {rolePerms.filter((r:any)=> r.role===role && r.granted).length}/{perms.length}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-black">Matrix Permission — {selectedRole}</h3>
          <p className="text-xs text-muted-foreground">Klik untuk toggle. Hijau = boleh, abu = tidak.</p>
        </div>
        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {Object.entries(grouped).map(([cat, list])=> (
            <div key={cat} className="space-y-2">
              <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{cat}</div>
              <div className="grid gap-1.5">
                {list.map((perm:any)=> {
                  const granted = isGranted(selectedRole, perm.key)
                  return (
                    <label key={perm.key} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${granted ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.04] backdrop-blur/30 border-white/[0.06]"}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{perm.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{perm.key} — {perm.description}</div>
                      </div>
                      <input type="checkbox" checked={granted} onChange={()=> toggleRolePerm(selectedRole, perm.key)} className="h-4 w-4 accent-emerald-600" />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div><h3 className="text-sm font-black flex items-center gap-2"><Users className="h-4 w-4"/> Daftar Pengguna & Peran</h3><p className="text-xs text-muted-foreground">{profiles.length} akun</p></div>
          <span className="text-xs text-muted-foreground">Klik Kelola untuk ubah peran</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          <div className="hidden md:grid grid-cols-[1.4fr_1.2fr_140px_100px] gap-2 px-4 py-2 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.04] backdrop-blur/20">
            <div>NAMA</div><div>EMAIL</div><div>PERAN</div><div>AKSI</div>
          </div>
          {profiles.map((u:any)=> (
            <div key={u.id} className="flex flex-col md:grid md:grid-cols-[1.4fr_1.2fr_140px_100px] gap-2 px-4 py-3 items-center border-b border-white/[0.06]/50 text-sm">
              <div className="font-bold truncate w-full md:w-auto">{u.public_name||"-"}</div>
              <div className="text-xs text-muted-foreground truncate w-full md:w-auto">{u.email}</div>
              <div className="w-full md:w-auto"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.role==="SUPER_ADMIN" ? "bg-primary text-black" : u.role==="ADMIN" ? "bg-amber-500 text-black" : "bg-secondary"}`}>{u.role==="SUPER_ADMIN" ? "super admin" : u.role==="ADMIN" ? "admin" : "user"}</span></div>
              <div className="w-full md:w-auto"><Button variant="outline" size="sm" className="rounded-full h-7 text-xs w-full md:w-auto" onClick={()=> openEditUser(u)}>Kelola</Button></div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(o)=> !o && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Kelola Peran Pengguna</DialogTitle><DialogDescription>{editingUser?.public_name} — {editingUser?.email}</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><label className="text-xs font-bold">Peran Baru</label><Select value={newRole} onValueChange={setNewRole} options={[{value:"USER",label:"USER — User Biasa"},{value:"ADMIN",label:"admin — Akses penuh"}]} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setEditingUser(null)}>Batal</Button><Button onClick={handleSaveUserRole}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur/20 p-3 text-xs flex items-center gap-2"><Lock className="h-4 w-4"/> Sistem disederhanakan: hanya admin & user. Semua perubahan hak akses tercatat di audit_logs dan langsung diberlakukan di middleware (ADMIN).</div>
    </div>
  )
}
