import { NextResponse } from "next/server"
import { createServiceSupabase, createServerSupabase } from "@/lib/supabase"
import { isSuperAdmin } from "@/lib/event"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireSuperAdmin() {
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
  if (!user) return { ok: false as const, status: 401 }
  if (!await isSuperAdmin(user.id)) return { ok: false as const, status: 403 }
  return { ok: true as const, user, supabase }
}

export async function GET() {
  const auth = await requireSuperAdmin()
  // Allow any admin to list events they have access to? For now, super admin can list all, event admin can list own events
  const service = createServiceSupabase()
  // Try to get user to filter
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const superAdmin = user ? await isSuperAdmin(user.id) : false
  if (superAdmin) {
    const { data, error } = await service.from("events").select("*, event_domains(domain, is_primary)").order("created_at", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  // Event admin: list events where they are member
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: members } = await service.from("event_members").select("event_id").eq("user_id", user.id)
  const eventIds = (members || []).map((m: any) => m.event_id)
  if (eventIds.length === 0) return NextResponse.json([])
  const { data, error } = await service.from("events").select("*, event_domains(domain, is_primary)").in("id", eventIds).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status })
  const body = await req.json()
  const { slug, name, organizer_name, description, event_date, status } = body
  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 })
  const service = createServiceSupabase()
  // Check slug unique
  const { data: existing } = await service.from("events").select("id").eq("slug", slug).maybeSingle()
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
  const { data, error } = await service.from("events").insert({
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name,
    organizer_name: organizer_name || "PASKIBRA",
    description: description || "",
    event_date: event_date || null,
    status: status || "DRAFT",
    settings: {},
  } as any).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Auto-create domain: slug.lkbb.vercel.app
  try {
    await service.from("event_domains").insert({ event_id: (data as any).id, domain: `${slug.toLowerCase()}.lkbb.vercel.app`, is_primary: true, is_verified: true } as any)
  } catch {}
  // Also create a competitions row for backward compat
  try {
    await service.from("competitions").insert({ name, tagline: description, state: status || "DRAFT", event_id: (data as any).id, settings: {} } as any)
  } catch {}
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_create", target: (data as any).id, details: body, event_id: (data as any).id } as any)
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status })
  const body = await req.json()
  const { id, slug, name, organizer_name, description, event_date, status, settings } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const service = createServiceSupabase()
  const updates: any = {}
  if (slug) updates.slug = slug
  if (name) updates.name = name
  if (organizer_name !== undefined) updates.organizer_name = organizer_name
  if (description !== undefined) updates.description = description
  if (event_date !== undefined) updates.event_date = event_date
  if (status) updates.status = status
  if (settings) updates.settings = settings
  updates.updated_at = new Date().toISOString()
  const { data, error } = await service.from("events").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_update", target: id, details: updates, event_id: id } as any)
  return NextResponse.json(data)
}
