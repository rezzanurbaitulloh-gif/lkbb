import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Status admin milik sendiri — dipakai UI publik untuk menampilkan/menyembunyikan menu ADMIN.
// Meniru logika proteksi di middleware.ts: SUPER_ADMIN (platform_roles) > profiles.role > event_members.
export async function GET(req: Request) {
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
  if (!user) return NextResponse.json({ admin: false })

  const service = createServiceSupabase()

  // 1) Super admin platform
  try {
    const { data } = await service.from("platform_roles").select("user_id").eq("user_id", user.id).maybeSingle()
    if (data) return NextResponse.json({ admin: true, role: "SUPER_ADMIN" })
  } catch {}

  // 2) Role global legacy
  try {
    const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single()
    if (["ADMIN","SUPER_ADMIN"].includes((profile as any)?.role || "")) {
      return NextResponse.json({ admin: true, role: (profile as any).role })
    }
  } catch {}

  // 3) Admin event (event_members)
  try {
    const host = (req.headers as any).get?.("host") || (req.headers as any).get?.("x-forwarded-host") || ""
    const { resolveEventFromHost } = await import("@/lib/event")
    const { eventId } = await resolveEventFromHost(host)
    if (eventId) {
      const { data } = await service.from("event_members").select("id").eq("event_id", eventId).eq("user_id", user.id).eq("role", "ADMIN").eq("status", "active").maybeSingle()
      if (data) return NextResponse.json({ admin: true, role: "ADMIN" })
    }
  } catch {}

  return NextResponse.json({ admin: false })
}
