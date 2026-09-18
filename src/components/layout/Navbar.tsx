"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, User } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"

const nav = [
  { href: "/kompetisi", label: "EVENT" },
  { href: "/tim", label: "PARTICIPANTS" },
  { href: "/dukungan", label: "VOTING" },
  { href: "/profile", label: "RESULTS" },
]

const mobileNav = [
  { href: "/", label: "HOME", num: "01" },
  { href: "/tim", label: "PARTICIPANTS", num: "02" },
  { href: "/kompetisi", label: "EVENT", num: "03" },
  { href: "/profile", label: "PROFILE", num: "04" },
  { href: "/dukungan", label: "SUPPORT", num: "05" },
]

export function Navbar({ siteSettings }: { siteSettings?: Record<string, any> } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState("")
  const { currentUser } = useApp()

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
      {/* NAVIGATION (DESKTOP) — plek PNG: LKBB* kiri, EVENT PARTICIPANTS VOTING RESULTS tengah, ikon kanan */}
      <header className="sticky top-0 z-40 w-full border border-white/[0.08] bg-[#0A0A09]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-display text-[15px] font-bold tracking-tight text-[#F2F0E9]">LKBB</span>
            <span className="text-[11px] font-bold text-[#D9FF3F]">☀</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
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
            <Link href={currentUser ? "/profile" : "/login"} aria-label="Profile"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[#F2F0E9] hover:bg-white/5 transition-colors">
              <User className="h-3.5 w-3.5" />
            </Link>
            <button onClick={()=> setSearchOpen(!searchOpen)} aria-label="Search"
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
              <button type="button" onClick={()=> setSearchOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08]">✕</button>
            </form>
          </div>
        )}
      </header>

      {/* MOBILE MENU (FULL SCREEN) — plek PNG */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A09]">
          <div className="mx-auto flex h-[52px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
            <span className="font-display text-[15px] font-bold">LKBB <span className="text-[11px] text-[#D9FF3F]">☀</span></span>
            <button onClick={()=> setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08]" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <nav className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
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
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60" alt="Peleton" className="h-full w-full object-cover opacity-70 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-[10px] font-bold tracking-[0.14em] text-[#D9FF3F]">LKBB 2026</div>
                <div className="font-display text-sm font-bold text-white">THE CROWD HAS A VOICE.</div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
