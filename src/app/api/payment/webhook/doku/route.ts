import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getPaymentProvider } from "@/lib/payment"
import { parseDokuNotification } from "@/lib/payment/doku/webhook"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/payment/webhook/doku",
    message: "DOKU webhook ready — configure in DOKU dashboard to https://lkbbvoting.my.id/api/payment/webhook/doku",
    provider: "DOKU",
  })
}

// ===== DOKU DINONAKTIFKAN (di-comment) — pakai Xendit Sandbox: /api/payment/webhook/xendit =====
// POST /api/payment/webhook/doku — DISABLED, see git history for original logic
export async function POST(_req: Request) {
  return NextResponse.json({ error: "DOKU disabled — gunakan Xendit", provider: "XENDIT" }, { status: 410 })
}
/* ===== original DOKU logic (disabled, kept for reference) =====
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

  // Verify DOKU signature (symmetric HMAC with SECRET_KEY)
  // Never expose secret to browser — server only
  try {
    const provider = getPaymentProvider()
    // Use provider's verifyWebhook if available
    if (provider.verifyWebhook) {
      const headers = req.headers
      const verify = await provider.verifyWebhook(headers as any, rawBody, bodyJson)
      if (!verify.valid) {
        console.warn("[doku webhook] signature invalid", verify.error)
        return NextResponse.json({ error: verify.error || "Invalid signature" }, { status: 401 })
      }
    }
  } catch (e: any) {
    console.error("[doku webhook] verify error", e)
    return NextResponse.json({ error: e.message || "Signature verify failed" }, { status: 401 })
  }

  // Normalize DOKU notification
  let normalized: ReturnType<typeof parseDokuNotification>
  try {
    normalized = parseDokuNotification(bodyJson)
    if (!normalized) {
      return NextResponse.json({ error: "Missing partnerReferenceNo" }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const partnerReferenceNo = normalized!.partnerReferenceNo
  const referenceNo = normalized!.referenceNo
  const status = normalized!.status // PAID, PENDING, FAILED...
  const amountValue = normalized!.amountNumber
  const currency = normalized!.currency || "IDR"

  // Find internal transaction by partnerReferenceNo (which is our transactionId)
  // Also fallback to provider_ref / doku_reference_no
  const service = createServiceSupabase()
  let trx: any = null

  // Primary: partnerReferenceNo is our transaction.id (UUID)
  // Validate UUID format loosely: if it contains '-', try direct id lookup
  if (partnerReferenceNo) {
    // Try as transaction id directly
    const { data } = await service.from("transactions").select("*").eq("id", partnerReferenceNo).maybeSingle()
    if (data) trx = data
  }

  // Fallback: lookup by provider_ref or doku_reference_no
  if (!trx && partnerReferenceNo) {
    const { data } = await service.from("transactions").select("*").eq("provider_ref", partnerReferenceNo).maybeSingle()
    if (data) trx = data
  }
  if (!trx && referenceNo) {
    const { data } = await service.from("transactions").select("*").eq("doku_reference_no", referenceNo).maybeSingle()
    if (data) trx = data
  }
  if (!trx && partnerReferenceNo) {
    const { data } = await service.from("transactions").select("*").eq("doku_reference_no", partnerReferenceNo).maybeSingle()
    if (data) trx = data
  }

  if (!trx) {
    console.warn("[doku webhook] transaction not found", { partnerReferenceNo, referenceNo })
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  // Verify provider is DOKU (or allow XENDIT historical? But DOKU webhook should only affect DOKU transactions)
  // If transaction provider is XENDIT, we should not process DOKU webhook for it — but we can still allow if amount matches and status PAID, but log
  if (trx.provider && trx.provider !== "DOKU") {
    console.warn("[doku webhook] provider mismatch", { trxProvider: trx.provider, webhookProvider: "DOKU", trxId: trx.id })
    // For safety, still allow if transaction is Pending and DOKU webhook is PAID, but we should verify amount
    // Do not reject outright — but we will verify amount and continue
  }

  // Verify amount (server-side, never trust client)
  if (amountValue !== undefined && trx.amount !== undefined) {
    const expected = Number(trx.amount)
    const received = Number(amountValue)
    if (Math.abs(expected - received) > 0.01) {
      console.error("[doku webhook] amount mismatch", { expected, received, trxId: trx.id })
      return NextResponse.json({ error: `Amount mismatch expected ${expected} got ${received}` }, { status: 400 })
    }
  }

  // Verify currency
  if (currency && currency !== "IDR") {
    console.warn("[doku webhook] currency not IDR", { currency, trxId: trx.id })
    // still continue, but log
  }

  // Idempotency: if already PAID/Success, do not create ledger again
  // Check transaction status
  if (trx.status === "Success" || trx.status === "PAID") {
    if (status === "PAID") {
      return NextResponse.json({ ok: true, message: "Already PAID (idempotent)" })
    }
    // If webhook says FAILED but transaction already PAID, do not downgrade
    console.warn("[doku webhook] transaction already PAID, ignoring status", { status, trxId: trx.id })
    return NextResponse.json({ ok: true, message: "Already PAID, ignoring" })
  }

  // State machine: only allow PENDING -> PAID/FAILED/EXPIRED, not PAID -> anything
  // If current status is not Pending, do not overwrite
  const currentStatus = (trx.status || "Pending").toUpperCase()
  if (currentStatus !== "PENDING" && currentStatus !== "PENDING") {
    // Actually DB uses Pending, Success, Failed, Expired (capital first)
    if (currentStatus === "SUCCESS" || currentStatus === "PAID") {
      return NextResponse.json({ ok: true, message: "Already success" })
    }
  }

  // Handle PAID — create ledger exactly once
  if (status === "PAID") {
    // Idempotency via transaction_id in supports: check if ledger already exists
    const { data: existing } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
    if (existing) {
      // Ensure transaction marked Success if not already
      if (trx.status !== "Success") {
        await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
      }
      return NextResponse.json({ ok: true, message: "Ledger already exists (idempotent)" })
    }

    // Update transaction to Success (PAID)
    const { error: updErr } = await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
    if (updErr) {
      console.error("[doku webhook] update transaction failed", updErr)
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    // Use immutable transaction data for ballot creation (never trust webhook quantity)
    const supportsQty = Number(trx.supports)
    const amount = Number(trx.amount)
    if (!supportsQty || supportsQty < 1) {
      console.error("[doku webhook] invalid supports qty", { supportsQty, trxId: trx.id })
      return NextResponse.json({ error: "Invalid supports quantity" }, { status: 400 })
    }

    // Insert into supports ledger (immutable)
    const { error: supErr } = await service.from("supports").insert({
      peleton_id: trx.peleton_id,
      user_id: trx.user_id,
      transaction_id: trx.id,
      amount,
      supports: supportsQty,
      source: "online",
    })

    if (supErr) {
      // If duplicate due to race, check again
      const { data: dup } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
      if (dup) {
        return NextResponse.json({ ok: true, message: "Ledger exists after race (idempotent)" })
      }
      console.error("[doku webhook] supports insert failed", supErr)
      return NextResponse.json({ error: supErr.message }, { status: 500 })
    }

    // Fetch peleton + supporter for notifications (preserve existing logic)
    const { data: peleton } = await service.from("peletons").select("id, slug, name, school, category, number").eq("id", trx.peleton_id).maybeSingle()
    const { data: profile } = await service.from("profiles").select("public_name, email, avatar_url").eq("id", trx.user_id).maybeSingle()
    const supporterName = profile?.public_name || profile?.email?.split("@")[0] || "Seseorang"
    const supporterAvatar = (profile as any)?.avatar_url || null
    const peletonName = peleton?.name || peleton?.school || "peleton"
    const peletonSlug = peleton?.slug || ""
    const peletonCategory = peleton?.category || ""

    // Dual notifications: public (everyone) without quantity, private (supporter) with quantity — include avatar
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
      console.error("[doku webhook] notifications insert failed", notifErr)
      // Do not fail webhook — ledger already created
    }

    // Audit log
    try {
      await service.from("audit_logs").insert({
        action: "transaction_paid",
        target: trx.id,
        details: { provider: "DOKU", provider_ref: referenceNo || partnerReferenceNo, amount, supports: supportsQty, peleton_id: trx.peleton_id },
      })
    } catch {}

    return NextResponse.json({ ok: true, shouldRecordSupport: true })
  }

  // Handle FAILED / EXPIRED / CANCELLED — update transaction, no ledger, no notification
  if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
    let dbStatus: string = status
    if (status === "CANCELLED") dbStatus = "Failed"
    // Do not overwrite PAID
    if (trx.status === "Success") {
      return NextResponse.json({ ok: true, message: "Already PAID, ignoring failed" })
    }
    await service.from("transactions").update({ status: dbStatus }).eq("id", trx.id)
    return NextResponse.json({ ok: true })
  }

  // PENDING — just ack
  if (status === "PENDING") {
    return NextResponse.json({ ok: true, message: "Pending, no action" })
  }

  console.warn("[doku webhook] unknown status", { status, raw: bodyJson })
  return NextResponse.json({ ok: true, message: "Unknown status, no action" })
  } // end if(false) — DOKU disabled
===== end disabled DOKU logic ===== */
