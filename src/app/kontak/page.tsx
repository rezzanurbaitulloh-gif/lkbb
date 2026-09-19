"use client"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Input, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function KontakPage(){
  const [sent,setSent]=useState(false)
  const [loading,setLoading]=useState(false)
  const [info,setInfo]=useState<Record<string,string>>({})
  useEffect(()=>{
    fetch("/api/cms/settings").then(r=> r.json()).then(j=> {
      const s = j.settings || {}
      const pick = (k: string)=> typeof s[k] === "string" ? s[k] as string : ""
      setInfo({
        email: pick("contact.email"),
        wa: pick("contact.whatsapp"),
        ig: pick("social.instagram"),
        address: pick("contact.address"),
      })
    }).catch(()=>{})
  },[])
  const onSubmit=(e:React.FormEvent)=>{
    e.preventDefault()
    setLoading(true)
    setTimeout(()=>{setLoading(false); setSent(true)},900)
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Hubungi Kami</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em]">KONTAK</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h3 className="text-sm font-black">Informasi Kontak</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {info.email && <div><span className="text-muted-foreground">Surel</span><br/><a href={`mailto:${info.email}`} className="font-bold hover:underline">{info.email}</a></div>}
                {info.wa && <div><span className="text-muted-foreground">WhatsApp Panitia</span><br/><a href={`https://wa.me/${info.wa.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="font-mono font-bold hover:underline">{info.wa}</a></div>}
                {info.ig && <div><span className="text-muted-foreground">Instagram</span><br/><a href={info.ig} target="_blank" rel="noreferrer" className="font-bold hover:underline">Instagram LKBB</a></div>}
                {info.address && <div><span className="text-muted-foreground">Alamat</span><br/><span>{info.address}</span></div>}
                {!info.email && !info.wa && !info.ig && !info.address && <p className="text-xs text-muted-foreground">Info kontak menyusul dari panitia.</p>}
              </div>
            </div>
            <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
              <h4 className="text-sm font-black">Jam Operasional</h4>
              <p className="text-sm text-muted-foreground">Senin - Sabtu, 08.00 - 17.00 WIB</p>
            </div>
          </div>
          <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
            <h3 className="text-sm font-black">Kirim Pesan</h3>
            {sent ? (
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Pesan terkirim!</div>
                <p className="text-xs text-muted-foreground">Tim kami akan membalas dalam 1x24 jam.</p>
                <Button variant="outline" className="mt-3 rounded-full" onClick={()=>setSent(false)}>Kirim Pesan Lain</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold">Nama</label><Input required placeholder="Nama lengkap" /></div>
                  <div><label className="text-xs font-bold">Surel</label><Input required type="email" placeholder="surel@contoh.id" /></div>
                </div>
                <div><label className="text-xs font-bold">Subjek</label><Input required placeholder="Judul pesan" /></div>
                <div><label className="text-xs font-bold">Pesan</label><Textarea required placeholder="Tulis pesanmu…" rows={5} /></div>
                <Button type="submit" disabled={loading} className="rounded-full h-11">{loading ? "Mengirim…" : "Kirim Pesan"}</Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
