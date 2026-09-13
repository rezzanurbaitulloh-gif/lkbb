// Payment provider abstraction — XENDIT Sandbox is current (DOKU disabled, see below)

export type PaymentCreateParams = {
  transactionId: string // internal UUID
  peletonId: string
  peletonSlug: string
  userId: string
  quantity: number
  amount: number // in IDR
  email?: string
}

export type PaymentCreateResult = {
  provider: "DOKU" | "XENDIT"
  providerReference: string // partnerReferenceNo (our transactionId) or provider referenceNo
  qrContent: string // EMV QR string to render
  qrUrl?: string // if provider returns URL, else use qrContent
  referenceNo?: string // provider's referenceNo (DOKU referenceNo / Xendit QR id)
  expiresAt?: string
  rawResponse?: any
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED"

export interface PaymentProvider {
  readonly name: "DOKU" | "XENDIT"
  createPayment(params: PaymentCreateParams): Promise<PaymentCreateResult>
  getPaymentStatus?(partnerReferenceNo: string, referenceNo?: string): Promise<PaymentStatus>
  verifyWebhook?(headers: Headers, rawBody: string, bodyJson: any): Promise<{ valid: boolean; error?: string }>
  normalizeWebhook?(bodyJson: any): { partnerReferenceNo: string; referenceNo?: string; status: PaymentStatus; amount?: number }
}

export function mapTransactionStatusToPaymentStatus(dbStatus: string): PaymentStatus {
  const s = (dbStatus || "").toUpperCase()
  if (s === "SUCCESS" || s === "PAID") return "PAID"
  if (s === "FAILED") return "FAILED"
  if (s === "EXPIRED") return "EXPIRED"
  if (s === "CANCELLED") return "CANCELLED"
  return "PENDING"
}
