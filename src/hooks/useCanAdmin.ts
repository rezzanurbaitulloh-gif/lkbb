"use client"
import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"

// Menu ADMIN tampil bila user lolos salah satu jalur proteksi middleware:
// profiles.role ADMIN/SUPER_ADMIN, platform_roles, atau event_members.
// Dicek server-side via /api/me/admin (bukan cuma role di client).
export function useCanAdmin(){
  const { currentUser, isAdmin } = useApp()
  const [canAdmin, setCanAdmin] = useState(isAdmin)
  useEffect(()=>{
    setCanAdmin(isAdmin)
    if(!currentUser){ setCanAdmin(false); return }
    if(isAdmin) return
    let alive = true
    fetch("/api/me/admin", { cache: "no-store" })
      .then(r=> r.ok ? r.json() : { admin: false })
      .then(j=> { if(alive) setCanAdmin(!!j.admin) })
      .catch(()=> {})
    return ()=> { alive = false }
  },[currentUser?.id, isAdmin])
  return canAdmin
}
