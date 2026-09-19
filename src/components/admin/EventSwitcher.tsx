"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function EventSwitcher() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [current, setCurrent] = useState<string>("all")
  const [isSuper, setIsSuper] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/me/admin", { cache: "no-store" }).then(r=> r.json()).then(async (me) => {
      if (!me?.admin) { setLoading(false); return }
      const superAdmin = !!me.isSuper
      setIsSuper(superAdmin)
      // /api/admin/events mengembalikan semua (super) atau event sendiri (admin).
      const res = await fetch("/api/admin/events").then(r => r.json()).catch(() => [])
      if (Array.isArray(res)) setEvents(res)
      const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("event_id") || "all" : "all"
      setCurrent(superAdmin ? q : (res[0]?.id || "all"))
      setLoading(false)
    }).catch(()=> setLoading(false))
  }, [])

  if (loading) return null
  if (events.length === 0) return null

  // Matriks: hanya SUPER_ADMIN boleh berpindah/ melihat semua event.
  // ADMIN melihat label event sendiri (baca saja).
  if (!isSuper) {
    if (events.length === 1) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest text-white/40">EVENT</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white truncate max-w-[180px]" title={events[0].name}>
            {events[0].slug} — {events[0].name}
          </span>
        </div>
      )
    }
    return null
  }

  const handleChange = (val: string) => {
    setCurrent(val)
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
    if (val === "all") params.delete("event_id")
    else params.set("event_id", val)
    const qs = params.toString()
    router.push(`/admin${qs ? `?${qs}` : ""}`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold tracking-widest text-white/40">EVENT</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-full border border-white/10 bg-[#17191F] px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">Semua Event</option>
        {events.map((ev: any) => (
          <option key={ev.id} value={ev.id}>
            {ev.slug} — {ev.name}
          </option>
        ))}
      </select>
      <span className="hidden sm:inline text-[10px] text-white/30">SUPER_ADMIN</span>
    </div>
  )
}
