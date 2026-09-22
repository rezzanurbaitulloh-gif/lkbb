import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSuperAdmin } from "@/lib/event"
import { mergeTemplateConfig } from "@/lib/templates"

// Samakan site_settings appearance milik event dengan warna template,
// agar provider klien (AppearanceProvider) dan variabel server sejalan.
async function syncAppearance(service: any, eventId: string, colors: Record<string, any>) {
  const primary = colors?.primary
  if (typeof primary !== "string" || !primary) return
  const { data: row } = await service
    .from("site_settings").select("id,value").eq("key", "appearance.primary_color").eq("event_id", eventId).maybeSingle()
  const cur = (row as any)?.value
  const shapeLike = typeof cur === "string" ? primary : { value: primary };
  if (row) {
    await service.from("site_settings").update({ value: (shapeLike as any), updated_at: new Date().toISOString() }).eq("id", (row as any).id)
  } else {
    await service.from("site_settings").insert({
      key: "appearance.primary_color", value: primary, category: "appearance",
      description: "Warna primer (sinkron template)", is_public: true, event_id: eventId,
    })
  }
}

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
  return { ok: true as const, user }
}

// POST /api/admin/templates/apply — 1 klik terapkan template penuh ke event (super saja)
// body: { event_id, template_id, overrides? }
export async function POST(req: Request) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status })
  const body = await req.json()
  const { event_id, template_id, overrides } = body
  if (!event_id || !template_id) return NextResponse.json({ error: "event_id & template_id required" }, { status: 400 })
  const service = createServiceSupabase()

  const { data: tpl, error: tplErr } = await service.from("event_templates").select("*").eq("id", template_id).maybeSingle()
  if (tplErr || !tpl) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 })
  if ((tpl as any).is_active === false) return NextResponse.json({ error: "Template nonaktif" }, { status: 400 })

  const t: any = tpl
  const mergedTheme = mergeTemplateConfig(t.theme_tokens || {}, overrides?.theme_tokens || {})
  const mergedSettings = mergeTemplateConfig(t.default_settings || {}, overrides?.default_settings || {})
  const mergedBranding = mergeTemplateConfig(t.branding_assets || {}, overrides?.branding_assets || {})
  const mergedRegistry = mergeTemplateConfig(t.component_registry || {}, overrides?.component_registry || {})

  // 1) Coba via RPC (migrasi 021); fallback manual bila RPC belum ada
  try {
    const { data, error } = await (service as any).rpc("api_apply_template", {
      p_event_id: event_id,
      p_template_id: template_id,
      p_overrides: overrides || {},
    })
    if (!error && (data as any)?.success !== false) {
      await syncAppearance(service, event_id, (t.theme_tokens || {})?.colors || {})
      await service.from("audit_logs").insert({ user_id: auth.user.id, action: "template_apply", target: event_id, details: { template_id }, event_id } as any)
      return NextResponse.json({ ok: true, via: "rpc", data })
    }
  } catch {}

  // 2) Fallback manual: update events + terapkan CMS sections + settings
  const { error: evErr } = await service.from("events").update({
    template_id,
    template_config: {
      themeTokens: mergedTheme,
      layoutVariant: overrides?.layout_variant || t.layout_variant,
      heroVariant: overrides?.hero_variant || t.hero_variant,
      componentRegistry: mergedRegistry,
    },
    component_registry: mergedRegistry,
    branding: mergedBranding,
    settings: mergedSettings,
    updated_at: new Date().toISOString(),
  } as any).eq("id", event_id)
  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 })

  // Sinkron ke competitions row (compat harga & state)
  try {
    await service.from("competitions").update({ settings: mergedSettings } as any).eq("event_id", event_id)
  } catch {}

  await syncAppearance(service, event_id, (mergedTheme as any)?.colors || {})
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "template_apply", target: event_id, details: { template_id }, event_id } as any)
  return NextResponse.json({ ok: true, via: "manual" })
}
