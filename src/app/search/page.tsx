"use client"
import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { useEffect } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import Link from "next/link"
import { Search } from "lucide-react"

function SearchInner(){
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""
  const [q,setQ]=useState(initialQ)
  const [peletons,setPeletons]=useState<any[]>([])
  const [allAnn,setAllAnn]=useState<any[]>([])
  useEffect(()=>{ setQ(initialQ) },[initialQ])
  useEffect(()=>{
    const s=createBrowserSupabase()
    s.from("peletons").select("*").eq("verified", true).eq("active", true).then(({data})=> setPeletons(data||[]))
    s.from("announcements").select("*").then(({data})=> setAllAnn(data||[]))
  },[])
  const peletonResults = useMemo(()=> q ? peletons.filter((p:any)=> `${p.name} ${p.school} ${p.city}`.toLowerCase().includes(q.toLowerCase())).slice(0,6) : [],[q,peletons])
  const annResults = useMemo(()=> q ? allAnn.filter((a:any)=> `${a.title} ${a.content}`.toLowerCase().includes(q.toLowerCase())).slice(0,4) : [],[q,allAnn])
  const hasQuery = q.trim().length>1
  const total = peletonResults.length + annResults.length

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6">
            <h1 className="text-[22px] font-black tracking-tight">PENCARIAN</h1>
            <div className="mt-4 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari peleton, berita, pengumuman…" className="h-[44px] w-full rounded-full border border-white/15 bg-white/10 backdrop-blur pl-10 pr-4 text-sm placeholder:text-white focus:outline-none focus:ring-2 focus:ring-primary text-white" autoFocus />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6">
          {!hasQuery ? (
            <div className="py-10 text-center">
              <div className="text-sm font-bold">Cari peleton atau pengumuman</div>
              <p className="text-xs text-muted-foreground">Ketik minimal 2 karakter untuk memulai pencarian</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["SMKN 1 Kertosono","Paskibra","Javasoma","Peleton"].map(k=> (
                  <button key={k} onClick={()=>setQ(k)} className="rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1.5 text-xs font-semibold hover:bg-white/5 backdrop-blur">{k}</button>
                ))}
              </div>
            </div>
          ) : total===0 ? (
            <div className="py-10 text-center"><div className="text-sm font-bold">Tidak ada hasil untuk &quot;{q}&quot;</div><p className="text-xs text-muted-foreground">Coba kata kunci lain</p></div>
          ) : (
            <div className="space-y-6">
              {peletonResults.length>0 && (
                <div>
                  <h3 className="text-xs font-black tracking-widest">PELETON • {peletonResults.length}</h3>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {peletonResults.map(p=> (
                      <Link key={p.id} href={`/tim/${p.slug}`} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3 hover:bg-white/5 backdrop-blur">
                        <img src={p.image_url || p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        <div><div className="text-sm font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.school} • {p.city}</div></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {annResults.length>0 && (
                <div>
                  <h3 className="text-xs font-black tracking-widest">PENGUMUMAN • {annResults.length}</h3>
                  <div className="mt-2 grid gap-2">
                    {annResults.map(a=> (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3">
                        <div className="text-sm font-bold">{a.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{a.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default function SearchPage(){
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm">Memuat pencarian...</div>}>
      <SearchInner />
    </Suspense>
  )
}
