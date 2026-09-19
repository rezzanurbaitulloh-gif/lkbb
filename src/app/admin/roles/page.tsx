import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ACCESS_MATRIX } from "@/lib/permissions"

const roles=[
  {name:"Super Admin", users:"Panitia inti / pemilik platform", perms:"Akses penuh semua event, pengguna global, pendapatan global, domain, dan pengaturan platform", full:true},
  {name:"Admin", users:"Panitia event", perms:"Hanya event sendiri: tim, transaksi, klasemen, hasil, konten, sponsor, pengaturan & harga suara event, pendapatan event, kelola admin event", full:false},
  {name:"User Biasa", users:"Semua pendaftar", perms:"Melihat tim, memberi dukungan, melihat riwayat sendiri", full:false},
]
export default function Roles(){
  const groups: Record<string, typeof ACCESS_MATRIX> = {}
  for(const s of ACCESS_MATRIX){
    if(!groups[s.group]) groups[s.group]=[]
    groups[s.group].push(s)
  }
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-[18px] font-black">Peran Pengguna</h1><p className="text-xs text-muted-foreground">Matriks akses eksplisit — menu dan fitur di luar akses tidak ditampilkan.</p></div></div>
      <div className="grid gap-3">
        {roles.map(r=> (
          <div key={r.name} className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-black">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.perms} • {r.users}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.full ? "bg-primary text-black" : "bg-secondary"}`}>{r.full ? "Akses Penuh" : "Terbatas"}</span>
          </div>
        ))}
      </div>
      <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-black">Matriks Akses Fitur</h3><p className="text-xs text-muted-foreground">✓ = boleh • — = tidak ditampilkan</p></div>
        <div className="divide-y divide-white/[0.06]">
          {Object.entries(groups).map(([g, list])=> (
            <div key={g} className="p-4">
              <div className="text-[11px] font-bold tracking-widest text-muted-foreground mb-2">{g}</div>
              <div className="grid gap-1.5">
                {list.map(s=> (
                  <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold truncate">{s.label}</span>
                    <span className="flex items-center gap-3 text-xs shrink-0">
                      <span title="Super Admin">super <b className="text-emerald-400">✓</b></span>
                      <span title="Admin">{s.admin === "own" ? <span>admin <b className="text-emerald-400">✓*</b></span> : <span className="text-muted-foreground">admin —</span>}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/[0.06] text-xs text-muted-foreground">✓* = hanya event sendiri. User biasa tanpa akses admin.</div>
      </div>
      <Link href="/admin/access"><Button variant="outline" className="rounded-full">Kelola Akses →</Button></Link>
    </div>
  )
}
