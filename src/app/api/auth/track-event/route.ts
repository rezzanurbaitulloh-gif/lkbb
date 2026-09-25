import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase"
import { resolveEventFromHost } from "@/lib/event"

// Mencatat asosiasi user ↔ event saat login di domain event tersebut.
// Dipanggil fire-and-forget setelah login/register berhasil.
// Super admin ditolak trigger DB (prevent_super_admin_member_change) —
// memang disembunyikan dari daftar pengguna event.
export async function POST() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const hdrs = await headers()
    const host = hdrs.get("host") || hdrs.get("x-forwarded-host")
    const { eventId } = await resolveEventFromHost(host)
    if (!eventId) return NextResponse.json({ ok: true, tracked: false })
    const service = createServiceSupabase()
    const { error } = await service.from("event_members").upsert(
      { event_id: eventId, user_id: user.id, role: "USER", status: "active" },
      { onConflict: "event_id,user_id", ignoreDuplicates: true }
    )
    // Baris ADMIN yang sudah ada tidak diturunkan (ignoreDuplicates).
    // Super admin gagal insert via trigger — abaikan diam-diam.
    if (error) return NextResponse.json({ ok: true, tracked: false })
    return NextResponse.json({ ok: true, tracked: true })
  } catch {
    return NextResponse.json({ ok: true, tracked: false })
  }
}
