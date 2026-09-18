"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/lib/store"

const nav = [
  { href: "/", label: "Beranda" },
  { href: "/tim", label: "Tim" },
  { href: "/kompetisi", label: "Kompetisi" },
  { href: "/profile", label: "Profile" },
]

export function Navbar({ siteSettings }: { siteSettings?: Record<string, any> } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState("")
  const { currentUser } = useApp()

  const siteName = (siteSettings?.["site.name"] as string) || "LKBB"
  const logoUrl = (siteSettings?.["branding.logo"] as string) || "/assets/brand/lkbb-logo.jpg"

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
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="container-editorial flex h-[52px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoUrl} alt={siteName} className="h-7 w-7 object-contain" />
            <span className="hidden sm:inline font-display font-bold tracking-[-0.02em] text-sm">{siteName} <span className="font-normal text-muted-foreground">The Impression</span></span>
            <span className="sm:hidden font-display font-bold text-sm">LKBB</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {nav.map(item=> {
              const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href + "/"))
              return (
                <Link key={item.href} href={item.href} className={`text-xs font-bold tracking-[0.12em] uppercase transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={()=> setSearchOpen(!searchOpen)} aria-label="Cari" className="h-8 w-8 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors">
              <Search className="h-3.5 w-3.5" />
            </button>
            <Link href={currentUser ? "/profile" : "/login"} className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-bold tracking-wide hover:bg-muted transition-colors">
              <User className="h-3 w-3" /> {currentUser ? currentUser.name.split(" ")[0] : "Masuk"}
            </Link>
            <button onClick={()=> setOpen(!open)} className="md:hidden h-8 w-8 grid place-items-center border border-border" aria-label="Menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={handleSearchSubmit} className="container-editorial flex items-center gap-2 py-3">
              <input
                autoFocus
                value={mobileSearch}
                onChange={e=> setMobileSearch(e.target.value)}
                placeholder="Cari nama tim..."
                className="flex-1 h-9 rounded-full border border-border bg-muted px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button type="submit" className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold">Cari</button>
              <button type="button" onClick={()=> setSearchOpen(false)} className="h-9 w-9 grid place-items-center border border-border">✕</button>
            </form>
          </div>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container-editorial flex h-[52px] items-center justify-between border-b border-border">
            <span className="font-display font-bold">LKBB</span>
            <button onClick={()=> setOpen(false)} className="h-8 w-8 grid place-items-center border border-border"><X className="h-4 w-4" /></button>
          </div>
          <nav className="container-editorial py-8 flex flex-col gap-6">
            {nav.map((item, i)=> (
              <Link key={item.href} href={item.href} onClick={()=> setOpen(false)} className="flex items-baseline gap-4 border-b border-border pb-4">
                <span className="text-xs font-bold text-muted-foreground">0{i+1}</span>
                <span className="font-display font-bold text-[28px] tracking-[-0.02em]">{item.label}</span>
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              {!currentUser && <Link href="/login" onClick={()=> setOpen(false)} className="h-11 grid place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">Masuk</Link>}
              {currentUser && <Link href="/profile" onClick={()=> setOpen(false)} className="h-11 grid place-items-center border border-border text-sm font-bold">Profile</Link>}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
