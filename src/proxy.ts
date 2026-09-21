import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function resolveEventIdFromRequest(request: NextRequest): Promise<string | null> {
  const service = getServiceClient()
  if (!service) return null
  const url = request.nextUrl
  // 1) Query param ?event_id= or ?event=slug (MVP for vercel.app preview)
  const qId = url.searchParams.get("event_id")
  const qSlug = url.searchParams.get("event") || url.searchParams.get("event_slug")
  if (qId && qId !== "all") {
    const { data: ev } = await service.from("events").select("id").eq("id", qId).maybeSingle()
    if (ev?.id) return ev.id
  }
  if (qSlug) {
    const { data: ev } = await service.from("events").select("id").eq("slug", qSlug).maybeSingle()
    if (ev?.id) return ev.id
  }
  // 2) Path /e/[slug]
  const path = url.pathname
  const mPath = path.match(/^\/e\/([a-z0-9-]+)(?:\/|$)/)
  if (mPath) {
    const slug = mPath[1]
    const { data: ev } = await service.from("events").select("id").eq("slug", slug).maybeSingle()
    if (ev?.id) return ev.id
  }
  // 3) Host-based (termasuk wildcard *.lkbb.my.id — lihat src/lib/event.ts)
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || ""
  const h = host.split(":")[0].toLowerCase().trim()
  if (h) {
    const { data: dom } = await service.from("event_domains").select("event_id").eq("domain", h).maybeSingle()
    if (dom?.event_id) return dom.event_id
    const m = h.match(/^([a-z0-9-]+)\.lkbb\.vercel\.app$/)
    if (m) {
      const slug = m[1]
      const { data: ev } = await service.from("events").select("id").eq("slug", slug).maybeSingle()
      if (ev?.id) return ev.id
    }
    // Wildcard custom domain production: xxx.lkbb.my.id -> slug xxx
    // (admin/www dikecualikan — bukan event)
    const mc = h.match(/^([a-z0-9-]+)\.lkbb\.my\.id$/)
    if (mc && mc[1] !== "admin" && mc[1] !== "www") {
      const { data: ev } = await service.from("events").select("id").eq("slug", mc[1]).maybeSingle()
      if (ev?.id) return ev.id
    }
  }
  // fallback
  const { data: ev2 } = await service.from("events").select("id").eq("slug", "lkbbvote").maybeSingle()
  return ev2?.id || null
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  if (!service) return false
  const { data } = await service.from("platform_roles").select("user_id").eq("user_id", userId).maybeSingle()
  return !!data
}
async function isEventAdmin(eventId: string, userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true
  const service = getServiceClient()
  if (!service) return false
  const { data } = await service.from("event_members").select("id").eq("event_id", eventId).eq("user_id", userId).eq("role", "ADMIN").eq("status", "active").maybeSingle()
  return !!data
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  // Resolve event per-request (host → path → query)
  let eventId: string | null = null
  let eventSlug: string | null = null
  try {
    const { resolveEventFromRequest } = await import("@/lib/event")
    const r = await resolveEventFromRequest(request as any)
    eventId = r.eventId
    eventSlug = r.slug
  } catch {
    try { eventId = await resolveEventIdFromRequest(request) } catch {}
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Attach event context to downstream
  if (eventId) {
    supabaseResponse.headers.set("x-event-id", eventId)
    if (eventSlug) supabaseResponse.headers.set("x-event-slug", eventSlug)
  }
  // Tandai host khusus super-admin (admin.lkbb.my.id) untuk downstream
  const rawHost = request.headers.get("host") || request.headers.get("x-forwarded-host") || ""
  const hostLower = rawHost.split(":")[0].toLowerCase().trim()
  const adminHost = hostLower === "admin.lkbb.my.id" || hostLower === "admin.lkbb.vercel.app"
  if (adminHost) {
    supabaseResponse.headers.set("x-admin-host", "1")
    request.headers.set("x-admin-host", "1")
  }
  // Also set on request headers for server components
  if (eventId) request.headers.set("x-event-id", eventId)

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Dasbor super-admin (/super): hanya SUPER_ADMIN. Berlaku di semua host.
  if (pathname === "/super" || pathname.startsWith("/super/")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
    if (!(await isSuperAdmin(user.id))) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("error", "forbidden")
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect /admin and /admin/* — require auth + ADMIN (event-scoped) OR SUPER_ADMIN.
  // Matriks eksplisit: halaman super-only (users, peserta) ditolak untuk ADMIN di sini;
  // seksi event diizinkan untuk admin event ybs.
  const SUPER_ONLY_PREFIXES = ["/admin/users", "/admin/peserta", "/admin/events", "/admin/templates"]
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
    const superAdmin = await isSuperAdmin(user.id)
    if (!superAdmin && SUPER_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      url.searchParams.set("error", "forbidden")
      return NextResponse.redirect(url)
    }
    if (superAdmin) {
      return supabaseResponse
    }
    // event-scoped admin
    if (!eventId) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(url)
    }
    const ok = await isEventAdmin(eventId, user.id)
    if (!ok) {
      // Isolasi sewa ketat: admin event A di situs event B = user biasa.
      // Tidak ada fallback role global — keanggotaan event_members yang menentukan.
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(url)
    }
  }

  // Protect /api/admin/* — hanya admin event atau super admin.
  // API super-only (users, permissions) ditolak untuk ADMIN dengan JSON 403.
  const SUPER_ONLY_APIS = ["/api/admin/users", "/api/admin/permissions", "/api/admin/super-admins", "/api/admin/templates", "/api/admin/financials"]
  if (pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const superAdminApi = await isSuperAdmin(user.id)
    if (!superAdminApi && SUPER_ONLY_APIS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.json({ error: "Forbidden — di luar akses peran Anda" }, { status: 403 })
    }
    const superAdmin = await isSuperAdmin(user.id)
    if (superAdmin) return supabaseResponse
    if (!eventId) return NextResponse.json({ error: "Event not resolved" }, { status: 400 })
    const ok = await isEventAdmin(eventId, user.id)
    if (!ok) {
      return NextResponse.json({ error: "Forbidden — admin required for this event" }, { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/profile/:path*",
    "/participant/:path*",
    "/super",
    "/super/:path*",
  ],
}
