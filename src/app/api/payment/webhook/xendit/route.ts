import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"
import { getPaymentProvider } from "@/lib/payment"
import { parseXenditQrCallback } from "@/lib/payment/xendit/webhook"
import { settlePaidTransaction } from "@/lib/payment/settle"
import crypto from "crypto"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/payment/webhook/xendit",
    message: "Xendit Sandbox webhook ready — configure callback URL in Xendit dashboard to https://lkbb.my.id/api/payment/webhook/xendit",
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

  // Webhook idempotency: payload_hash unique (PRD §30)
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex")
  const service = createServiceSupabase()
  // Try to insert webhook event first; if duplicate, return idempotent
  try {
    const { error: whErr } = await (service as any).from("payment_webhook_events").insert({
      provider: "XENDIT",
      provider_event_id: xenditId || externalId,
      order_id: externalId,
      payload_hash: payloadHash,
      processed: false,
    } as any)
    if (whErr && whErr.message?.includes("duplicate") || (whErr as any)?.code === "23505") {
      return NextResponse.json({ ok: true, message: "Duplicate webhook (idempotent)" })
    }
  } catch {}
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
  // Link webhook event to transaction's event_id
  try {
    await (service as any).from("payment_webhook_events").update({ event_id: (trx as any).event_id, order_id: trx.id, processed: status === "PAID" }).eq("payload_hash", payloadHash)
  } catch {}

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

  // Handle PAID — create ledger exactly once (shared helper with simulate endpoint)
  if (status === "PAID") {
    const settled = await settlePaidTransaction(service, trx, "XENDIT", xenditId || externalId)
    if (!settled.ok) {
      return NextResponse.json({ error: settled.message || "Settle failed" }, { status: settled.status || 500 })
    }
    return NextResponse.json({ ok: true, shouldRecordSupport: true, message: settled.message })
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
