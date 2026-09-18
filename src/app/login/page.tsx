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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="container-editorial grid lg:grid-cols-[0.9fr_1.1fr] gap-12 py-12 lg:py-16">
          <div>
            <div className="meta-label">Account — LKBB 2026</div>
            <h1 className="mt-2 font-display font-bold text-[36px] lg:text-[48px] leading-[0.9] tracking-[-0.03em]">
              MASUK<br />KE AKUN.
            </h1>
            <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-muted-foreground">
              Lanjutkan perjalanan dukunganmu. Satu akun untuk semua event.
            </p>
            <div className="mt-8 hidden lg:block hairline" />
            <div className="mt-6 hidden lg:block text-xs leading-relaxed text-muted-foreground max-w-[320px]">
              Admin: SACENGMIN / Saceng1! — Demo: jap / 121212 — User baru daftar dengan Nama unik + Password.
            </div>
          </div>

          <div className="border border-border p-6 lg:p-8">
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label className="meta-label">Nama</label>
                <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama akun kamu (unik)" autoComplete="username" className="mt-2 h-11 rounded-none border-border bg-transparent" />
              </div>
              <div>
                <label className="meta-label">Password</label>
                <div className="relative mt-2">
                  <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type={showPass ? "text" : "password"} className="pr-10 h-11 rounded-none border-border bg-transparent" autoComplete="current-password" />
                  <button type="button" onClick={()=> setShowPass(!showPass)} aria-label={showPass ? "Sembunyikan password" : "Lihat password"} className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center hover:bg-muted">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {err && <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive">{err}</div>}
              <Button type="submit" disabled={loading} className="h-11 rounded-none w-full font-bold tracking-wide">{loading?"Memproses…":"Masuk →"}</Button>
              <div className="flex justify-between text-xs">
                <Link href="/forgot-password" className="font-semibold hover:underline">Lupa password?</Link>
                <Link href="/register" className="font-semibold text-primary hover:underline">Daftar →</Link>
              </div>
            </form>
            <div className="hairline my-6" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-none border-border" type="button" onClick={()=>{setName("SACENGMIN"); setPassword("Saceng1!")}}>Isi Admin</Button>
              <Button variant="outline" className="rounded-none border-border" type="button" onClick={()=>{setName("jap"); setPassword("121212")}}>Isi Demo</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
