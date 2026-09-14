"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage(){
  const [name,setName]=useState("")
  const [password,setPassword]=useState("")
  const [showPass,setShowPass]=useState(false)
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)
  const { login } = useApp()
  const router = useRouter()
  const onSubmit= async (e:React.FormEvent)=>{
    e.preventDefault()
    if(!name || !password){ setErr("Nama dan password wajib diisi"); return }
    setErr(""); setLoading(true)
    const res = await login(name, password)
    setLoading(false)
    if(res.error){ setErr(res.error); return }
    router.push("/profile")
    router.refresh()
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 grid place-items-center p-4 bg-white/5 backdrop-blur/20">
        <div className="w-full max-w-[420px] rounded-[20px] border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-soft">
          <div className="text-center">
            <img src="/assets/brand/lkbb-logo.jpg" alt="LKBB" className="mx-auto h-16 w-16 sm:h-20 sm:w-20 object-contain bg-transparent" />
            <h1 className="mt-3 text-[20px] font-black tracking-tight">Masuk ke Akun</h1>
            <p className="text-sm text-muted-foreground">Lanjutkan perjalanan dukunganmu</p>
          </div>
          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <div><label className="text-xs font-bold">Nama</label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama akun kamu (unik)" autoComplete="username" /></div>
            <div>
              <label className="text-xs font-bold">Password</label>
              <div className="relative">
                <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} className="pr-10" autoComplete="current-password" />
                <button type="button" onClick={()=> setShowPass(!showPass)} aria-label={showPass ? "Sembunyikan password" : "Lihat password"} className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 grid place-items-center rounded-full hover:bg-white/5 backdrop-blur text-muted-foreground">
                  {showPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>
            {err && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600">{err}</div>}
            <Button type="submit" disabled={loading} className="rounded-full h-11 w-full">{loading?"Memproses…":"Masuk"}</Button>
            <div className="flex justify-between text-xs">
              <Link href="/forgot-password" className="font-semibold hover:underline">Lupa password?</Link>
              <Link href="/register" className="font-semibold text-primary hover:underline">Daftar</Link>
            </div>
          </form>
          <div className="hairline my-6" />
          <div className="text-center text-xs text-muted-foreground">Admin: SACENGMIN / Saceng1! — Demo: jap / 121212 — User baru daftar dengan Nama unik + Password.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full" type="button" onClick={()=>{setName("SACENGMIN"); setPassword("Saceng1!")}}>Isi Admin</Button>
            <Button variant="outline" className="rounded-full" type="button" onClick={()=>{setName("jap"); setPassword("121212")}}>Isi Demo</Button>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
