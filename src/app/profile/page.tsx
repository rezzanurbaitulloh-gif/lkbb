"use client"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useApp } from "@/lib/store"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 grid place-items-center p-8 pb-[72px] md:pb-8">
          <div className="max-w-sm text-center border border-border p-8">
            <div className="font-display font-bold">Belum Masuk</div>
            <p className="mt-2 text-sm text-muted-foreground">Masuk untuk melihat profil dan riwayat dukungan.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/login"><Button className="w-full rounded-none">Masuk</Button></Link>
              <Link href="/register"><Button variant="outline" className="w-full rounded-none">Daftar</Button></Link>
            </div>
          </div>
        </main>
        <Footer /><BottomNav />
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="container-editorial py-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
            {/* Left: MY PROFILE */}
            <div className="border border-border p-6">
              <div className="meta-label">MY PROFILE</div>
              <div className="mt-4 flex gap-4 items-start">
                {(currentUser as any).avatar_url ? (
                  <img src={(currentUser as any).avatar_url} alt={currentUser.name} className="h-16 w-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted grid place-items-center font-display font-bold text-lg border border-border">
                    {currentUser.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-display font-bold text-lg leading-none">Hello, {currentUser.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{currentUser.email}</div>
                  <div className="mt-3 flex gap-2">
                    <Link href="/profile/edit"><Button variant="outline" size="sm" className="rounded-none h-8 text-xs">Edit Profil</Button></Link>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={()=>{logout(); router.push("/")}}> <LogOut className="h-3 w-3"/> Keluar</Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-y border-border py-4 text-center">
                <div>
                  <div className="font-display font-bold text-xl tabular-nums">{transactions.length}</div>
                  <div className="meta-label">Transaksi</div>
                </div>
                <div>
                  <div className="font-display font-bold text-xl tabular-nums">{favPeletons.length}</div>
                  <div className="meta-label">Favorit</div>
                </div>
                <div>
                  <div className="meta-label">Status</div>
                  <div className="text-xs font-bold mt-1">Pendukung Aktif</div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link href="/profile/edit" className="flex items-center justify-between border border-border p-3 text-sm hover:bg-muted transition-colors">
                  <span>Account Information</span><span>→</span>
                </Link>
                <Link href="/profile/dukungan" className="flex items-center justify-between border border-border p-3 text-sm hover:bg-muted transition-colors">
                  <span>Voting History</span><span>{transactions.length}</span>
                </Link>
                <Link href="/profile/dukungan" className="flex items-center justify-between border border-border p-3 text-sm hover:bg-muted transition-colors">
                  <span>Payment History</span><span>→</span>
                </Link>
                <button onClick={()=>{logout(); router.push("/")}} className="flex w-full items-center justify-between border border-border p-3 text-sm hover:bg-muted transition-colors">
                  <span>Log Out</span><span>→</span>
                </button>
              </div>
            </div>

            {/* Right: Voting History */}
            <div className="border border-border p-6">
              <div className="flex items-baseline justify-between border-b border-border pb-3">
                <h2 className="font-display font-bold text-sm tracking-[-0.01em]">Voting History</h2>
                <Link href="/profile/dukungan" className="text-xs font-bold hover:underline">View All →</Link>
              </div>
              {transactions.length===0 ? (
                <div className="py-12 text-center border border-dashed border-border mt-4">
                  <p className="text-sm text-muted-foreground">Belum ada dukungan.</p>
                  <Link href="/tim" className="mt-2 inline-flex border border-border px-3 py-1 text-xs font-bold hover:bg-muted">Dukung</Link>
                </div>
              ) : (
                <div className="divide-y divide-border mt-4">
                  {transactions.slice(0,5).map((tx:any)=> (
                    <Link key={tx.id} href={`/profile/dukungan/${tx.id}`} className="flex gap-3 py-3 hover:bg-muted/50 transition-colors -mx-3 px-3">
                      <img src={favPeletons.find((p:any)=>p.id===tx.peleton_id)?.image_url || "/assets/brand/lkbb-logo.jpg"} alt="" className="h-10 w-10 object-cover border border-border shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">{tx.peletons?.name || tx.peletonName}</div>
                        <div className="meta-label truncate">{new Date(tx.created_at || tx.date).toLocaleDateString("id-ID")} • {tx.supports} ballot • Rp{(tx.amount||0).toLocaleString("id-ID")}</div>
                      </div>
                      <span className="text-xs font-bold self-center">{tx.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
