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
  const { slug, name, organizer_name, description, event_date, status, template_id, domain_mode } = body
  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 })
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleanSlug)) return NextResponse.json({ error: "slug tidak valid (huruf/angka/strip)" }, { status: 400 })
  const service = createServiceSupabase()
  // Check slug unique
  const { data: existing } = await service.from("events").select("id").eq("slug", cleanSlug).maybeSingle()
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
  const baseRow: any = {
    slug: cleanSlug,
    name,
    organizer_name: organizer_name || "PASKIBRA",
    description: description || "",
    event_date: event_date || null,
    status: status || "DRAFT",
    settings: {},
  };
  // template_id hanya bila kolom sudah ada (migrasi 021); fallback tanpa kolom
  let data: any = null;
  {
    const r1 = await service.from("events").insert({ ...baseRow, template_id: template_id || null }).select().single();
    if (!r1.error) {
      data = r1.data;
    } else if (/template_id|column/i.test(r1.error.message || "")) {
      const r2 = await service.from("events").insert(baseRow).select().single();
      if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });
      data = r2.data;
    } else {
      return NextResponse.json({ error: r1.error.message }, { status: 500 });
    }
  }
  const eventId = (data as any).id as string
  // Domain: lkbb.my.id (production) atau lkbb.vercel.app (dev/preview)
  const useCustom = (domain_mode || "myid") === "myid"
  const domain = useCustom ? `${cleanSlug}.lkbb.my.id` : `${cleanSlug}.lkbb.vercel.app`
  let domainState = { domain, ssl: "pending", vercel: "skipped" }
  try {
    await service.from("event_domains").insert({ event_id: eventId, domain, subdomain: cleanSlug, is_primary: true, is_verified: false, ssl_status: "pending" } as any)
  } catch {}
  // Coba daftarkan domain ke Vercel otomatis (butuh VERCEL_TOKEN + VERCEL_PROJECT_ID/NAME)
  try {
    const vres = await provisionVercelDomain(domain)
    domainState = { domain, ssl: vres.ssl || "pending", vercel: vres.ok ? "added" : `gagal: ${vres.error || "unknown"}` }
    if (vres.ok) {
      await service.from("event_domains").update({ is_verified: true, ssl_status: "active" } as any).eq("event_id", eventId).eq("domain", domain)
    }
  } catch (e: any) {
    domainState = { domain, ssl: "pending", vercel: `gagal: ${e?.message || e}` }
  }
  // Also create a competitions row for backward compat
  try {
    await service.from("competitions").insert({ name, tagline: description, state: status || "DRAFT", event_id: eventId, settings: {} } as any)
  } catch {}
  // Terapkan template bila dipilih (1 klik penuh)
  let templateState = "skipped"
  if (template_id) {
    try {
      const { data: tpl } = await service.from("event_templates").select("*").eq("id", template_id).maybeSingle()
      if (tpl) {
        const t: any = tpl
        const { error: upErr } = await service.from("events").update({
          template_config: { themeTokens: t.theme_tokens || {}, layoutVariant: t.layout_variant, heroVariant: t.hero_variant, componentRegistry: t.component_registry || {} },
          component_registry: t.component_registry || {},
          branding: t.branding_assets || {},
          settings: t.default_settings || {},
          updated_at: new Date().toISOString(),
        } as any).eq("id", eventId)
        if (upErr) {
          templateState = `gagal apply (migrasi 021?): ${upErr.message}`
        } else {
          try {
            await service.from("competitions").update({ settings: t.default_settings || {} } as any).eq("event_id", eventId)
          } catch {}
          templateState = "applied"
        }
      } else {
        templateState = "template tidak ditemukan"
      }
    } catch (e: any) {
      templateState = `gagal: ${e?.message || e}`
    }
  }
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_create", target: eventId, details: { ...body, domain, templateState }, event_id: eventId } as any)
  return NextResponse.json({ ...data, provisioning: { domain: domainState, template: templateState } })
}

// Daftarkan domain ke Vercel via API. Return {ok, ssl?, error?}
async function provisionVercelDomain(domain: string): Promise<{ ok: boolean; ssl?: string; error?: string }> {
  const token = process.env.VERCEL_TOKEN
  const project = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME
  if (!token || !project) return { ok: false, error: "VERCEL_TOKEN/VERCEL_PROJECT_ID belum di-set" }
  const res = await fetch(`https://api.vercel.com/v10/projects/${project}/domains`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: (j as any)?.error?.message || `HTTP ${res.status}` }
  return { ok: true, ssl: "pending" }
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
