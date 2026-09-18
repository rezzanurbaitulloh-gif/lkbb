import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false as const, status: 401 as const }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const role = profile?.role
  if (!["ADMIN","SUPER_ADMIN"].includes(role || "")) return { authorized: false as const, status: 403 as const }
  return { authorized: true as const, user, supabase }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: auth.status===401?"Unauthorized":"Forbidden" }, { status: auth.status })
  const body = await req.json()
  const { id, field, value, settings } = body
  const service = createServiceSupabase()
  // Handle show_provisional_result / show_final_result toggles, or settings merge, or state
  if (settings && typeof settings === "object") {
    // Merge settings jsonb
    const { data: current } = await service.from("competitions").select("settings").eq("id", id).single()
    const merged = { ...(current?.settings || {}), ...settings }
    const { error } = await service.from("competitions").update({ settings: merged }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await service.from("audit_logs").insert({ user_id: auth.user.id, action: "competition_settings_update", target: id, details: { settings } })
    return NextResponse.json({ ok: true })
  }
  if (field && ["show_provisional_result","show_final_result","state","name","subtitle","tagline","voting_start","voting_end"].includes(field)) {
    const { error } = await service.from("competitions").update({ [field]: value }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await service.from("audit_logs").insert({ user_id: auth.user.id, action: "competition_field_update", target: id, details: { field, value } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Invalid field" }, { status: 400 })
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const service = createServiceSupabase()
  const { data, error } = await service.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
