"use client"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useApp } from "@/lib/store"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, LogOut, Settings, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage(){
  const { currentUser, logout, favorites } = useApp()
  const [transactions,setTransactions]=useState<any[]>([])
  useEffect(()=>{ if(currentUser) fetch("/api/transactions").then(r=>r.json()).then(d=> setTransactions(Array.isArray(d)? d : [])) },[currentUser])
  const router=useRouter()
  const [allPeletons,setAllPeletons]=useState<any[]>([])
  useEffect(()=>{ const s=createBrowserSupabase(); s.from("peletons").select("*").eq("verified", true).eq("active", true).then(({data})=> setAllPeletons(data||[])) },[])
  const favPeletons = allPeletons.filter((p:any)=> favorites.includes(p.id))
  if(!currentUser){
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center p-8 pb-[72px] md:pb-8">
          <div className="max-w-sm text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
            <div className="text-sm font-black">Belum Masuk</div>
            <p className="text-sm text-muted-foreground">Masuk untuk melihat profil dan riwayat dukungan.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/login"><Button className="w-full rounded-full">Masuk</Button></Link>
              <Link href="/register"><Button variant="outline" className="w-full rounded-full">Daftar</Button></Link>
            </div>
          </div>
        </main>
        <Footer /><BottomNav />
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6">
          <div className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#09090b] to-[#1A1E27]" />
            <div className="px-6 pb-6">
              <div className="flex gap-4 -mt-8 items-end">
                {(currentUser as any).avatar_url ? (
                  <img src={(currentUser as any).avatar_url} alt={currentUser.name} className="h-20 w-20 rounded-2xl object-cover border-4 border-card bg-white" />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-foreground text-background grid place-items-center text-xl font-black border-4 border-card">
                    {currentUser.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div className="pb-2">
                  <div className="text-[18px] font-black">{currentUser.name}</div>
                  <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                </div>
                <div className="ml-auto hidden md:flex gap-2 pb-2">
                  <Link href="/profile/edit"><Button variant="outline" size="sm" className="rounded-full">Edit Profil</Button></Link>
                  <Button variant="ghost" size="sm" className="rounded-full" onClick={()=>{logout(); router.push("/")}}> <LogOut className="h-4 w-4"/> Keluar</Button>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white/5 backdrop-blur p-4 text-center">
                  <div className="text-[24px] font-black tabular-nums">{transactions.length}</div>
                  <div className="text-xs text-muted-foreground">Transaksi Dukungan</div>
                </div>
                <div className="rounded-xl bg-white/5 backdrop-blur p-4 text-center">
                  <div className="text-[24px] font-black tabular-nums">{favPeletons.length}</div>
                  <div className="text-xs text-muted-foreground">Peleton Favorit</div>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <div className="text-xs font-bold tracking-widest text-primary">STATUS</div>
                  <div className="text-sm font-black">Pendukung Aktif</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/profile/dukungan"><Button variant="outline" className="rounded-full gap-2"><Clock className="h-4 w-4"/> Riwayat Dukungan</Button></Link>
                <Link href="/profile/favorit"><Button variant="outline" className="rounded-full gap-2"><Heart className="h-4 w-4"/> Favorit</Button></Link>
                <Link href="/profile/notifikasi"><Button variant="outline" className="rounded-full">Notifikasi</Button></Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h3 className="text-sm font-black flex items-center gap-2"><Heart className="h-4 w-4"/> Peleton Favorit</h3>
              {favPeletons.length===0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Belum ada peleton favorit.</p>
                  <Link href="/peleton"><Button size="sm" className="mt-2 rounded-full">Jelajahi Peleton</Button></Link>
                </div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {favPeletons.map(p=> (
                    <div key={p.id} className="flex gap-3 rounded-xl border border-white/10 p-3">
                      <img src={p.image_url || p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.school}</div>
                      </div>
                      <Link href={`/peleton/${p.slug}`} className="ml-auto"><Button size="sm" variant="outline" className="rounded-full">Lihat</Button></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h3 className="text-sm font-black">Riwayat Dukungan Terbaru</h3>
              {transactions.length===0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Belum ada dukungan. Dukung peleton favoritmu sekarang!</p>
                  <Link href="/peleton"><Button size="sm" className="mt-2 rounded-full">Dukung</Button></Link>
                </div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {transactions.slice(0,5).map((tx:any)=> (
                    <Link key={tx.id} href={`/profile/dukungan/${tx.id}`} className="flex items-center justify-between rounded-xl border border-white/10 p-3 hover:bg-white/5 backdrop-blur/50 transition-colors">
                      <div>
                        <div className="text-sm font-bold">{tx.peletons?.name || tx.peletonName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(tx.created_at || tx.date).toLocaleDateString("id-ID")} • {tx.supports} ballot • Rp{(tx.amount||0).toLocaleString("id-ID")}</div>
                      </div>
                      <Badge className="bg-emerald-500 text-black border-emerald-500">{tx.status}</Badge>
                    </Link>
                  ))}
                  <Link href="/profile/dukungan" className="text-center text-xs font-semibold text-primary hover:underline">Lihat semua →</Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex md:hidden gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={()=>{logout(); router.push("/")}}>Keluar</Button>
            <Link href="/profile/edit" className="flex-1"><Button className="w-full rounded-full">Edit Profil</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
