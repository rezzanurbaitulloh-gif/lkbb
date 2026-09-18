"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabase } from "@/lib/supabase"

export function EventSwitcher() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [current, setCurrent] = useState<string>("all")
  const [isSuper, setIsSuper] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sup = createBrowserSupabase()
    sup.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data: profile } = await sup.from("profiles").select("role").eq("id", user.id).single()
      const superAdmin = profile?.role === "SUPER_ADMIN"
      if (!superAdmin) {
        setIsSuper(false)
        setLoading(false)
        return
      }
      setIsSuper(superAdmin)
      const res = await fetch("/api/admin/events").then(r => r.json()).catch(() => [])
      if (Array.isArray(res)) setEvents(res)
      const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("event_id") || "all" : "all"
      setCurrent(q)
      setLoading(false)
    })
  }, [])

  if (loading) return null
  if (!isSuper) return null
  if (events.length === 0) return null

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
        <option value="all">All Events</option>
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
