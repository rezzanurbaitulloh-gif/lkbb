import { getXenditConfig, xenditAuthHeader } from "./config"

export type XenditQrCreateParams = {
  externalId: string // our internal transaction id
  amount: number // IDR, integer
  description?: string
  expiresAt?: string // ISO8601, will be sent as expires_at
}

export type XenditQrCreateResult = {
  xenditId: string
  externalId: string
  qrString: string
  status: string
  raw: any
}

// POST /qr_codes — create dynamic QRIS (sandbox key => test mode)
export async function createXenditQr(params: XenditQrCreateParams): Promise<XenditQrCreateResult> {
  const cfg = getXenditConfig()
  if (!cfg.secretKey) throw new Error("XENDIT_SECRET_KEY belum di-set di server (.env & Vercel)")

  const body: Record<string, any> = {
    external_id: params.externalId,
    type: "DYNAMIC",
    callback_url: cfg.callbackUrl,
    amount: Math.round(params.amount),
  }
  if (params.description) body.description = params.description.slice(0, 200)
  if (params.expiresAt) body.expires_at = params.expiresAt

  const res = await fetch(`${cfg.baseUrl}/qr_codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: xenditAuthHeader(cfg.secretKey),
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(async () => ({ text: await res.text() }))
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.error || JSON.stringify(data).slice(0, 500)
    throw new Error(`Xendit QR create gagal ${res.status}: ${msg}`)
  }

  const qrString = (data as any)?.qr_string
  if (!qrString) throw new Error("Xendit tidak mengembalikan qr_string — cek secret key & amount")

  return {
    xenditId: (data as any)?.id || "",
    externalId: (data as any)?.external_id || params.externalId,
    qrString,
    status: (data as any)?.status || "ACTIVE",
    raw: data,
  }
}

export type XenditQrStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED"

// GET /qr_codes/:external_id — status lookup (fallback if webhook missed)
export async function queryXenditQr(externalId: string): Promise<{ status: XenditQrStatus; raw: any }> {
  const cfg = getXenditConfig()
  if (!cfg.secretKey) throw new Error("XENDIT_SECRET_KEY belum di-set")

  const res = await fetch(`${cfg.baseUrl}/qr_codes/${encodeURIComponent(externalId)}`, {
    method: "GET",
    headers: { Authorization: xenditAuthHeader(cfg.secretKey) },
  })
  const data = await res.json().catch(async () => ({ text: await res.text() }))
  if (!res.ok) {
    const msg = (data as any)?.message || JSON.stringify(data).slice(0, 300)
    throw new Error(`Xendit QR query gagal ${res.status}: ${msg}`)
  }

  const s = String((data as any)?.status || "PENDING").toUpperCase()
  let status: XenditQrStatus = "PENDING"
  if (s === "COMPLETED" || s === "PAID" || s === "SUCCESS") status = "PAID"
  else if (s === "EXPIRED" || s === "INACTIVE") status = "EXPIRED"
  else if (s === "FAILED") status = "FAILED"
  return { status, raw: data }
}
