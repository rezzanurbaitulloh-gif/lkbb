// Server-side auth helpers — use in Server Components and Route Handlers
import { createServerSupabase, createServiceSupabase } from "./supabase"

export type AuthUser = {
  id: string
  email: string | undefined
  role: string | null
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
  if (!user) return { authorized: false as const, status: 401, error: "Unauthorized", supabase, user: null }
  if (!["ADMIN","SUPER_ADMIN"].includes(user.role || "")) {
    return { authorized: false as const, status: 403, error: "Forbidden — admin required", supabase, user }
  }
  return { authorized: true as const, supabase, user }
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
