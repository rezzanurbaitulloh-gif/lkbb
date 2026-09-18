import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase"
import { AdminNav } from "@/components/admin/AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }){
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?redirect=/admin")
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const role = profile?.role
  if (!(["ADMIN","SUPER_ADMIN"].includes(role || ""))) {
    redirect("/?error=unauthorized")
  }
  return <AdminNav>{children}</AdminNav>
}
