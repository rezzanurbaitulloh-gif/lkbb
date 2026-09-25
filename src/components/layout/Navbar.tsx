"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, User } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"

const nav = [
  { href: "/", label: "BERANDA" },
  { href: "/tim", label: "TIM" },
  { href: "/kompetisi", label: "EVENT" },
]

const mobileNav = [
  { href: "/", label: "BERANDA", num: "01" },
  { href: "/tim", label: "TIM", num: "02" },
  { href: "/kompetisi", label: "EVENT", num: "03" },
]

export function Navbar({ siteSettings }: { siteSettings?: Record<string, any> } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState("")
  const { currentUser } = useApp()

  // Logo + nama dari pengaturan admin (dinamis) — fallback aset lokal.
  const siteName = (siteSettings?.["site.name"] as string) || "LKBB"
  const logoUrl = (siteSettings?.["branding.logo"] as string) || (siteSettings?.["hero.logo_image"] as string) || "/assets/brand/lkbb-logo.jpg"

  const handleSearchSubmit = (e: React.FormEvent)=>{
    e.preventDefault()
    const q = mobileSearch.trim()
    if(!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setMobileSearch("")
    setSearchOpen(false)
    setOpen(false)
  }

  return (
    <>
      {/* NAVIGASI — Beranda, Tim, Event */}
      <header className="sticky top-0 z-40 w-full border border-white/[0.08] bg-[#0A0A09]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <img src={logoUrl} alt={siteName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <span className="truncate font-display text-[15px] font-bold tracking-tight text-[#F2F0E9]">{siteName}</span>
            <span className="text-[11px] font-bold text-[#D9FF3F]">☀</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Utama">
            {nav.map(item=> {
              const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  className={`text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors ${active ? "text-[#F2F0E9] underline decoration-[#D9FF3F] decoration-1 underline-offset-4" : "text-[#92918C] hover:text-[#F2F0E9]"}`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href={currentUser ? "/profile" : "/login"} aria-label="Profil"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[#F2F0E9] hover:bg-white/5 transition-colors">
              <User className="h-3.5 w-3.5" />
            </Link>
            <button onClick={()=> setSearchOpen(!searchOpen)} aria-label="Cari"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[#F2F0E9] hover:bg-white/5 transition-colors">
              <Search className="h-3.5 w-3.5" />
            </button>
            <button onClick={()=> setOpen(!open)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] md:hidden" aria-label="Menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button onClick={()=> setOpen(true)} className="hidden h-8 w-8 place-items-center rounded-full border border-white/[0.08] md:grid" aria-label="Menu">
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-white/[0.08] bg-[#0A0A09]">
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3 sm:px-6">
              <input
                autoFocus
                value={mobileSearch}
                onChange={e=> setMobileSearch(e.target.value)}
                placeholder="Cari nama tim..."
                className="h-9 flex-1 rounded-full border border-white/[0.08] bg-white/5 px-4 text-sm text-[#F2F0E9] placeholder:text-[#92918C] focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
              />
              <button type="submit" className="h-9 rounded-full bg-[#D9FF3F] px-4 text-xs font-bold text-black">Cari</button>
              <button type="button" onClick={()=> setSearchOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08]" aria-label="Tutup">✕</button>
            </form>
          </div>
        )}
      </header>

      {/* MENU SELULER (LAYAR PENUH) */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A09]">
          <div className="mx-auto flex h-[52px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
            <span className="flex items-center gap-2 font-display text-[15px] font-bold">
              <img src={logoUrl} alt={siteName} className="h-7 w-7 rounded-full object-cover" />
              {siteName} <span className="text-[11px] text-[#D9FF3F]">☀</span>
            </span>
            <button onClick={()=> setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08]" aria-label="Tutup"><X className="h-4 w-4" /></button>
          </div>
          <nav className="mx-auto w-full max-w-[1280px] flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {mobileNav.map(item=> {
              const active = pathname===item.href
              return (
                <Link key={item.href} href={item.href} onClick={()=> setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-white/[0.06] py-3.5">
                  <span className="font-body text-[11px] font-medium text-[#92918C]">{item.num}</span>
                  <span className={`font-display text-[15px] font-semibold tracking-wide ${active ? "text-[#D9FF3F]" : "text-[#92918C]"}`}>{item.label}</span>
                </Link>
              )
            })}
            <div className="relative mt-6 h-[180px] overflow-hidden rounded-xl border border-white/[0.08]">
              <img src="/assets/poster/lkbb-poster.jpg" alt={siteName} className="h-full w-full object-cover opacity-70 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-[10px] font-bold tracking-[0.14em] text-[#D9FF3F]">{siteName}</div>
                <div className="font-display text-sm font-bold text-white">{(siteSettings?.["site.tagline"] as string) || "SUARAMU ADALAH KEKUATAN."}</div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
