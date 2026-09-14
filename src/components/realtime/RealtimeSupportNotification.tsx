"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { createBrowserSupabase } from "@/lib/supabase"
import { useApp } from "@/lib/store"
import { playNotificationSequence, requestUnlockOnInteraction, canPlayNow, isReducedMotion, getSoundEnabled, unlockAudio } from "@/lib/sound"
import { X, PartyPopper, Sparkles } from "lucide-react"
import Link from "next/link"

type QueueItem = {
  id: string
  supporterName: string
  supporterAvatar?: string | null
  peletonName: string
  peletonSlug: string
  isPrivate: boolean
  ballotQuantity?: number
  ttsText: string
  displayText: string
}

// Premium compact pop-up matching referensidesain.png
function SupportPopup({ item, onClose }: { item: QueueItem; onClose: () => void }){
  const reduced = isReducedMotion()
  const [exploding, setExploding] = useState(!reduced)
  useEffect(()=>{
    if(reduced) return
    const t = setTimeout(()=> setExploding(false), 900)
    return ()=> clearTimeout(t)
  },[reduced])
  // Auto-close after 6s
  useEffect(()=>{
    const t = setTimeout(onClose, 6000)
    return ()=> clearTimeout(t)
  },[onClose])

  return (
    <div
      className={`relative w-[420px] max-w-[90vw] md:w-[480px] rounded-[20px] border border-primary/20 bg-gradient-to-br from-[#1A1208] to-[#0B0C0F] text-white shadow-2xl overflow-hidden ${reduced ? "" : "animate-in zoom-in-95 duration-300"} `}
      style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,106,0.15)"}}
      role="status"
      aria-live="polite"
    >
      {/* Explosion overlay */}
      {exploding && !reduced && (
        <div className="absolute inset-0 pointer-events-none grid place-items-center bg-primary/10 animate-pulse">
          <div className="text-4xl animate-bounce">💥</div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent animate-ping" style={{ animationDuration: "0.7s" }} />
        </div>
      )}
      <div className="relative p-6 flex gap-4">
        {item.supporterAvatar ? (
          <img src={item.supporterAvatar} alt={item.supporterName} className="h-12 w-12 rounded-full object-cover border-2 border-white/20 shrink-0" />
        ) : (
          <div className={`h-12 w-12 rounded-full grid place-items-center shrink-0 ${item.isPrivate ? "bg-emerald-500" : "bg-primary"} text-black`}>
            <PartyPopper className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold tracking-[0.14em] text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> DUKUNGAN BARU!
          </div>
          <p className="mt-2 text-[16px] font-bold leading-snug text-white text-pretty">
            {item.displayText}
          </p>
          {item.isPrivate && item.ballotQuantity ? (
            <p className="mt-2 text-sm text-white/70">{item.ballotQuantity} ballot • terima kasih!</p>
          ) : (
            <p className="mt-2 text-sm text-white/60">Terima kasih sudah meramaikan!</p>
          )}
        </div>
        <button onClick={onClose} aria-label="Tutup notifikasi" className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      {item.peletonSlug && (
        <Link href={`/tim/${item.peletonSlug}`} onClick={onClose} className="block border-t border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-bold text-primary hover:text-white hover:bg-white/10">
          Lihat Peleton →
        </Link>
      )}
    </div>
  )
}

export function RealtimeSupportNotification(){
  const { currentUser } = useApp()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const queueRef = useRef<QueueItem[]>([])
  const processingRef = useRef(false)

  // Unlock audio on first interaction
  useEffect(()=> {
    requestUnlockOnInteraction()
    // Also try to load voices
    if ("speechSynthesis" in window) {
      const load = () => window.speechSynthesis.getVoices()
      load()
      window.speechSynthesis.onvoiceschanged = load
    }
  },[])

  const enqueue = useCallback((item: QueueItem)=>{
    queueRef.current.push(item)
    setQueue([...queueRef.current])
  },[])

  // Process queue one by one with cooldown
  useEffect(()=>{
    if(current) return
    if(queue.length===0) return
    if(processingRef.current) return
    processingRef.current = true
    const next = queue[0]
    // Respect cooldown: if cannot play now due to sound cooldown, still show popup but maybe skip sound?
    // We delay next popup until cooldown clears
    const tryProcess = async () => {
      if(!canPlayNow() && getSoundEnabled()){
        // Wait for cooldown?
        // Just wait 1s and retry
        setTimeout(()=> { processingRef.current=false; setQueue([...queueRef.current]) }, 1000)
        return
      }
      // Dequeue
      queueRef.current.shift()
      setQueue([...queueRef.current])
      setCurrent(next)
      // Play sound sequence (duar + TTS)
      // Don't block popup display; sound plays async
      unlockAudio()
      playNotificationSequence(next.ttsText).catch(()=>{})
      processingRef.current = false
    }
    tryProcess()
  },[queue, current])

  const handleClose = useCallback(()=>{
    setCurrent(null)
  },[])

  // When current closes, queue processor will pick next

  // Subscribe to realtime
  useEffect(()=>{
    const supabase = createBrowserSupabase()

    // Channel for public notifications (user_id is null) — everyone gets these
    const publicChannel = supabase
      .channel("public-support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=is.null" }, (payload) => {
        const row: any = payload.new
        // Public: tanpa ballot
        const supporterName = row.supporter_name || "Seseorang"
        const supporterAvatar = row.supporter_avatar || row.data?.supporter_avatar || null
        const peletonName = row.peleton_name || "peleton"
        const displayText = row.body || `Selamat!! ${supporterName} telah mendukung ${peletonName}`
        const ttsText = displayText // same, without amount
        enqueue({
          id: row.id,
          supporterName,
          supporterAvatar,
          peletonName,
          peletonSlug: row.peleton_slug || "",
          isPrivate: false,
          ttsText,
          displayText,
        })
      })
      .subscribe()

    // Private channel only if logged in — user_id = currentUser.id
    let privateChannel: any = null
    if(currentUser?.id){
      privateChannel = supabase
        .channel(`private-support-${currentUser.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` }, (payload)=>{
          const row: any = payload.new
          const supporterName = row.supporter_name || currentUser.name || "Kamu"
          const supporterAvatar = row.supporter_avatar || row.data?.supporter_avatar || (currentUser as any)?.avatar_url || null
          const peletonName = row.peleton_name || "peleton"
          const qty = row.data?.ballot_quantity
          const displayText = row.body || `Selamat!! Kamu telah mendukung ${peletonName}${qty ? ` — ${qty} ballot` : ""}`
          const ttsText = qty ? `Selamat!! Kamu telah mendukung ${peletonName} — ${qty} ballot` : `Selamat!! Kamu telah mendukung ${peletonName}`
          enqueue({
            id: row.id,
            supporterName,
            supporterAvatar,
            peletonName,
            peletonSlug: row.peleton_slug || "",
            isPrivate: true,
            ballotQuantity: qty,
            ttsText,
            displayText,
          })
        })
        .subscribe()
    }

    return ()=>{
      supabase.removeChannel(publicChannel)
      if(privateChannel) supabase.removeChannel(privateChannel)
    }
  },[currentUser?.id, enqueue])

  if(!current) return null

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none grid place-items-center p-4">
      <div className="pointer-events-auto">
        <SupportPopup item={current} onClose={handleClose} />
      </div>
    </div>
  )
}
