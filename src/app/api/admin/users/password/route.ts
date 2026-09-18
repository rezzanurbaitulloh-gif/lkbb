import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin(){
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(){ return cookieStore.getAll() },
        setAll(c){ try{ c.forEach(({name,value,options})=> cookieStore.set(name,value,options)) }catch{} },
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return { ok:false as const, status:401 }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if(!["ADMIN","SUPER_ADMIN"].includes(profile?.role || "")) return { ok:false as const, status:403 }
  return { ok:true as const, user }
}

export async function POST(req: Request){
  const auth = await requireAdmin()
  if(!auth.ok) return NextResponse.json({ error:"Tidak punya izin — hanya admin" }, { status: auth.status })
  const { userId, newPassword } = await req.json()
  if(!userId || !newPassword || newPassword.length<6) return NextResponse.json({ error:"Kata sandi minimal 6 karakter" }, { status:400 })
  const service = createServiceSupabase()
  // Supabase Admin API to update user password
  const { error } = await service.auth.admin.updateUserById(userId, { password: newPassword })
  if(error) return NextResponse.json({ error: error.message }, { status:500 })
  await service.from("audit_logs").insert({ user_id: auth.user.id, action:"password_update", target: userId })
  return NextResponse.json({ ok:true })
}
