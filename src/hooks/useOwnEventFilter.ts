"use client"
import { useEffect, useState } from "react"

// Filter event milik sendiri untuk list admin (matriks: ADMIN hanya event sendiri).
// SUPER_ADMIN: eventIds kosong = tanpa filter (semua).
export function useOwnEventFilter(){
  const [ready, setReady] = useState(false)
  const [isSuper, setIsSuper] = useState(false)
  const [eventIds, setEventIds] = useState<string[]>([])
  useEffect(()=>{
    fetch("/api/me/admin", { cache: "no-store" }).then(r=> r.json()).then(j=>{
      setIsSuper(!!j.isSuper)
      setEventIds(Array.isArray(j.eventIds) ? j.eventIds : [])
      setReady(true)
    }).catch(()=> setReady(true))
  },[])
  return { ready, isSuper, eventIds }
}
