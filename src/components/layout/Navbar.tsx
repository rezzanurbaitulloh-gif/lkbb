"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, Heart, User, Trophy, Home, Users, Calendar, Info, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SoundControl } from "./SoundControl"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useApp } from "@/lib/store"

// 4 MENU UTAMA sesuai ATURAN UTAMA: [Beranda, Tim, Kompetisi, Profile] — seragam dengan ikon kiri
const nav = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/tim", label: "Tim", icon: Users },
  { href: "/kompetisi", label: "Kompetisi", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navbar({ siteSettings }: { siteSettings?: Record<string, any> } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState("")
  const { currentUser, isAdmin, logout } = useApp()
  const profileRef = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const lastScroll = useRef(0)
  const ticking = useRef(false)
  useEffect(()=>{
    const onScroll = ()=>{
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(()=>{
        const cur = window.scrollY
        if (cur < 80) { setHidden(false); lastScroll.current = cur; ticking.current=false; return }
        const diff = cur - lastScroll.current
        if (diff > 12) setHidden(true)
        else if (diff < -12) setHidden(false)
        lastScroll.current = cur
        ticking.current=false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return ()=> window.removeEventListener("scroll", onScroll)
  },[])
  const [dynamicSettings, setDynamicSettings] = useState<Record<string, any>>(siteSettings || {})
  useEffect(()=>{
    if(siteSettings && Object.keys(siteSettings).length>0) { setDynamicSettings(siteSettings); return }
    fetch("/api/cms/settings").then(r=> r.json()).then(j=> { if(j.settings) setDynamicSettings(j.settings) }).catch(()=>{})
  },[siteSettings])
  const siteName = (dynamicSettings["site.name"] as string) || "LKBB"
  const siteSubtitle = (dynamicSettings["site.subtitle"] as string) || "JAVASOMA"
  const siteTagline = (dynamicSettings["site.tagline"] as string) || "THE IMPRESSION • 2026"
  const logoUrl = (dynamicSettings["branding.logo"] as string) || "/assets/brand/lkbb-logo.jpg"
  useEffect(()=>{
    const handler = (e: MouseEvent) => {
      if(profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return ()=> document.removeEventListener("mousedown", handler)
  },[])
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
    <header className={`sticky top-0 z-50 w-full border-b border-white/10 bg-background/72 backdrop-blur-[14px] supports-[backdrop-filter]:bg-background/58 transform transition-transform duration-300 will-change-transform ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.5px] bg-gradient-to-r from-transparent via-primary/18 to-transparent" />
      <div className="mx-auto flex h-[56px] sm:h-[58px] lg:h-[60px] max-w-[1280px] items-center justify-between px-3 sm:px-4 md:px-6 gap-2">
        {/* Logo — dynamic from site_settings */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 max-[320px]:h-9 max-[320px]:w-9 bg-transparent flex items-center justify-center shrink-0">
            <img src={logoUrl} alt={siteName} className="h-full w-full object-contain bg-transparent" />
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[14px] sm:text-[15px] font-extrabold tracking-[-0.02em] text-foreground truncate">{siteName.split(" ")[0] || "LKBB"}</span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-primary truncate">{siteSubtitle}</span>
            </div>
            <div className="-mt-1 text-[9px] sm:text-[10px] font-medium tracking-[0.08em] text-muted-foreground truncate max-w-[160px]">{siteTagline}</div>
          </div>
          <span className="sm:hidden text-[13px] font-black tracking-tight truncate max-[360px]:max-w-[90px] max-[320px]:max-w-[70px]">{siteName.split(" ")[0] || "LKBB"}</span>
        </Link>

        {/* Desktop nav - 4 items */}
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map(item=> {
            const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href + "/"))
            return (
              <Link key={item.href} href={item.href} className={cn("rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5 backdrop-blur")}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions — 44px hit area */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button onClick={()=> setSearchOpen(!searchOpen)} aria-label="Cari tim" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/5 backdrop-blur text-muted-foreground hover:text-foreground transition-colors lg:hidden">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link href="/search" className="hidden lg:inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/5 backdrop-blur transition-colors" aria-label="Cari">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
          </Link>
          <SoundControl />
          {currentUser ? (
            <div className="hidden md:flex relative" ref={profileRef}>
              <button
                onClick={()=> setProfileOpen(!profileOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/5 backdrop-blur pl-1 pr-3 py-1 transition-colors"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <div className="h-7 w-7 rounded-full bg-foreground text-background grid place-items-center text-xs font-black">
                  {currentUser.name.slice(0,2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold max-w-[80px] truncate">{currentUser.name.split(" ")[0]}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <div className="text-sm font-bold leading-tight truncate">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
                    {isAdmin && <div className="mt-1 inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-black tracking-widest text-black">admin</div>}
                  </div>
                  <div className="p-1.5 flex flex-col gap-2">
                    <Link href="/profile" onClick={()=> setProfileOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile" ? "bg-primary text-black shadow-sm" : "hover:bg-white/5 backdrop-blur text-muted-foreground hover:text-foreground")}>
                      <User className="h-4 w-4 shrink-0" /> <span>Profile</span>
                    </Link>
                    <Link href="/profile/edit" onClick={()=> setProfileOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile/edit" ? "bg-primary text-black shadow-sm" : "hover:bg-white/5 backdrop-blur text-muted-foreground hover:text-foreground")}>
                      <Settings className="h-4 w-4 shrink-0" /> <span>Pengaturan</span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={()=> setProfileOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-colors", pathname.startsWith("/admin") ? "bg-primary text-black shadow-sm" : "hover:bg-white/5 backdrop-blur text-muted-foreground hover:text-foreground")}>
                        <LayoutDashboard className="h-4 w-4 text-primary shrink-0" /> <span>Dashboard Admin</span>
                      </Link>
                    )}
                  </div>
                  <div className="h-px bg-border mx-1.5" />
                  <div className="p-1.5">
                    <button
                      onClick={async ()=>{ setProfileOpen(false); await logout(); router.push("/"); router.refresh() }}
                      className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 shrink-0" /> <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-flex">
              <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                <User className="h-3.5 w-3.5" /> Masuk
              </Button>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-full border border-white/10 bg-white/5 backdrop-blur shrink-0" aria-label="Menu" onClick={()=> setOpen(true)}>
              <Menu className="h-[18px] w-[18px]" />
            </Button>
            <SheetContent side="right" className="w-[88vw] max-w-[320px] sm:w-[320px] p-0 overflow-hidden">
              <SheetHeader className="p-5 border-b text-left">
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt={siteName} className="h-11 w-11 object-contain bg-transparent" />
                  <div>
                    <SheetTitle className="text-sm font-black">{siteName} {siteSubtitle}</SheetTitle>
                    <div className="text-[11px] tracking-widest text-muted-foreground">{siteTagline}</div>
                  </div>
                </div>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {currentUser ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 backdrop-blur p-3 w-full">
                      <div className="h-10 w-10 rounded-full bg-foreground text-background grid place-items-center text-sm font-black">
                        {currentUser.name.slice(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{currentUser.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
                      </div>
                      {isAdmin && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-black">admin</span>}
                    </div>
                    <Link href="/profile" onClick={()=>setOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile" ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:bg-white/5 backdrop-blur hover:text-foreground")}><User className="h-4 w-4 shrink-0"/> <span>Profile</span></Link>
                    <Link href="/profile/edit" onClick={()=>setOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile/edit" ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:bg-white/5 backdrop-blur hover:text-foreground")}><Settings className="h-4 w-4 shrink-0"/> <span>Pengaturan</span></Link>
                    {isAdmin && <Link href="/admin" onClick={()=>setOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-colors", pathname.startsWith("/admin") ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:bg-white/5 backdrop-blur hover:text-foreground")}><LayoutDashboard className="h-4 w-4 text-primary shrink-0"/> <span>Dashboard Admin</span></Link>}
                    <button onClick={async ()=>{ setOpen(false); await logout(); router.push("/"); router.refresh() }} className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"><LogOut className="h-4 w-4 shrink-0"/> <span>Logout</span></button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/profile" onClick={()=>setOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile" ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:bg-white/5 backdrop-blur hover:text-foreground")}><User className="h-4 w-4 shrink-0"/> <span>Profile</span></Link>
                    <Link href="/profile/edit" onClick={()=>setOpen(false)} className={cn("flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors", pathname==="/profile/edit" ? "bg-primary text-black shadow-sm" : "text-muted-foreground hover:bg-white/5 backdrop-blur hover:text-foreground")}><Settings className="h-4 w-4 shrink-0"/> <span>Pengaturan</span></Link>
                    <Link href="/login" onClick={()=>setOpen(false)}><Button variant="outline" className="w-full rounded-full">Masuk</Button></Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {searchOpen && (
        <div className="lg:hidden absolute inset-x-0 top-0 h-[56px] sm:h-[58px] bg-background border-b border-white/10 flex items-center gap-2 px-3 sm:px-4 animate-[fadeIn_160ms_ease-out]">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              value={mobileSearch}
              onChange={e=> setMobileSearch(e.target.value)}
              placeholder="Cari nama tim..."
              className="h-11 w-full rounded-full border border-white/10 bg-white/5 backdrop-blur pl-9 pr-11 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" aria-label="Cari" className="absolute right-1 h-9 w-9 grid place-items-center rounded-full bg-foreground text-background">
              <Search className="h-4 w-4" />
            </button>
          </form>
          <button onClick={()=> setSearchOpen(false)} aria-label="Tutup pencarian" className="h-11 w-11 grid place-items-center rounded-full border border-white/10 bg-white/5 backdrop-blur shrink-0">✕</button>
        </div>
      )}

    </header>
  )
}
