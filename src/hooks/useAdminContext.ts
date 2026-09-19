"use client"
import { useEffect, useState } from "react"

export type AdminContextClient = {
  admin: boolean
  role: string | null
  isSuper: boolean
  eventIds: string[]
  scope: "all" | "own" | "none"
  events: { id: string; slug: string; name: string }[]
}

// Konteks admin untuk UI (filter menu, clamp event) — sesuai matriks peran.
// Server tetap menegakkan di middleware + API; ini hanya untuk tampilan.
export function useAdminContext(){
  const [ctx, setCtx] = useState<AdminContextClient>({ admin: false, role: null, isSuper: false, eventIds: [], scope: "none", events: [] })
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    let alive = true
    fetch("/api/me/admin", { cache: "no-store" })
      .then(r=> r.ok ? r.json() : { admin: false })
      .then(j=> {
        if(!alive) return
        setCtx({
          admin: !!j.admin,
          role: j.role ?? null,
          isSuper: !!j.isSuper,
          eventIds: Array.isArray(j.eventIds) ? j.eventIds : [],
          scope: j.scope === "all" ? "all" : j.scope === "own" ? "own" : "none",
          events: Array.isArray(j.events) ? j.events : [],
        })
        setLoading(false)
      })
      .catch(()=> { if(alive) setLoading(false) })
    return ()=> { alive = false }
  },[])
  return { ...ctx, loading }
}
