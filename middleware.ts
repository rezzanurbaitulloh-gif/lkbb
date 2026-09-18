import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function resolveEventIdFromHost(host: string | null): Promise<string | null> {
  if (!host) return null
  const h = host.split(":")[0].toLowerCase().trim()
  const service = getServiceClient()
  if (!service) return null
  // exact domain
  const { data: dom } = await service.from("event_domains").select("event_id").eq("domain", h).maybeSingle()
  if (dom?.event_id) return dom.event_id
  const m = h.match(/^([a-z0-9-]+)\.lkbb\.vercel\.app$/)
  if (m) {
    const slug = m[1]
    const { data: ev } = await service.from("events").select("id").eq("slug", slug).maybeSingle()
    if (ev?.id) return ev.id
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

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || ""
  // Resolve event per-request (cache inside function is per-instance, but we do simple DB lookup)
  let eventId: string | null = null
  try { eventId = await resolveEventIdFromHost(host) } catch {}

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
    supabaseResponse.headers.set("x-event-slug", "lkbbvote")
  }
  // Also set on request headers for server components
  if (eventId) request.headers.set("x-event-id", eventId)

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect /admin and /admin/* — require auth + ADMIN (event-scoped) OR SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
    const superAdmin = await isSuperAdmin(user.id)
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
      // fallback: legacy global ADMIN in profiles (for migration period)
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "ADMIN" && profile?.role !== "SUPER_ADMIN") {
        const url = request.nextUrl.clone()
        url.pathname = "/"
        url.searchParams.set("error", "unauthorized")
        return NextResponse.redirect(url)
      }
    }
  }

  // Protect /api/admin/* — hanya admin event atau super admin
  if (pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const superAdmin = await isSuperAdmin(user.id)
    if (superAdmin) return supabaseResponse
    if (!eventId) return NextResponse.json({ error: "Event not resolved" }, { status: 400 })
    const ok = await isEventAdmin(eventId, user.id)
    if (!ok) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "ADMIN" && profile?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden — admin required for this event" }, { status: 403 })
      }
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
  ],
}
