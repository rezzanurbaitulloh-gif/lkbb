"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Users, CreditCard, Trophy, Megaphone, Calendar, Star, Handshake, Settings, ScrollText, UserCog, Menu, FileText, Shield, Layers, ClipboardList, BookOpen, Globe2, LayoutTemplate } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { EventSwitcher } from "./EventSwitcher"
import { ACCESS_MATRIX, canAccessSection, type AdminSectionKey } from "@/lib/permissions"

const ICONS: Record<AdminSectionKey, any> = {
  dashboard: LayoutDashboard,
  cms: Layers,
  peleton: Users,
  transaksi: CreditCard,
  klasemen: Trophy,
  results: ClipboardList,
  "offline-recap": FileText,
  pengumuman: Megaphone,
  timeline: Calendar,
  juri: Star,
  sponsor: Handshake,
  access: Shield,
  users: UserCog,
  settings: Settings,
  "audit-log": ScrollText,
  roles: BookOpen,
  events: Globe2,
  templates: LayoutTemplate,
}

const GROUP_ORDER = ["RINGKASAN", "KOMPETISI", "KONTEN", "AKSES", "SISTEM", "PLATFORM"] as const

export function AdminNav({ children, isSuper, role, events }: {
  children: React.ReactNode
  isSuper: boolean
  role: string | null
  events: { id: string; slug: string; name: string }[]
}){
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => {
    if (href === "/admin") return path === "/admin"
    return path === href || path.startsWith(href + "/")
  }

  // Menu difilter matriks: ADMIN hanya melihat seksi event sendiri.
  const visible = ACCESS_MATRIX.filter((s) => canAccessSection(s.key, isSuper))
  const groups = GROUP_ORDER.map((g) => ({ name: g, items: visible.filter((s) => s.group === g) })).filter((g) => g.items.length > 0)
  const flat = visible.map((s) => ({ href: s.href, label: s.label, icon: ICONS[s.key] }))

  const scopeLabel = isSuper ? "Semua event" : `Event sendiri${events.length > 1 ? ` (${events.length})` : ""}`
  const ownEventName = !isSuper && events.length === 1 ? events[0].name : null

  const renderLinks = (items: { href: string; label: string; icon: any }[], onNav?: () => void) => (
    <>
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link key={item.href} href={item.href} onClick={onNav} className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${active ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white" : "hover:bg-white/[0.04] backdrop-blur text-muted-foreground hover:text-foreground"}`}>
            <item.icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )

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
        <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] space-y-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest ${isSuper ? "bg-primary text-black" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"}`}>
            {isSuper ? "SUPER ADMIN" : `ADMIN • ${scopeLabel.toUpperCase()}`}
          </div>
          {isSuper ? (
            <EventSwitcher />
          ) : ownEventName ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-bold truncate" title={ownEventName}>
              {ownEventName}
            </div>
          ) : null}
        </div>
        <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-1">
          {groups.map((g, gi) => (
            <div key={g.name}>
              {gi > 0 && <div className="mt-3 h-px bg-border" />}
              <div className="px-2 pt-3 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground">{g.name}</div>
              {renderLinks(g.items.map((s) => ({ href: s.href, label: s.label, icon: ICONS[s.key] })))}
            </div>
          ))}
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
                      <div className="text-[11px] tracking-widest text-muted-foreground text-center">{isSuper ? "SUPER ADMIN" : "ADMIN EVENT"}</div>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-1 max-h-[70vh]">
                  {renderLinks(flat, ()=> setOpen(false))}
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
