import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

// Baca audit log — matriks: SUPER semua (filter ?event_id opsional),
// ADMIN hanya event sendiri, baca saja (tanpa endpoint hapus).
export async function GET(req: Request) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (ctx.scope === "none") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const service = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50") || 50)
  const qEventId = searchParams.get("event_id")

  let eventIds: string[] | null = ctx.isSuper ? null : [...ctx.eventIds]
  if (qEventId) {
    if (!ctx.isSuper && !ctx.eventIds.includes(qEventId)) {
      return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
    }
    eventIds = [qEventId]
  }

  let q: any = service.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit)
  if (eventIds) q = q.in("event_id", eventIds)
  const { data: logs, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set(((logs as any[]) || []).map((l: any) => l.user_id).filter(Boolean))]
  let users: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profs } = await service.from("profiles").select("id,email,public_name,role").in("id", userIds)
    for (const p of (profs as any[]) || []) users[p.id] = p
  }
  return NextResponse.json({ logs: logs || [], users })
}
