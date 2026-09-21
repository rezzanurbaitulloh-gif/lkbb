import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Event resolution & authz helpers — server-side only
// Hostname is primary source of truth for event, fallback to path /e/[slug] or ?event_id for vercel.app preview
// Not ?event_id or localStorage as primary, but we support it for MVP on vercel.app where wildcard subdomains aren't available on Hobby

const DEFAULT_SLUG = "lkbbvote"

// Simple in-memory cache (per-instance, 60s TTL) to avoid DB hit every request
let cache: { map: Map<string, { event: any; at: number }>; ttl: number } | null = null
function getCache() {
  if (!cache) cache = { map: new Map(), ttl: 60_000 }
  return cache
}

function normalizeHost(host: string | null): string {
  if (!host) return ""
  return host.split(":")[0].toLowerCase().trim()
}

// Host khusus super-admin: admin.lkbb.my.id (prod) / admin.lkbb.vercel.app (dev).
// Di host ini publik diarahkan ke dasbor super (/super); event-site biasa tidak berlaku.
export function isAdminHost(host: string | null): boolean {
  const h = normalizeHost(host)
  return h === "admin.lkbb.my.id" || h === "admin.lkbb.vercel.app"
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing for event resolution")
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function resolveEventFromHost(host: string | null): Promise<{ event: any | null; eventId: string | null; slug: string | null }> {
  const h = normalizeHost(host)
  if (!h) return fallbackDefault()
  const c = getCache()
  const cached = c.map.get(h)
  if (cached && Date.now() - cached.at < c.ttl) {
    const ev = cached.event
    return { event: ev, eventId: ev?.id || null, slug: ev?.slug || null }
  }
  const service = getServiceClient()
  // 1) exact domain match
  const { data: dom } = await service.from("event_domains").select("event_id, domain").eq("domain", h).maybeSingle()
  if (dom?.event_id) {
    const { data: ev } = await service.from("events").select("*").eq("id", dom.event_id).maybeSingle()
    if (ev) {
      c.map.set(h, { event: ev, at: Date.now() })
      return { event: ev, eventId: ev.id, slug: ev.slug }
    }
  }
  // 2) subdomain: xxx.lkbb.vercel.app -> slug xxx (dev/preview)
  // NOTE: Vercel Hobby tidak support wildcard *.vercel.app (akan ERR_CONNECTION_CLOSED)
  // Untuk preview di vercel.app, gunakan path /e/[slug] atau ?event_id= — subdomain hanya untuk custom domain
  const m = h.match(/^([a-z0-9-]+)\.lkbb\.vercel\.app$/)
  if (m) {
    const slug = m[1]
    const { data: ev } = await service.from("events").select("*").eq("slug", slug).maybeSingle()
    if (ev) {
      c.map.set(h, { event: ev, at: Date.now() })
      return { event: ev, eventId: ev.id, slug: ev.slug }
    }
  }
  // 2b) subdomain custom: xxx.lkbb.my.id -> slug xxx (production multi-tenant)
  // "admin" dan "www" dikecualikan — ditangani sebagai host khusus, bukan event
  const mc = h.match(/^([a-z0-9-]+)\.lkbb\.my\.id$/)
  if (mc && mc[1] !== "admin" && mc[1] !== "www") {
    const slug = mc[1]
    const { data: ev } = await service.from("events").select("*").eq("slug", slug).maybeSingle()
    if (ev) {
      c.map.set(h, { event: ev, at: Date.now() })
      return { event: ev, eventId: ev.id, slug: ev.slug }
    }
  }
  // 3) custom domain like event-a.example.com — already handled by exact match above
  // 4) fallback
  return fallbackDefault(h)
}

export async function resolveEventFromRequest(req: Request | { headers: any; url?: string }): Promise<{ event: any | null; eventId: string | null; slug: string | null }> {
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  const urlStr = (req as any).url || ""
  // 1) Query param ?event_id= or ?event=slug (MVP for vercel.app)
  try {
    const u = new URL(urlStr, `https://${host || "lkbb.vercel.app"}`)
    const qId = u.searchParams.get("event_id")
    const qSlug = u.searchParams.get("event") || u.searchParams.get("event_slug")
    const service = getServiceClient()
    if (qId && qId !== "all") {
      const { data: ev } = await service.from("events").select("*").eq("id", qId).maybeSingle()
      if (ev) return { event: ev, eventId: ev.id, slug: ev.slug }
    }
    if (qSlug) {
      const { data: ev } = await service.from("events").select("*").eq("slug", qSlug).maybeSingle()
      if (ev) return { event: ev, eventId: ev.id, slug: ev.slug }
    }
    // 2) Path /e/[slug]
    const path = u.pathname || ""
    const m = path.match(/^\/e\/([a-z0-9-]+)(?:\/|$)/)
    if (m) {
      const slug = m[1]
      const { data: ev } = await service.from("events").select("*").eq("slug", slug).maybeSingle()
      if (ev) return { event: ev, eventId: ev.id, slug: ev.slug }
    }
  } catch {}
  // 3) Host-based
  return resolveEventFromHost(host)
}

async function fallbackDefault(hostForCache?: string) {
  const service = getServiceClient()
  const { data: ev } = await service.from("events").select("*").eq("slug", DEFAULT_SLUG).maybeSingle()
  if (!ev) return { event: null, eventId: null, slug: null }
  if (hostForCache) {
    const c = getCache()
    c.map.set(hostForCache, { event: ev, at: Date.now() })
  }
  return { event: ev, eventId: ev.id, slug: ev.slug }
}

export async function isSuperAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const service = getServiceClient()
  const { data } = await service.from("platform_roles").select("user_id").eq("user_id", userId).maybeSingle()
  return !!data
}

export async function isEventAdmin(eventId: string | null | undefined, userId: string | null | undefined): Promise<boolean> {
  if (!eventId || !userId) return false
  if (await isSuperAdmin(userId)) return true
  const service = getServiceClient()
  const { data } = await service.from("event_members").select("id").eq("event_id", eventId).eq("user_id", userId).eq("role", "ADMIN").eq("status", "active").maybeSingle()
  return !!data
}

export async function getEventMemberRole(eventId: string, userId: string): Promise<"ADMIN" | "USER" | null> {
  if (await isSuperAdmin(userId)) return "ADMIN" // super admin is admin everywhere
  const service = getServiceClient()
  const { data } = await service.from("event_members").select("role").eq("event_id", eventId).eq("user_id", userId).maybeSingle()
  return (data as any)?.role || null
}

// For API routes: authenticate + resolve event + authorize
export async function requireEventContext(req: Request, required: "ADMIN" | "USER" | "ANY" = "ANY") {
  // Need to get host from request headers
  const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
  const { event, eventId } = await resolveEventFromHost(host)
  if (!event || !eventId) return { ok: false as const, error: "Event not found", status: 404 }

  // Auth is handled by caller via supabase.auth.getUser(), but we can also check here if needed
  return { ok: true as const, event, eventId }
}

export async function requireSuperAdminByUserId(userId: string) {
  if (await isSuperAdmin(userId)) return { ok: true as const }
  return { ok: false as const, error: "SUPER_ADMIN required", status: 403 as const }
}
