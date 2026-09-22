"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Shield, Users, Lock, Crown, Edit3, UserPlus, Trash2 } from "lucide-react"
import { createBrowserSupabase } from "@/lib/supabase"
import { useAdminContext } from "@/hooks/useAdminContext"

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin — akses penuh semua event",
  ADMIN: "Admin — hanya event sendiri",
  USER: "User — tanpa akses admin",
}

export default function AccessControl(){
  const { toast } = useToast()
  const adminCtx = useAdminContext()
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

  // Matriks: ADMIN hanya mengelola admin event sendiri (bukan matriks global).
  if (!adminCtx.loading && !adminCtx.isSuper) {
    return <EventAdminManager />
  }

  // Untuk SUPER_ADMIN: matriks permission hanya untuk ADMIN (event admin), 
  // karena SUPER_ADMIN sudah full access. USER tidak perlu matrix.
  const showMatrix = selectedRole === "ADMIN"

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

      {showMatrix && (
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-black">Matrix Permission — ADMIN</h3>
          <p className="text-xs text-muted-foreground">Klik untuk toggle. Hijau = boleh, abu = tidak.</p>
        </div>
        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {Object.entries(grouped).map(([cat, list])=> (
            <div key={cat} className="space-y-2">
              <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{cat}</div>
              <div className="grid gap-1.5">
                {list.map((perm:any)=> {
                  const granted = isGranted("ADMIN", perm.key)
                  return (
                    <label key={perm.key} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${granted ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.04] backdrop-blur/30 border-white/[0.06]"}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{perm.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{perm.key} — {perm.description}</div>
                      </div>
                      <input type="checkbox" checked={granted} onChange={()=> toggleRolePerm("ADMIN", perm.key)} className="h-4 w-4 accent-emerald-600" />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

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
            <div><label className="text-xs font-bold">Peran Baru</label><Select value={newRole} onValueChange={setNewRole} options={[{value:"USER",label:"USER — User Biasa"},{value:"ADMIN",label:"admin — Event sendiri"}]} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setEditingUser(null)}>Batal</Button><Button onClick={handleSaveUserRole}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur/20 p-3 text-xs flex items-center gap-2"><Lock className="h-4 w-4"/> Matriks 3 peran: SUPER_ADMIN semua event & platform, ADMIN hanya event sendiri, USER tanpa akses admin. Semua perubahan tercatat di audit_logs.</div>

      <EventAdminManager showEventFilter />

      <SuperAdminManager />
    </div>
  )
}

// Kelola SUPER_ADMIN platform — hanya tampil untuk SUPER_ADMIN (matriks).
export function SuperAdminManager(){
  const { toast } = useToast()
  const [supers, setSupers] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const load = async ()=>{
    const res = await fetch("/api/admin/super-admins")
    const j = await res.json()
    if(res.ok){ setSupers(j.supers||[]); setUsersMap(j.users||{}) }
  }
  useEffect(()=>{ load() },[])
  const handleAdd = async ()=>{
    if(!email.trim()){ toast({ title:"Email wajib", variant:"error" }); return }
    setSaving(true)
    const res = await fetch("/api/admin/super-admins",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: email.trim() }) })
    const j = await res.json().catch(()=> ({}))
    setSaving(false)
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title:"Super admin ditambahkan", variant:"success" })
    setEmail("")
    load()
  }
  const handleRemove = async (user_id: string)=>{
    const res = await fetch(`/api/admin/super-admins?user_id=${user_id}`, { method:"DELETE" })
    const j = await res.json().catch(()=> ({}))
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title:"Super admin dicabut", variant:"success" })
    load()
  }
  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
      <div className="p-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-black flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500"/> Super Admin Platform</h3>
        <p className="text-xs text-muted-foreground">Akses penuh semua event & platform. Minimal satu harus tersisa.</p>
      </div>
      <div className="p-4 grid sm:grid-cols-[1fr_auto] gap-2 border-b border-white/[0.06]">
        <Input value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email pengguna…" />
        <Button onClick={handleAdd} disabled={saving} className="rounded-full gap-2"><UserPlus className="h-4 w-4"/>{saving ? "Menyimpan…" : "Angkat Super Admin"}</Button>
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {supers.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada data.</div> :
          supers.map((s:any)=> {
            const u = usersMap[s.user_id] || {}
            return (
              <div key={s.user_id} className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.06]/50 text-sm">
                <div className="min-w-0">
                  <div className="font-bold truncate">{u.public_name || u.email?.split("@")[0] || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email || ""}</div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full h-7 w-7 p-0 text-red-600 shrink-0" onClick={()=> handleRemove(s.user_id)}><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// Kelola ADMIN per event — dipakai SUPER (semua event + filter) dan ADMIN (event sendiri).
// Matriks: "Manage Event Admin — own event".
export function EventAdminManager({ showEventFilter = false }: { showEventFilter?: boolean }){
  const { toast } = useToast()
  const adminCtx = useAdminContext()
  const [members, setMembers] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const [eventsMap, setEventsMap] = useState<Record<string, any>>({})
  const [filterEvent, setFilterEvent] = useState<string>("")
  const [email, setEmail] = useState("")
  const [addEvent, setAddEvent] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPass, setNewPass] = useState("")
  const [newRole, setNewRole] = useState("ADMIN")

  const load = async ()=>{
    const qs = filterEvent ? `?event_id=${encodeURIComponent(filterEvent)}` : ""
    const res = await fetch(`/api/admin/event-members${qs}`)
    const j = await res.json()
    if(res.ok){ setMembers(j.members||[]); setUsersMap(j.users||{}); setEventsMap(j.events||{}) }
  }
  useEffect(()=>{ load() },[filterEvent])

  const eventOptions = adminCtx.events.map((e:any)=> ({ value: e.id, label: `${e.slug} — ${e.name}` }))
  useEffect(()=>{ if(!addEvent && eventOptions.length>0) setAddEvent(eventOptions[0].value) },[adminCtx.events])

  const handleAdd = async ()=>{
    if(!email.trim() || !addEvent){ toast({ title:"Email dan event wajib", variant:"error" }); return }
    setSaving(true)
    const res = await fetch("/api/admin/event-members",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: email.trim(), event_id: addEvent }) })
    const j = await res.json().catch(()=> ({}))
    setSaving(false)
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title:"Admin event ditambahkan", variant:"success" })
    setEmail("")
    load()
  }
  const handleRemove = async (id: string)=>{
    const res = await fetch(`/api/admin/event-members?id=${id}`, { method:"DELETE" })
    const j = await res.json().catch(()=> ({}))
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title:"Admin event dihapus", variant:"success" })
    load()
  }
  const handleCreate = async ()=>{
    if(!email.trim() || !newPass || !addEvent){ toast({ title:"Email, kata sandi & event wajib", variant:"error" }); return }
    setSaving(true)
    const res = await fetch("/api/admin/members",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: email.trim(), password: newPass, name: newName.trim() || undefined, event_id: addEvent, role: newRole }) })
    const j = await res.json().catch(()=> ({}))
    setSaving(false)
    if(!res.ok){ toast({ title:"Gagal", description:j.error, variant:"error" }); return }
    toast({ title: j.created ? "Akun baru dibuat + ditambahkan" : "Pengguna ditambahkan ke event", variant:"success" })
    setEmail(""); setNewPass(""); setNewName("")
    setShowCreate(false)
    load()
  }

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black flex items-center gap-2"><Users className="h-4 w-4"/> Admin Event</h3>
          <p className="text-xs text-muted-foreground">{adminCtx.isSuper ? "Semua event" : "Hanya event Anda"} — peran ADMIN berlaku per event, bukan global.</p>
        </div>
        {showEventFilter && adminCtx.isSuper && eventOptions.length>0 && (
          <Select value={filterEvent} onValueChange={setFilterEvent} options={[{value:"",label:"Semua event"},...eventOptions]} />
        )}
      </div>
      <div className="p-4 grid sm:grid-cols-[1fr_220px_auto] gap-2 border-b border-white/[0.06]">
        <Input value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email pengguna…" />
        {eventOptions.length>0 && <Select value={addEvent} onValueChange={setAddEvent} options={eventOptions} />}
        <div className="flex gap-2">
          <Button onClick={handleAdd} disabled={saving} className="rounded-full gap-2"><UserPlus className="h-4 w-4"/>{saving ? "Menyimpan…" : "Tambah Admin"}</Button>
          <Button variant="outline" onClick={()=> setShowCreate(!showCreate)} className="rounded-full text-xs">Akun Baru</Button>
        </div>
      </div>
      {showCreate && (
        <div className="p-4 grid sm:grid-cols-2 gap-2 border-b border-white/[0.06] bg-white/[0.02]">
          <Input value={newName} onChange={e=> setNewName(e.target.value)} placeholder="Nama tampilan" />
          <Input value={newPass} onChange={e=> setNewPass(e.target.value)} type="password" placeholder="Kata sandi (min 6)" />
          <Select value={newRole} onValueChange={setNewRole} options={[{value:"ADMIN",label:"ADMIN event ini"},{value:"USER",label:"USER event ini"}]} />
          <Button onClick={handleCreate} disabled={saving} className="rounded-full">{saving ? "Memproses..." : "Buat Akun + Tambahkan"}</Button>
          <p className="sm:col-span-2 text-[11px] text-muted-foreground">Akun baru hanya berlaku di event ini. Di event lain ia tampil sebagai user biasa.</p>
        </div>
      )}
      <div className="max-h-[320px] overflow-y-auto">
        {members.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Belum ada admin event.</div> :
          members.map((m:any)=> {
            const u = usersMap[m.user_id] || {}
            const ev = eventsMap[m.event_id] || {}
            return (
              <div key={m.id} className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.06]/50 text-sm">
                <div className="min-w-0">
                  <div className="font-bold truncate">{u.public_name || u.email?.split("@")[0] || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email || ""} • {ev.slug || ev.name || ""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-amber-500 text-black px-2.5 py-1 text-xs font-bold">admin</span>
                  <Button variant="ghost" size="sm" className="rounded-full h-7 w-7 p-0 text-red-600" onClick={()=> handleRemove(m.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
