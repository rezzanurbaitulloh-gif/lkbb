import { redirect } from "next/navigation"
import { getAdminContext } from "@/lib/auth"
import { createServiceSupabase } from "@/lib/supabase"
import { AdminNav } from "@/components/admin/AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }){
  // Gerbang matriks: SUPER_ADMIN (semua event) atau ADMIN event (event_members).
  // Selaras dengan middleware — event-admin tanpa profiles.ADMIN pun lolos.
  const ctx = await getAdminContext()
  if (!ctx) {
    redirect("/login?redirect=/admin")
  }
  if (ctx.scope === "none") {
    redirect("/?error=unauthorized")
  }
  let events: { id: string; slug: string; name: string }[] = []
  try {
    const service = createServiceSupabase()
    if (ctx.isSuper) {
      const { data } = await service.from("events").select("id,slug,name").order("created_at", { ascending: true })
      events = (data as any) || []
    } else if (ctx.eventIds.length > 0) {
      const { data } = await service.from("events").select("id,slug,name").in("id", ctx.eventIds)
      events = (data as any) || []
    }
  } catch {}
  return (
    <AdminNav
      isSuper={ctx.isSuper}
      role={ctx.profileRole}
      events={events}
    >
      {children}
    </AdminNav>
  )
}
