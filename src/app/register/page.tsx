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

export default function RegisterPage(){
  const [name,setName]=useState("")
  const [password,setPassword]=useState("")
  const [showPass,setShowPass]=useState(false)
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)
  const { signUp } = useApp()
  const router=useRouter()
  const onSubmit= async (e:React.FormEvent)=>{
    e.preventDefault()
    if(!name || !password){ setErr("Nama dan password wajib diisi"); return}
    if(name.trim().length < 3){ setErr("Nama minimal 3 karakter"); return}
    if(password.length<6){ setErr("Password minimal 6 karakter"); return}
    setErr(""); setLoading(true)
    const res = await signUp(name.trim(), password)
    setLoading(false)
    if(res.error){ setErr(res.error); return }
    router.push("/login")
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 grid place-items-center p-4 bg-white/5 backdrop-blur/20">
        <div className="w-full max-w-[420px] rounded-[20px] border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-soft">
          <h1 className="text-[20px] font-black tracking-tight text-center">Buat Akun Baru</h1>
          <p className="text-sm text-muted-foreground text-center">Dukung peleton favoritmu sekarang</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <div><label className="text-xs font-bold">Nama <span className="text-muted-foreground font-normal">(unik, 3-30 karakter)</span></label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Reja123" autoComplete="username" /></div>
            <div>
              <label className="text-xs font-bold">Password</label>
              <div className="relative">
                <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" type={showPass ? "text" : "password"} className="pr-10" autoComplete="new-password" />
                <button type="button" onClick={()=> setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full hover:bg-white/5 backdrop-blur text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Nama tidak boleh sama dengan user lain.</p>
            </div>
            {err && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600">{err}</div>}
            <Button type="submit" disabled={loading} className="rounded-full h-11 w-full">{loading?"Mendaftar…":"Daftar"}</Button>
            <div className="text-center text-xs">Sudah punya akun? <Link href="/login" className="font-bold text-primary hover:underline">Masuk</Link></div>
          </form>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
