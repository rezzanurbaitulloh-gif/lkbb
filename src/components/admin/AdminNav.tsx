"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Users, CreditCard, Trophy, Megaphone, Calendar, Star, Handshake, Settings, ScrollText, UserCog, Menu, FileText, Shield, Layers } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { EventSwitcher } from "./EventSwitcher"

const nav = [
  { href:"/admin", label:"Dashboard", icon: LayoutDashboard },
  // Dynamic CMS — baru (media manager dihapus sesuai permintaan)
  { href:"/admin/cms", label:"Konten Dinamis", icon: Layers },
  { href:"/admin/peleton", label:"Peleton", icon: Users },
  { href:"/admin/transaksi", label:"Transaksi", icon: CreditCard },
  { href:"/admin/klasemen", label:"Klasemen", icon: Trophy },
  { href:"/admin/offline-recap", label:"Rekap Offline", icon: FileText },
  { href:"/admin/pengumuman", label:"Pengumuman", icon: Megaphone },
  { href:"/admin/timeline", label:"Jadwal", icon: Calendar },
  { href:"/admin/juri", label:"Juri", icon: Star },
  { href:"/admin/sponsor", label:"Sponsor", icon: Handshake },
  { href:"/admin/users", label:"Pengguna", icon: UserCog },
  { href:"/admin/settings", label:"Pengaturan", icon: Settings },
  { href:"/admin/audit-log", label:"Riwayat", icon: ScrollText },
]

// Grouping for sidebar (tanpa design studio)
const navCms = nav.slice(0,2) // Dashboard, CMS
const navKompetisi = nav.slice(2,8) // peleton, transaksi, klasemen, pengumuman, timeline, juri, sponsor
const navSistem = nav.slice(8) // users, settings, audit-log

export function AdminNav({ children }: { children: React.ReactNode }){
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => {
    if (href === "/admin") return path === "/admin"
    return path === href || path.startsWith(href + "/")
  }
  return (
    <div className="min-h-screen bg-white/[0.04] backdrop-blur/20 flex">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.03] backdrop-blur">
        <div className="h-[64px] flex items-center justify-center gap-3 px-5 border-b border-white/[0.06] text-center">
          <img src="/assets/brand/lkbb-logo.jpg" alt="LKBB" className="h-11 w-11 object-contain bg-transparent" />
          <div className="text-center">
            <div className="text-sm font-black leading-none text-center">LKBB ADMIN</div>
            <div className="text-[11px] tracking-widest text-muted-foreground text-center">JAVASOMA 2026</div>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <EventSwitcher />
        </div>
        <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold tracking-widest text-muted-foreground">CMS DINAMIS</div>
          {navCms.map(item=> {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${active ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white" : "hover:bg-white/[0.04] backdrop-blur text-muted-foreground hover:text-foreground"}`}>
                <item.icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="mt-3 h-px bg-border" />
          <div className="px-2 pt-3 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground">KOMPETISI</div>
          {navKompetisi.map(item=> {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${active ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white" : "hover:bg-white/[0.04] backdrop-blur text-muted-foreground hover:text-foreground"}`}>
                <item.icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="mt-3 h-px bg-border" />
          <div className="px-2 pt-3 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground">SISTEM</div>
          {navSistem.map(item=> {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${active ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white" : "hover:bg-white/[0.04] backdrop-blur text-muted-foreground hover:text-foreground"}`}>
                <item.icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="px-4 sm:px-6 py-3 border-t border-white/[0.06]">
          <Link href="/" className="flex w-full items-center justify-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur px-3 py-2.5 text-left text-xs font-bold">← Kembali ke Website</Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 h-[56px] flex items-center justify-between px-4 border-b border-white/[0.06] bg-white/[0.03] backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=> setOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <SheetContent side="left" className="w-full max-w-[280px] sm:max-w-[300px] left-0 p-0 overflow-hidden">
                <SheetHeader className="p-5 border-b">
                  <div className="flex items-center justify-center gap-3 text-center">
                    <img src="/assets/brand/lkbb-logo.jpg" alt="LKBB" className="h-11 w-11 object-contain bg-transparent" />
                    <div className="text-center">
                      <SheetTitle className="text-sm font-black leading-none text-center">LKBB ADMIN</SheetTitle>
                      <div className="text-[11px] tracking-widest text-muted-foreground text-center">JAVASOMA 2026</div>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-1">
                  {nav.map(item=> {
                    const active = isActive(item.href)
                    return (
                      <Link key={item.href} href={item.href} onClick={()=> setOpen(false)} className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${active ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white" : "hover:bg-white/[0.04] backdrop-blur text-muted-foreground hover:text-foreground"}`}>
                        <item.icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="px-4 sm:px-6 py-3 border-t">
                  <Link href="/" onClick={()=> setOpen(false)} className="flex w-full items-center justify-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur px-3 py-2.5 text-left text-xs font-bold">← Kembali ke Website</Link>
                </div>
              </SheetContent>
            </Sheet>
            <img src="/assets/brand/lkbb-logo.jpg" alt="" className="h-10 w-10 object-contain bg-transparent" />
            <span className="text-sm font-black">ADMIN LKBB</span>
          </div>
          <Link href="/" className="text-xs font-bold border border-white/[0.06] rounded-full px-3 py-1">Website →</Link>
        </header>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
