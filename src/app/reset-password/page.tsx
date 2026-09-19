"use client"
import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export default function Reset(){
  const [done,setDone]=useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 grid place-items-center p-4 bg-white/5 backdrop-blur/20">
        <div className="w-full max-w-[420px] rounded-[20px] border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-soft">
          <h1 className="text-[20px] font-black tracking-tight text-center">Atur Ulang Kata Sandi</h1>
          {!done ? (
            <form onSubmit={e=>{e.preventDefault(); setDone(true)}} className="mt-6 grid gap-3">
              <div><label className="text-xs font-bold">Kata Sandi Baru</label><Input type="password" required placeholder="••••••••" /></div>
              <div><label className="text-xs font-bold">Konfirmasi Kata Sandi</label><Input type="password" required placeholder="••••••••" /></div>
              <Button type="submit" className="rounded-full h-11 w-full">Atur Ulang Kata Sandi</Button>
            </form>
          ) : (
            <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Kata sandi berhasil diatur ulang!</div>
              <Link href="/login"><Button className="mt-3 rounded-full w-full">Masuk</Button></Link>
            </div>
          )}
        </div>
      </main>
      <Footer /><BottomNav />
    </div>
  )
}
