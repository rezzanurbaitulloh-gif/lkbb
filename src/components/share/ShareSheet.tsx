"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Copy, Check, Share2 } from "lucide-react"

export function ShareSheet({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  url: string
  title: string
}){
  const { toast } = useToast()
  const [qr, setQr] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    if(!open || !url) return
    import("qrcode").then(mod=>{
      mod.toDataURL(url, { width: 220, margin: 1, color:{ dark:"#050403", light:"#FFFFFF"} }).then(setQr).catch(()=>{})
    })
  },[open, url])

  const handleCopy = async ()=>{
    try{
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title:"Tautan disalin", description:url, variant:"success"})
      setTimeout(()=> setCopied(false), 2000)
    } catch{
      toast({ title:"Gagal menyalin", description:url, variant:"error"})
    }
  }

  const handleNativeShare = async ()=>{
    if(navigator.share){
      try{
        await navigator.share({ title, url })
        toast({ title:"Berhasil dibagikan", variant:"success"})
        onOpenChange(false)
        return
      } catch{}
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden gap-0">
        <div className="bg-[#050403] text-white p-5">
          <DialogHeader>
            <DialogTitle className="text-white text-[16px] font-black">Bagikan</DialogTitle>
            <DialogDescription className="text-white/60">Pilih cara berbagi tautan ini</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-4">
          <Button className="w-full rounded-full h-11 gap-2" onClick={handleNativeShare}>
            <Share2 className="h-4 w-4" /> Bagikan via Perangkat
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">atau</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/70">Tautan</label>
            <div className="mt-1 flex gap-2">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur/30 px-3 py-2.5 text-xs break-all text-white/80">{url}</div>
              <Button variant="outline" size="sm" className="rounded-full shrink-0 h-10 px-4 gap-1.5" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Disalin" : "Salin"}
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white p-4 flex flex-col items-center">
            <div className="text-xs font-bold tracking-wide text-black/60">QR CODE</div>
            {qr ? <img src={qr} alt="QR" className="mt-3 h-[180px] w-[180px] object-contain" /> : <div className="mt-3 h-[180px] w-[180px] grid place-items-center text-xs text-black/40">Memuat QR...</div>}
            <div className="mt-2 text-[11px] text-black/60 text-center break-all px-2">{title}</div>
          </div>
          <p className="text-[11px] text-white/40 text-center">Scan QR untuk membuka tautan di perangkat lain.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useShare(){
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{url:string,title:string}>({url:"",title:""})
  const share = async (url:string, title:string)=>{
    const fullUrl = url.startsWith("http") ? url : window.location.origin + url
    if(navigator.share){
      try{
        await navigator.share({ title, url: fullUrl })
        return { shared:true }
      } catch{}
    }
    setData({ url: fullUrl, title })
    setOpen(true)
    return { shared:false }
  }
  return { share, ShareSheet: (props:any)=> <ShareSheet open={open} onOpenChange={setOpen} url={data.url} title={data.title} {...props} />, open, setOpen, data }
}