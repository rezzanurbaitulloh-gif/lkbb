"use client"
import Link from "next/link"
import { useState } from "react"
import { Heart, Share2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { ShareSheet } from "@/components/share/ShareSheet"

export function PeletonCard({ peleton, eager = false }: { peleton: any; eager?: boolean }){
  const { toggleFavorite, isFavorite } = useApp()
  const { toast } = useToast()
  const fav = isFavorite(peleton.id)
  const photo = peleton.image_url || peleton.image
  const logo = peleton.logo_url || peleton.image_url || peleton.image
  const number = peleton.number
  const name = peleton.name
  const slug = peleton.slug
  const category = peleton.category
  const profileUrl = `/tim/${slug}`
  const supportUrl = `/dukungan?peleton=${slug}`

  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const handleShare = async (type: "profile" | "support") => {
    const url = `${window.location.origin}${type === "profile" ? profileUrl : supportUrl}`
    const title = type==="profile" ? `Profil ${name}` : `Dukung ${name} di LKBB Javasoma`
    // Try native share first
    if (navigator.share) {
      try { await navigator.share({ title, url }); toast({ title: "Berhasil dibagikan", variant: "success" }); return } catch {}
    }
    // Fallback to custom sheet with QR
    setShareUrl(url)
    setShareTitle(title)
    setShareOpen(true)
  }

  const handleFav = ()=>{
    toggleFavorite(peleton.id)
    toast({ title: fav ? "Dihapus dari favorit" : "Ditambahkan ke favorit", description: name })
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[14px] xs:rounded-[16px] border border-white/10 bg-white/5 backdrop-blur max-w-full">
      <div className="absolute top-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-500" />
      <Link href={profileUrl} className="block">
        <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-white/5 backdrop-blur">
          {!imgLoaded && !imgError && <div className="absolute inset-0 animate-pulse bg-white/5 backdrop-blur" />}
          {!imgError && photo ? (
            <img
              src={photo}
              alt={name}
              className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={eager ? "high" as any : "auto"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : null}
          {imgError || !photo ? (
            <div className="absolute inset-0 grid place-items-center bg-white/5 backdrop-blur p-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-20 w-20 xs:h-24 xs:w-24 rounded-full bg-white/5 border border-white/10 grid place-items-center p-3">
                  <img src={logo} alt={`${name} logo`} className="h-full w-full object-contain opacity-90" />
                </div>
                <div className="text-[11px] font-bold tracking-[0.16em] text-primary">#{number} • {category}</div>
                <div className="text-xs font-bold text-white/60 line-clamp-1">{name}</div>
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(rgba(201,168,106,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,106,0.5) 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />
          <div className="absolute left-2 xs:left-3 top-2 xs:top-3 rounded-full bg-black/70 backdrop-blur px-1.5 xs:px-2.5 py-0.5 text-[10px] xs:text-[11px] font-black tracking-widest text-white border border-white/10">
            #{number}
          </div>
          <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); handleFav(); }} aria-label={fav ? "Hapus dari favorit" : "Tambah ke favorit"} aria-pressed={fav} className={cn("absolute right-2 xs:right-3 top-2 xs:top-3 h-11 w-11 grid place-items-center rounded-full backdrop-blur border transition-colors", fav ? "bg-[#A51D2D] border-[#A51D2D] text-white" : "bg-black/40 border-white/15 text-white hover:bg-black/60")}>
            <Heart className={cn("h-[18px] w-[18px]", fav && "fill-white")} />
          </button>
          <div className="absolute bottom-2 xs:bottom-3 right-2 xs:right-3 rounded-full bg-primary border border-primary px-1.5 xs:px-2.5 py-0.5 text-[9px] xs:text-[10px] font-bold tracking-widest text-black max-w-[42%] xs:max-w-[45%] truncate">
            {category}
          </div>
        </div>
        <div className="flex flex-col p-2.5 xs:p-3 sm:p-4 pb-2">
          <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] xs:text-[14px] sm:text-[15px] font-black leading-tight tracking-tight text-foreground line-clamp-2 text-balance break-words">{name}</h3>
              <p className="text-[11px] xs:text-[11px] sm:text-[12px] font-medium text-muted-foreground line-clamp-1 break-words">{peleton.school || ""}</p>
            </div>
            <img src={logo} alt="logo" className="h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 object-contain bg-transparent shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }} />
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-2 p-2.5 xs:p-3 sm:p-4 pt-2">
        <Link href={supportUrl} className="block">
          <Button variant="outline" size="sm" className="w-full rounded-full h-11 text-[13px] xs:text-sm font-bold tracking-wide border-white/10 bg-white/5 text-white hover:bg-white/5 hover:border-primary/30 hover:text-white">DUKUNG</Button>
        </Link>
        <div className="grid grid-cols-2 gap-1.5 xs:gap-2">
          <Button variant="outline" className="rounded-full h-11 w-full border-white/10 bg-white/5 text-white hover:bg-white/5 hover:text-white hover:border-white/15" onClick={() => handleShare("profile")} aria-label="Bagikan Profil">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-full h-11 w-full border-white/10 bg-white/5 text-white hover:bg-white/5 hover:text-white hover:border-white/15" onClick={() => handleShare("support")} aria-label="Bagikan Dukungan">
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} url={shareUrl} title={shareTitle} />
    </div>
  )
}

// Compact variant for /tim — only #number, name, logo, ordered by total_ballots but number stays original (no rank)
export function PeletonCardCompact({ peleton, showPoints }: { peleton: any, showPoints?: boolean }){
  const logo = peleton.logo_url || peleton.image_url || peleton.image
  return (
    <Link href={`/dukungan?peleton=${peleton.slug}`} className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-4 hover:bg-white/5 backdrop-blur/50 transition-colors min-w-0">
      <div className="h-11 w-11 bg-transparent grid place-items-center shrink-0">
        <img src={logo} alt={peleton.name} className="h-full w-full object-contain bg-transparent" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-[11px] font-bold tracking-[0.12em] text-primary truncate">#{peleton.number}</div>
        <div className="text-sm font-black leading-tight truncate">{peleton.name}</div>
        <div className="text-xs text-muted-foreground truncate">{peleton.school}</div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className="inline-flex rounded-full bg-white/5 backdrop-blur px-2.5 py-1 text-xs font-black">#{peleton.number}</div>
        {showPoints && peleton.total_ballots != null && <div className="mt-1 text-xs font-black tabular-nums">{Number(peleton.total_ballots).toLocaleString("id-ID")} dukungan</div>}
      </div>
    </Link>
  )
}
