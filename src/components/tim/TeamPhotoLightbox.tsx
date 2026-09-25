"use client"
import { useCallback, useEffect, useState } from "react"
import { X, ZoomIn } from "lucide-react"

export function TeamPhotoLightbox({ src, alt }: { src: string; alt: string }){
  const [open, setOpen] = useState(false)
  const close = useCallback(()=> setOpen(false),[])
  useEffect(()=>{
    if(!open) return
    const onKey = (e: KeyboardEvent)=>{ if(e.key==="Escape") close() }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return ()=>{ window.removeEventListener("keydown", onKey); document.body.style.overflow = "" }
  },[open, close])
  return (
    <>
      <button onClick={()=> setOpen(true)} aria-label={`Buka foto ${alt} ukuran penuh`} className="group relative block w-full cursor-zoom-in">
        <div className="relative aspect-[16/8] overflow-hidden rounded-xl border border-white/[0.08] bg-black">
          <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
          <img src={src} alt={alt} className="relative h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 border border-white/15 text-white backdrop-blur transition group-hover:scale-110" aria-hidden>
            <ZoomIn className="h-4 w-4" />
          </span>
        </div>
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Foto ${alt}`} onClick={close}>
          <button onClick={close} aria-label="Tutup foto" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <img src={src} alt={alt} onClick={e=> e.stopPropagation()} className="max-h-[90vh] max-w-[94vw] rounded-xl border border-white/15 object-contain shadow-2xl" />
        </div>
      )}
    </>
  )
}
