import { createServiceSupabase } from "./supabase"

export type EventTheme = {
  vars: Record<string, string>
  layoutVariant: string
  heroVariant: string
}

// Tema per event, terisolasi: hanya dari baris events + site_settings milik event itu.
// Tidak ada state global — event lain tidak terpengaruh.
export async function getEventTheme(eventId: string | null): Promise<EventTheme> {
  const fallback: EventTheme = { vars: {}, layoutVariant: "default", heroVariant: "default" }
  if (!eventId) return fallback
  try {
    const service = createServiceSupabase()
    const { data: ev } = await service
      .from("events")
      .select("template_config, component_registry, branding, settings")
      .eq("id", eventId)
      .maybeSingle()
    if (!ev) return fallback
    const e: any = ev
    const cfg = e.template_config || {}
    const tokens = cfg.themeTokens || {}
    const colors = tokens.colors || {}
    const vars: Record<string, string> = {}
    const set = (k: string, v: any) => { if (typeof v === "string" && v) vars[k] = v }
    set("--primary", colors.primary)
    set("--ring", colors.primary)
    set("--gold", colors.primary)
    set("--chart-1", colors.primary)
    set("--background", colors.background)
    set("--surface", colors.surface)
    set("--card", colors.surface)
    set("--card-foreground", colors.text)
    set("--foreground", colors.text)
    set("--muted-foreground", colors.muted)
    set("--border", colors.border)
    set("--input", colors.border)
    if (colors.primary) {
      const isLight = isLightColor(colors.primary)
      set("--primary-foreground", isLight ? "#0A0A09" : "#F2F0E9")
    }
    // Override halus dari site_settings appearance milik event ini (setara AppearanceProvider)
    try {
      const { data: rows } = await service
        .from("site_settings")
        .select("key,value")
        .eq("event_id", eventId)
        .in("key", ["appearance.primary_color"])
      const row = (rows || [])[0] as any
      let p = row?.value
      if (typeof p === "object" && p !== null && (p as any).value) p = (p as any).value
      if (typeof p === "string") {
        p = p.replace(/^"|"$/g, "").trim()
        if (/^#?[0-9A-Fa-f]{3,8}$/.test(p)) {
          const c = p.startsWith("#") ? p : "#" + p
          vars["--primary"] = c
          vars["--ring"] = c
          vars["--gold"] = c
          vars["--chart-1"] = c
        }
      }
    } catch {}
    return {
      vars,
      layoutVariant: cfg.layoutVariant || "default",
      heroVariant: cfg.heroVariant || "default",
    }
  } catch {
    return fallback
  }
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}
