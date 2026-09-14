import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const ALLOWED_TABLES = ["peletons","news","announcements","timeline_stages","judges","sponsors","faqs","profiles","audit_logs","transactions","supports","competitions"]

async function requireAdmin(){
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(){ return cookieStore.getAll() },
        setAll(cookiesToSet){ try{ cookiesToSet.forEach(({name,value,options})=> cookieStore.set(name,value,options)) } catch{} },
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return { ok:false as const, status:401 }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if(profile?.role !== "ADMIN") return { ok:false as const, status:403 }
  return { ok:true as const, user, role: profile?.role }
}

export async function POST(req: Request){
  const auth = await requireAdmin() as any
  if(!auth.ok) return NextResponse.json({ error:"Unauthorized" }, { status: auth.status })
  const body = await req.json()
  const { table, data } = body
  if(!ALLOWED_TABLES.includes(table)) return NextResponse.json({ error:"Table not allowed" }, { status:400 })
  const service = createServiceSupabase()
  // For peletons, force verified + duplicate prevention per kategori (SMP/SMA terpisah)
  if(table==="peletons"){
    data.verified = true
    data.status = "Verified"
    if(!data.active) data.active = true
    // nomor urut = urutan tampil, per kategori tidak boleh duplikat lintas kategori dianggap beda
    if(data.number || data.name){
      const cat = String(data.category || "").trim()
      if(cat){
        // normalize number: "03" == "3"
        const normNum = (n:any)=> String(n||"").replace(/^0+/, "") || "0"
        const targetNumNorm = normNum(data.number)
        const targetNameNorm = String(data.name||"").toLowerCase().trim()
        const { data: existing } = await service.from("peletons").select("id, number, name, category").eq("category", cat)
        if(existing && existing.length>0){
          const dup = existing.find(e=> {
            const sameNum = e.number != null && data.number != null && normNum(e.number) === targetNumNorm
            const sameName = e.name && data.name && String(e.name).toLowerCase().trim() === targetNameNorm
            return sameNum || sameName
          })
          if(dup) return NextResponse.json({ error: `Data tim sudah ada di kategori ${cat}: #${dup.number} ${dup.name}. Nomor urut & nama tidak boleh duplikat dalam kategori yang sama, lintas kategori boleh sama.` }, { status:409 })
        }
      }
    }
  }
  // Generic duplicate prevention for other important tables: name unique where applicable
  if(["sponsors","judges","news"].includes(table) && data.name){
    const { data: dup } = await service.from(table).select("id").ilike("name", data.name).limit(1)
    if(dup && dup.length>0) return NextResponse.json({ error: `Data ${table} dengan nama "${data.name}" sudah ada` }, { status:409 })
  }
  const { data: inserted, error } = await service.from(table).insert(data).select().single()
  if(error) return NextResponse.json({ error: error.message }, { status:500 })
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: `${table}_create`, target: inserted.id, details: data })
  return NextResponse.json(inserted)
}

export async function PATCH(req: Request){
  const auth = await requireAdmin() as any
  if(!auth.ok) return NextResponse.json({ error:"Unauthorized" }, { status: auth.status })
  const body = await req.json()
  const { table, id, data } = body
  if(!ALLOWED_TABLES.includes(table) || !id) return NextResponse.json({ error:"Invalid" }, { status:400 })
  const service = createServiceSupabase()
  // Isolasi per-admin untuk transaksi & supports
  if(table === "transactions"){
    const { data: trx } = await service.from("transactions").select("user_id").eq("id", id).maybeSingle()
    if(trx && trx.user_id !== auth.user.id) return NextResponse.json({ error:"Forbidden: bukan milik Anda" }, { status:403 })
  }
  if(table === "supports"){
    const { data: sup } = await service.from("supports").select("admin_id, user_id").eq("id", id).maybeSingle()
    if(sup){
      const owner = (sup as any).admin_id || (sup as any).user_id
      if(owner && owner !== auth.user.id) return NextResponse.json({ error:"Forbidden: bukan milik Anda" }, { status:403 })
    }
  }
  // Duplicate prevention on update for peletons per kategori
  if(table==="peletons" && (data.number || data.name)){
    const cat = String(data.category || "").trim()
    // butuh category untuk cek per kategori; jika tidak ada di payload, ambil dari DB existing
    let checkCat = cat
    if(!checkCat){
      const { data: cur } = await service.from("peletons").select("category").eq("id", id).single()
      checkCat = (cur as any)?.category || ""
    }
    if(checkCat){
      const normNum = (n:any)=> String(n||"").replace(/^0+/, "") || "0"
      const targetNumNorm = data.number != null ? normNum(data.number) : null
      const targetNameNorm = data.name ? String(data.name).toLowerCase().trim() : null
      const { data: existing } = await service.from("peletons").select("id, number, name, category").eq("category", checkCat)
      if(existing){
        const dup = existing.find(e=> {
          if(e.id===id) return false
          const sameNum = targetNumNorm != null && e.number != null && normNum(e.number) === targetNumNorm
          const sameName = targetNameNorm && e.name && String(e.name).toLowerCase().trim() === targetNameNorm
          return sameNum || sameName
        })
        if(dup) return NextResponse.json({ error: `Data tim sudah ada di kategori ${checkCat}: #${dup.number} ${dup.name}. Tidak boleh duplikat dalam kategori yang sama.` }, { status:409 })
      }
    }
  }
  const { data: updated, error } = await service.from(table).update(data).eq("id", id).select().single()
  if(error) return NextResponse.json({ error: error.message }, { status:500 })
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: `${table}_update`, target: id, details: data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request){
  const auth = await requireAdmin() as any
  if(!auth.ok) return NextResponse.json({ error:"Unauthorized" }, { status: auth.status })
  const { searchParams } = new URL(req.url)
  const table = searchParams.get("table")
  const id = searchParams.get("id")
  if(!table || !id || !ALLOWED_TABLES.includes(table)) return NextResponse.json({ error:"Invalid" }, { status:400 })
  const service = createServiceSupabase()
  // Isolasi per-admin untuk transaksi & offline: hanya pemilik yang boleh hapus
  if(table === "transactions"){
    const { data: trx } = await service.from("transactions").select("user_id").eq("id", id).maybeSingle()
    if(trx && trx.user_id !== auth.user.id) return NextResponse.json({ error:"Forbidden: bukan milik Anda" }, { status:403 })
    // also delete supports linked to this transaction
    await service.from("supports").delete().eq("transaction_id", id)
  }
  if(table === "supports"){
    const { data: sup } = await service.from("supports").select("admin_id, user_id, source").eq("id", id).maybeSingle()
    if(sup){
      const owner = (sup as any).admin_id || (sup as any).user_id
      if(owner && owner !== auth.user.id) return NextResponse.json({ error:"Forbidden: bukan milik Anda" }, { status:403 })
    }
  }
  // Handle FK: peleton has FK from transactions & supports. Delete children first.
  if(table === "peletons"){
    // Delete supports (cascade already, but ensure)
    await service.from("supports").delete().eq("peleton_id", id)
    // Delete transactions referencing this peleton
    await service.from("transactions").delete().eq("peleton_id", id)
    // Also clean peleton_members & gallery if exist (obsolete tables)
    try { await service.from("peleton_members").delete().eq("peleton_id", id) } catch {}
    try { await service.from("peleton_gallery").delete().eq("peleton_id", id) } catch {}
  }
  const { error } = await service.from(table).delete().eq("id", id)
  if(error) return NextResponse.json({ error: error.message }, { status:500 })
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: `${table}_delete`, target: id })
  return NextResponse.json({ ok:true })
}
