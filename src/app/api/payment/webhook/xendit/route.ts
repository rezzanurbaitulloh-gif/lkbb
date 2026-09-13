import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getPaymentProvider } from "@/lib/payment"
import { parseXenditQrCallback } from "@/lib/payment/xendit/webhook"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/payment/webhook/xendit",
    message: "Xendit Sandbox webhook ready — configure callback URL in Xendit dashboard to https://lkbb.vercel.app/api/payment/webhook/xendit",
    provider: "XENDIT",
  })
}

// POST /api/payment/webhook/xendit — verify x-callback-token, idempotency, create ledger only on PAID
// This is the ONLY authoritative trigger for ballot creation (Xendit mode)
export async function POST(req: Request) {
  let rawBody = ""
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  let bodyJson: any = {}
  try {
    bodyJson = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Verify Xendit callback token (server only)
  try {
    const provider = getPaymentProvider()
    if (provider.verifyWebhook) {
      const verify = await provider.verifyWebhook(req.headers as any, rawBody, bodyJson)
      if (!verify.valid) {
        console.warn("[xendit webhook] token invalid", verify.error)
        return NextResponse.json({ error: verify.error || "Invalid callback token" }, { status: 401 })
      }
    }
  } catch (e: any) {
    console.error("[xendit webhook] verify error", e)
    return NextResponse.json({ error: e.message || "Verify failed" }, { status: 401 })
  }

  // Normalize Xendit QR callback
  let normalized: ReturnType<typeof parseXenditQrCallback>
  try {
    normalized = parseXenditQrCallback(bodyJson)
    if (!normalized) {
      return NextResponse.json({ error: "Missing external_id" }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const externalId = normalized!.externalId
  const xenditId = normalized!.xenditId
  const status = normalized!.status // PAID, PENDING, FAILED, EXPIRED
  const amountValue = normalized!.amount

  // Find internal transaction: external_id IS our transaction.id
  const service = createServiceSupabase()
  let trx: any = null

  if (externalId) {
    const { data } = await service.from("transactions").select("*").eq("id", externalId).maybeSingle()
    if (data) trx = data
  }
  if (!trx && externalId) {
    const { data } = await service.from("transactions").select("*").eq("provider_ref", externalId).maybeSingle()
    if (data) trx = data
  }
  if (!trx && xenditId) {
    const { data } = await service.from("transactions").select("*").eq("doku_reference_no", xenditId).maybeSingle()
    if (data) trx = data
  }

  if (!trx) {
    console.warn("[xendit webhook] transaction not found", { externalId, xenditId })
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  // Only process XENDIT transactions here (DOKU dinonaktifkan)
  if (trx.provider && trx.provider !== "XENDIT") {
    console.warn("[xendit webhook] provider mismatch", { trxProvider: trx.provider, trxId: trx.id })
    return NextResponse.json({ error: "Provider mismatch" }, { status: 400 })
  }

  // Verify amount (server-side, never trust client)
  if (amountValue !== undefined && trx.amount !== undefined) {
    const expected = Number(trx.amount)
    const received = Number(amountValue)
    if (Math.abs(expected - received) > 0.01) {
      console.error("[xendit webhook] amount mismatch", { expected, received, trxId: trx.id })
      return NextResponse.json({ error: `Amount mismatch expected ${expected} got ${received}` }, { status: 400 })
    }
  }

  // Idempotency: if already Success, do not create ledger again
  if (trx.status === "Success" || trx.status === "PAID") {
    return NextResponse.json({ ok: true, message: "Already PAID (idempotent)" })
  }

  // Handle PAID — create ledger exactly once
  if (status === "PAID") {
    const { data: existing } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
    if (existing) {
      if (trx.status !== "Success") {
        await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
      }
      return NextResponse.json({ ok: true, message: "Ledger already exists (idempotent)" })
    }

    const { error: updErr } = await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
    if (updErr) {
      console.error("[xendit webhook] update transaction failed", updErr)
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    const supportsQty = Number(trx.supports)
    const amount = Number(trx.amount)
    if (!supportsQty || supportsQty < 1) {
      console.error("[xendit webhook] invalid supports qty", { supportsQty, trxId: trx.id })
      return NextResponse.json({ error: "Invalid supports quantity" }, { status: 400 })
    }

    const { error: supErr } = await service.from("supports").insert({
      peleton_id: trx.peleton_id,
      user_id: trx.user_id,
      transaction_id: trx.id,
      amount,
      supports: supportsQty,
      source: "online",
    })

    if (supErr) {
      const { data: dup } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
      if (dup) {
        return NextResponse.json({ ok: true, message: "Ledger exists after race (idempotent)" })
      }
      console.error("[xendit webhook] supports insert failed", supErr)
      return NextResponse.json({ error: supErr.message }, { status: 500 })
    }

    const { data: peleton } = await service.from("peletons").select("id, slug, name, school, category, number").eq("id", trx.peleton_id).maybeSingle()
    const { data: profile } = await service.from("profiles").select("public_name, email, avatar_url").eq("id", trx.user_id).maybeSingle()
    const supporterName = profile?.public_name || profile?.email?.split("@")[0] || "Seseorang"
    const supporterAvatar = (profile as any)?.avatar_url || null
    const peletonName = peleton?.name || peleton?.school || "peleton"
    const peletonSlug = peleton?.slug || ""
    const peletonCategory = peleton?.category || ""

    try {
      await service.from("notifications").insert([
        {
          user_id: null,
          title: "Dukungan Baru!",
          body: `Selamat!! ${supporterName} telah mendukung ${peletonName}`,
          peleton_id: trx.peleton_id,
          peleton_name: peletonName,
          peleton_slug: peletonSlug,
          supporter_name: supporterName,
          supporter_avatar: supporterAvatar,
          data: { is_private: false, is_public: true, peleton_category: peletonCategory, peleton_number: peleton?.number, supporter_avatar: supporterAvatar, ballot_quantity: supportsQty },
        },
        {
          user_id: trx.user_id,
          title: "Dukungan Berhasil!",
          body: `Selamat!! Kamu telah mendukung ${peletonName} — ${supportsQty} ballot`,
          peleton_id: trx.peleton_id,
          peleton_name: peletonName,
          peleton_slug: peletonSlug,
          supporter_name: supporterName,
          supporter_avatar: supporterAvatar,
          data: { is_private: true, ballot_quantity: supportsQty, peleton_category: peletonCategory, peleton_number: peleton?.number, supporter_avatar: supporterAvatar },
        },
      ])
    } catch (notifErr) {
      console.error("[xendit webhook] notifications insert failed", notifErr)
    }

    try {
      await service.from("audit_logs").insert({
        action: "transaction_paid",
        target: trx.id,
        details: { provider: "XENDIT", provider_ref: xenditId || externalId, amount, supports: supportsQty, peleton_id: trx.peleton_id },
      })
    } catch {}

    return NextResponse.json({ ok: true, shouldRecordSupport: true })
  }

  // Handle FAILED / EXPIRED — update transaction, no ledger
  if (status === "FAILED" || status === "EXPIRED") {
    if (trx.status === "Success") {
      return NextResponse.json({ ok: true, message: "Already PAID, ignoring" })
    }
    await service.from("transactions").update({ status: status === "FAILED" ? "Failed" : "Expired" }).eq("id", trx.id)
    return NextResponse.json({ ok: true })
  }

  // PENDING — just ack
  return NextResponse.json({ ok: true, message: "Pending, no action" })
}
