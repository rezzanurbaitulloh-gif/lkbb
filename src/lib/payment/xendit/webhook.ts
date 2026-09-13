import { getXenditConfig } from "./config"

// Xendit QR callback verification — header x-callback-token must equal
// webhook verification token from dashboard (Settings > Webhooks)
export function verifyXenditWebhookToken(headers: Headers): { valid: boolean; error?: string } {
  const cfg = getXenditConfig()
  const token = headers.get("x-callback-token") || headers.get("X-Callback-Token") || ""
  if (!cfg.webhookToken) return { valid: false, error: "XENDIT_WEBHOOK_TOKEN belum di-set di server" }
  if (!token) return { valid: false, error: "Missing x-callback-token" }
  if (token !== cfg.webhookToken) return { valid: false, error: "Invalid callback token" }
  return { valid: true }
}

export type XenditQrCallback = {
  externalId: string
  xenditId: string
  status: "PAID" | "PENDING" | "FAILED" | "EXPIRED"
  amount?: number
}

// Accept both shapes: flat {..., external_id, status} and { data: {...} }
export function parseXenditQrCallback(body: any): XenditQrCallback | null {
  const d = body?.data && typeof body.data === "object" ? body.data : body
  if (!d || typeof d !== "object") return null
  const externalId = String(d.external_id || d.externalId || "")
  if (!externalId) return null
  const rawStatus = String(d.status || "").toUpperCase()
  let status: XenditQrCallback["status"] = "PENDING"
  if (["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED"].includes(rawStatus)) status = "PAID"
  else if (["EXPIRED", "INACTIVE"].includes(rawStatus)) status = "EXPIRED"
  else if (["FAILED", "FAILURE"].includes(rawStatus)) status = "FAILED"
  const amount = d.amount !== undefined ? Number(d.amount) : undefined
  return { externalId, xenditId: String(d.id || ""), status, amount }
}
