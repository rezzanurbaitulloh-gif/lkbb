import { NextResponse } from "next/server"
import { createServiceSupabase, createServerSupabase } from "@/lib/supabase"

// GET /api/payment/status/[id] — safe status check, never auto-marks PAID (webhook is authoritative)
// Polling is for UX only
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const service = createServiceSupabase()
    const { data: trx, error } = await service.from("transactions").select("*").eq("id", id).single()
    if (error || !trx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

    // Check ownership unless admin
    const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single()
    const isAdmin = profile?.role === "ADMIN"
    if (!isAdmin && trx.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If already Success, return immediately
    if (trx.status === "Success") {
      return NextResponse.json({ status: "Success", transaction: trx })
    }

    // Auto-expire check: if now > expires_at, mark Expired (15 menit batas)
    if (trx.status === "Pending" && (trx as any).expires_at) {
      const expires = new Date((trx as any).expires_at).getTime()
      if (!isNaN(expires) && Date.now() > expires) {
        await service.from("transactions").update({ status: "Expired" }).eq("id", trx.id).eq("status", "Pending")
        try {
          await service.from("audit_logs").insert({ action: "transaction_expired_check", target: trx.id, details: { reason: "15min timeout via status check", expires_at: (trx as any).expires_at } })
        } catch {}
        return NextResponse.json({ status: "Expired", transaction: { ...trx, status: "Expired" } })
      }
    }

    // ===== DOKU DINONAKTIFKAN (di-comment) — lihat git history untuk fallback query DOKU =====
    // For XENDIT Pending, try to query Xendit directly as fallback (in case webhook missed)
    // Webhook remains primary
    if (trx.provider === "XENDIT" && trx.status === "Pending") {
      try {
        const { queryXenditQr } = await import("@/lib/payment/xendit/qr")
        const q = await queryXenditQr(trx.id)
        if (q.status === "PAID") {
          // Update transaction and create ledger (same idempotency as webhook)
          await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
          const { data: existing } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
          if (!existing) {
            await service.from("supports").insert({
              peleton_id: trx.peleton_id,
              user_id: trx.user_id,
              transaction_id: trx.id,
              amount: trx.amount,
              supports: trx.supports,
              source: "online",
            })
            // Dual notifications
            const { data: peleton } = await service.from("peletons").select("id, slug, name, school, category, number").eq("id", trx.peleton_id).maybeSingle()
            const { data: profile2 } = await service.from("profiles").select("public_name, email").eq("id", trx.user_id).maybeSingle()
            const supporterName = profile2?.public_name || profile2?.email?.split("@")[0] || "Seseorang"
            const peletonName = peleton?.name || peleton?.school || "peleton"
            try {
              await service.from("notifications").insert([
                { user_id: null, title: "Dukungan Baru!", body: `Selamat!! ${supporterName} telah mendukung ${peletonName}`, peleton_id: trx.peleton_id, peleton_name: peletonName, peleton_slug: peleton?.slug||"", supporter_name: supporterName, data: { is_private:false, is_public:true, peleton_category: peleton?.category, peleton_number: peleton?.number } },
                { user_id: trx.user_id, title: "Dukungan Berhasil!", body: `Selamat!! Kamu telah mendukung ${peletonName} — ${trx.supports} ballot`, peleton_id: trx.peleton_id, peleton_name: peletonName, peleton_slug: peleton?.slug||"", supporter_name: supporterName, data: { is_private:true, ballot_quantity: trx.supports, peleton_category: peleton?.category, peleton_number: peleton?.number } },
              ])
            } catch {}
            await service.from("audit_logs").insert({ action: "transaction_paid_via_status_check", target: trx.id, details: { provider: "XENDIT", via: "status_query", amount: trx.amount } })
          }
          return NextResponse.json({ status: "Success", transaction: { ...trx, status: "Success" }, xendit: q.raw })
        } else if (q.status === "FAILED" || q.status === "EXPIRED") {
          await service.from("transactions").update({ status: "Expired" }).eq("id", trx.id)
          return NextResponse.json({ status: "Expired", transaction: { ...trx, status: "Expired" }, xendit: q.raw })
        } else {
          // still pending, return pending with xendit info for UX
          return NextResponse.json({ status: trx.status, transaction: trx, xendit: q.raw })
        }
      } catch (e) {
        console.error("[status] Xendit query failed", e)
        // fall through to return DB status
      }
    }

    return NextResponse.json({ status: trx.status, transaction: trx })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
