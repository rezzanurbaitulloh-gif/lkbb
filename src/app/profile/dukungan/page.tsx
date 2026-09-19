"use client"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useApp } from "@/lib/store"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SubProfile(){
  const { currentUser, favorites } = useApp()
  const [transactions,setTransactions]=useState<any[]>([])
  useEffect(()=>{ if(currentUser) fetch("/api/transactions").then(r=>r.json()).then(d=> setTransactions(Array.isArray(d)? d : [])) },[currentUser])
  const [allPeletons,setAllPeletons]=useState<any[]>([])
  useEffect(()=>{ const s=createBrowserSupabase(); s.from("peletons").select("*").eq("verified", true).eq("active", true).then(({data})=> setAllPeletons(data||[])) },[])
  const path = typeof window !== 'undefined' ? window.location.pathname : ''
  const isEdit = path.includes('/edit')
  const isFav = path.includes('/favorit')
  const isDuk = path.includes('/dukungan')
  const isNotif = path.includes('/notifikasi')

  if(!currentUser){
    return (<div className="min-h-screen flex flex-col"><Navbar/><main className="flex-1 grid place-items-center p-8"><div className="text-center"><p>Silakan masuk terlebih dahulu</p><Link href="/login"><Button className="mt-3 rounded-full">Masuk</Button></Link></div></main><Footer/><BottomNav/></div>)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6">
          <Link href="/profile" className="text-xs font-semibold text-muted-foreground hover:text-foreground">← Kembali ke Profil</Link>
          <h1 className="mt-2 text-[22px] font-black tracking-tight">
            {isEdit ? "Edit Profil" : isFav ? "Peleton Favorit" : isDuk ? "Riwayat Dukungan" : "Notifikasi"}
          </h1>

          {isEdit && (
            <div className="mt-4 max-w-lg rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6 grid gap-3">
              <div><label className="text-xs font-bold">Nama</label><Input defaultValue={currentUser.name} /></div>
              <div><label className="text-xs font-bold">Email</label><Input defaultValue={currentUser.email} /></div>
              <div><label className="text-xs font-bold">No. HP</label><Input placeholder="08xx-xxxx-xxxx" /></div>
              <Button className="rounded-full h-11">Simpan Perubahan</Button>
            </div>
          )}

          {isFav && (
            <div className="mt-4">
              {favorites.length===0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada peleton favorit.</div> :
                <div className="grid sm:grid-cols-2 gap-3">
                  {allPeletons.filter(p=> favorites.includes(p.id)).map(p=> (
                    <div key={p.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3">
                      <img src={p.image_url || p.image} alt="" className="h-14 w-14 rounded-lg object-cover"/>
                      <div><div className="text-sm font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.school}</div><Link href={`/peleton/${p.slug}`} className="text-xs font-bold text-primary">Lihat →</Link></div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {isDuk && (
            <div className="mt-4 space-y-2">
              {transactions.length===0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada transaksi. Transaksi dari DB akan muncul di sini dan di dashboard.</div> :
                transactions.map((tx:any)=> (
                  <Link key={tx.id} href={`/profile/dukungan/${tx.id}`} className="block rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 flex justify-between items-center hover:bg-white/5 backdrop-blur/30 transition-colors">
                    <div>
                      <div className="text-sm font-bold">{tx.peletons?.name || tx.peletonName || tx.peleton_id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.created_at || tx.date).toLocaleString("id-ID")} • {tx.supports} ballot • Tap untuk invoice</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">Rp{(tx.amount || 0).toLocaleString("id-ID")}</div>
                      <div className="text-xs font-bold text-emerald-600">{tx.status}</div>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}

          {isNotif && (
            <div className="mt-4 space-y-2">
              {transactions.length===0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada notifikasi. Notifikasi muncul dari aktivitas dukunganmu.</div>
              ) : (
                transactions.slice(0,10).map((tx:any)=> (
                  <div key={tx.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
                    <div className="text-sm font-bold">{tx.status==="Success" ? "Dukungan berhasil" : `Dukungan ${String(tx.status||"").toLowerCase()}`}</div>
                    <div className="text-sm text-muted-foreground">Dukungan {tx.supports} suara untuk {tx.peletons?.name || tx.peletonName || "peleton"} {tx.status==="Success" ? "berhasil tercatat" : "menunggu pembayaran"}</div>
                    <div className="text-xs text-muted-foreground">{tx.created_at ? new Date(tx.created_at).toLocaleString("id-ID") : ""}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer /><BottomNav />
    </div>
  )
}
