import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// Status admin milik sendiri — dipakai UI untuk menampilkan/menyembunyikan menu
// sesuai matriks (SUPER_ADMIN semua event, ADMIN hanya event sendiri).
// Meniru logika proteksi di middleware.ts.
export async function GET(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ admin: false })

  const service = createServiceSupabase()
  let events: { id: string; slug: string; name: string }[] = []
  try {
    if (ctx.isSuper) {
      const { data } = await service.from("events").select("id,slug,name").order("created_at", { ascending: true })
      events = (data as any) || []
    } else if (ctx.eventIds.length > 0) {
      const { data } = await service.from("events").select("id,slug,name").in("id", ctx.eventIds)
      events = (data as any) || []
    }
  } catch {}

  return NextResponse.json({
    admin: ctx.scope !== "none",
    role: ctx.profileRole,
    isSuper: ctx.isSuper,
    eventIds: ctx.eventIds,
    scope: ctx.scope,
    events,
  })
}
