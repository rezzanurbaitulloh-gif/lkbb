"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ShareSheet } from "@/components/share/ShareSheet"
import { Share2, QrCode } from "lucide-react"

/* Varian ikon kompak untuk kartu tim (ala PeletonCard lkbbvoting) */
export function TeamShareIcons({ slug, name, param = "peleton" }: { slug: string; name: string; param?: string }){
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const share = async (type: "profile"|"support")=>{
    const path = type==="profile" ? `/tim/${slug}` : `/dukungan?${param}=${slug}`
    const full = window.location.origin + path
    const t = type==="profile" ? `Profil ${name}` : `Dukung ${name} di LKBB Javasoma`
    if(navigator.share){
      try { await navigator.share({ title: t, url: full }); toast({ title: "Berhasil dibagikan", variant: "success" }); return } catch {}
    }
    setUrl(full); setTitle(t); setOpen(true)
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={()=> share("profile")} aria-label={`Bagikan profil ${name}`}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="rounded-full h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/15" onClick={()=> share("support")} aria-label={`Bagikan dukungan ${name}`}>
          <QrCode className="h-4 w-4" />
        </Button>
      </div>
      <ShareSheet open={open} onOpenChange={setOpen} url={url} title={title} />
    </>
  )
}

export function ShareButtons({ profileUrl, supportUrl, teamName }: { profileUrl: string; supportUrl: string; teamName?: string }){
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const share = async (type: "profile"|"support")=>{
    const full = window.location.origin + (type==="profile" ? profileUrl : supportUrl)
    const t = type==="profile" ? (teamName ? `Profil ${teamName}` : "Profil Tim JAWASOMA") : (teamName ? `Dukung ${teamName} di JAWASOMA` : "Dukung Tim di JAWASOMA")
    if(navigator.share){
      try { await navigator.share({ title: t, url: full }); toast({ title: "Berhasil dibagikan", variant: "success" }); return } catch {}
    }
    setUrl(full); setTitle(t); setOpen(true)
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="rounded-full h-10 border border-white/10 bg-white/5 text-white hover:bg-white/5 hover:text-white hover:border-white/15" onClick={()=> share("profile")}>Bagikan Profil</Button>
        <Button variant="outline" className="rounded-full h-10 border border-white/10 bg-white/5 text-white hover:bg-white/5 hover:text-white hover:border-white/15" onClick={()=> share("support")}>Bagikan Dukungan</Button>
      </div>
      <ShareSheet open={open} onOpenChange={setOpen} url={url} title={title} />
    </>
  )
}