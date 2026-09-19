import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getAdminContext } from "@/lib/auth"

async function requireAdmin() {
  const ctx = await getAdminContext()
  if (!ctx) return { authorized: false as const, status: 401 as const }
  if (ctx.scope === "none") return { authorized: false as const, status: 403 as const }
  return { authorized: true as const, user: { id: ctx.userId }, ctx }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.status===401?"Unauthorized":"Forbidden" }, { status: auth.status })
  const body = await req.json()
  const { id, field, value, settings } = body
  const service = createServiceSupabase()
  // Resolve event for audit + dual-write
  let eventId: string | null = null
  // Try to find event_id from competitions row
  const { data: compRow } = await service.from("competitions").select("event_id, id").eq("id", id).maybeSingle()
  if (compRow?.event_id) eventId = compRow.event_id
  else {
    // Maybe id is actually an event id
    const { data: ev } = await service.from("events").select("id").eq("id", id).maybeSingle()
    if (ev?.id) eventId = ev.id
  }
  // Handle show_provisional_result / show_final_result toggles, or settings merge, or state
  // Matriks: ADMIN hanya boleh menyentuh competitions event sendiri.
  if (!auth.ctx.isSuper) {
    const { data: target } = await service.from("competitions").select("event_id").eq("id", id).maybeSingle()
    const targetEvent = (target as any)?.event_id || null
    if (!targetEvent || !auth.ctx.eventIds.includes(targetEvent)) {
      // Baris competitions tanpa event_id (legacy): izinkan bila admin punya event.
      if (targetEvent || auth.ctx.eventIds.length === 0) {
        return NextResponse.json({ error: "Forbidden — di luar event Anda" }, { status: 403 })
      }
    }
  }
  if (settings && typeof settings === "object") {
    // Merge settings jsonb — dual-write to competitions and events
    const { data: current } = await service.from("competitions").select("settings").eq("id", id).maybeSingle()
    if (current) {
      const merged = { ...(current?.settings || {}), ...settings }
      const { error } = await service.from("competitions").update({ settings: merged }).eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Also update events.settings if eventId known
    if (eventId) {
      const { data: evCurrent } = await service.from("events").select("settings").eq("id", eventId).maybeSingle()
      const evMerged = { ...(evCurrent?.settings || {}), ...settings }
      await service.from("events").update({ settings: evMerged }).eq("id", eventId)
    } else {
      // Fallback: update default event
      const { data: def } = await service.from("events").select("id, settings").eq("slug", "lkbbvote").maybeSingle()
      if (def) {
        const evMerged = { ...((def as any).settings || {}), ...settings }
        await service.from("events").update({ settings: evMerged }).eq("id", (def as any).id)
        eventId = (def as any).id
      }
    }
    await service.from("audit_logs").insert({ user_id: auth.user.id, action: "competition_settings_update", target: id, details: { settings }, event_id: eventId } as any)
    return NextResponse.json({ ok: true })
  }
  if (field && ["show_provisional_result","show_final_result","state","name","subtitle","tagline","voting_start","voting_end"].includes(field)) {
    // Update competitions if exists
    const { error } = await service.from("competitions").update({ [field]: value }).eq("id", id)
    if (error && !eventId) return NextResponse.json({ error: error.message }, { status: 500 })
    // Also update events if applicable
    if (eventId) {
      // Map competitions.state to events.status
      const evField = field === "state" ? "status" : field
      const evValue = field === "state" ? value : value
      await service.from("events").update({ [evField]: evValue } as any).eq("id", eventId)
    }
    await service.from("audit_logs").insert({ user_id: auth.user.id, action: "competition_field_update", target: id, details: { field, value }, event_id: eventId } as any)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Invalid field" }, { status: 400 })
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const service = createServiceSupabase()
  let q: any = service.from("competitions").select("*").order("created_at", { ascending: false }).limit(1)
  if (!auth.ctx.isSuper && auth.ctx.eventIds.length > 0) q = q.in("event_id", auth.ctx.eventIds)
  const { data, error } = await q.single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
