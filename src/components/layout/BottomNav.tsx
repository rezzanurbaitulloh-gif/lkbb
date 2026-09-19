"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

// 4 MENU UTAMA: Beranda / Tim / Event / Profil
const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/tim", label: "Tim", icon: Users },
  { href: "/kompetisi", label: "Event", icon: Trophy },
  { href: "/profile", label: "Profil", icon: User },
]

export function BottomNav(){
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/92 backdrop-blur-xl md:hidden pb-safe overflow-hidden max-w-[100vw]">
      <div className="grid grid-cols-4 max-w-[100vw]">
        {items.map(({href,label,icon:Icon})=>{
          const active = path===href || (href!=="/" && path.startsWith(href))
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-medium min-w-0 px-1", active ? "text-foreground" : "text-muted-foreground")}>
              <Icon className={cn("h-[18px] w-[18px] sm:h-5 sm:w-5 max-[320px]:h-4 max-[320px]:w-4 shrink-0", active && "text-primary")} strokeWidth={active?2.2:1.8} />
              <span className={cn("tracking-wide truncate max-w-full leading-none", active && "font-bold")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
