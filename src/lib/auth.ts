// Server-side auth helpers — use in Server Components and Route Handlers
import { createServerSupabase, createServiceSupabase } from "./supabase"
import { canAccessSection, type AdminSectionKey } from "./permissions"

export type AuthUser = {
  id: string
  email: string | undefined
  role: string | null
}

export type AdminContext = {
  userId: string
  email: string | undefined
  profileRole: string | null
  isSuper: boolean
  eventIds: string[]
  scope: "all" | "own" | "none"
}

// Konteks admin eksplisit — sumber kebenaran peran:
// SUPER_ADMIN = baris platform_roles ATAU profiles.role SUPER_ADMIN.
// ADMIN event = baris event_members aktif (kunci matriks untuk peran admin).
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceSupabase()
  const [{ data: profile }, { data: plat }, { data: members }] = await Promise.all([
    service.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    service.from("platform_roles").select("user_id").eq("user_id", user.id).maybeSingle(),
    service.from("event_members").select("event_id").eq("user_id", user.id).eq("role", "ADMIN").eq("status", "active"),
  ])
  const profileRole = (profile as any)?.role || null
  const isSuper = !!plat || profileRole === "SUPER_ADMIN"
  const eventIds = ((members as any) || []).map((m: any) => m.event_id)
  const scope: AdminContext["scope"] = isSuper ? "all" : eventIds.length > 0 ? "own" : "none"
  return { userId: user.id, email: user.email, profileRole, isSuper, eventIds, scope }
}

// Guard seksi matriks untuk API routes / server components.
// 401 belum login; 403 di luar akses (termasuk ADMIN ke seksi super-only).
export async function requireSection(section: AdminSectionKey): Promise<
  | { authorized: true; ctx: AdminContext; supabase: Awaited<ReturnType<typeof createServerSupabase>> }
  | { authorized: false; status: 401 | 403; error: string; ctx: null; supabase: Awaited<ReturnType<typeof createServerSupabase>> }
> {
  const supabase = await createServerSupabase()
  const ctx = await getAdminContext()
  if (!ctx) return { authorized: false, status: 401, error: "Unauthorized", ctx: null, supabase }
  if (!canAccessSection(section, ctx.isSuper)) {
    return { authorized: false, status: 403, error: "Forbidden — di luar akses peran Anda", ctx: null, supabase }
  }
  return { authorized: true, ctx, supabase }
}

export async function getServerUser(): Promise<{ user: AuthUser | null; supabase: Awaited<ReturnType<typeof createServerSupabase>> }> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return {
    user: { id: user.id, email: user.email, role: profile?.role ?? null },
    supabase,
  }
}

export async function requireAdmin() {
  const { user, supabase } = await getServerUser()
  if (!user) return { authorized: false as const, status: 401, error: "Unauthorized", supabase, user: null, ctx: null }
  // Selaras matriks: SUPER_ADMIN platform, profiles ADMIN (legacy), atau ADMIN event (event_members).
  const ctx = await getAdminContext()
  if (!ctx || ctx.scope === "none") {
    return { authorized: false as const, status: 403, error: "Forbidden — admin required", supabase, user, ctx: null }
  }
  return { authorized: true as const, supabase, user, ctx }
}

export async function requirePermission(permission: string) {
  const { user, supabase } = await getServerUser()
  if (!user) return { authorized: false as const, status: 401 as const, error: "Unauthorized", supabase, user: null }
  if (["ADMIN","SUPER_ADMIN"].includes(user.role || "")) return { authorized: true as const, supabase, user }
  // check role_permissions override, fallback to defaults via RBAC
  const { hasPermission } = await import("./rbac")
  // try DB override
  try {
    const { data: rolePerm } = await supabase.from("role_permissions").select("granted").eq("role", user.role).eq("permission_key", permission).single()
    if (rolePerm) {
      if (!rolePerm.granted) return { authorized: false as const, status: 403 as const, error: "Forbidden — missing permission", supabase, user }
      return { authorized: true as const, supabase, user }
    }
  } catch {}
  if (!hasPermission(user.role, permission as any)) {
    return { authorized: false as const, status: 403 as const, error: "Forbidden — missing permission", supabase, user }
  }
  return { authorized: true as const, supabase, user }
}

export async function requireAuth() {
  const { user, supabase } = await getServerUser()
  if (!user) return { authorized: false as const, status: 401, error: "Unauthorized", supabase, user: null }
  return { authorized: true as const, supabase, user }
}
