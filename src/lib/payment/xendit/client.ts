import type { PaymentProvider } from "../provider"
import { createXenditQr, queryXenditQr } from "./qr"
import { verifyXenditWebhookToken, parseXenditQrCallback } from "./webhook"

export class XenditPaymentProvider implements PaymentProvider {
  readonly name = "XENDIT" as const

  async createPayment(params: { transactionId: string; peletonId: string; userId: string; quantity: number; amount: number; email?: string; externalId?: string }) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const result = await createXenditQr({
      externalId: params.externalId || params.transactionId,
      amount: params.amount,
      description: `LKBB ${params.quantity} ballot`,
      expiresAt,
    })
    return {
      provider: "XENDIT" as const,
      providerReference: result.externalId,
      qrContent: result.qrString,
      referenceNo: result.xenditId,
      expiresAt,
      rawResponse: result.raw,
    }
  }

  async getPaymentStatus(partnerReferenceNo: string) {
    const q = await queryXenditQr(partnerReferenceNo)
    return q.status
  }

  async verifyWebhook(headers: Headers) {
    return verifyXenditWebhookToken(headers)
  }

  normalizeWebhook(bodyJson: any) {
    const parsed = parseXenditQrCallback(bodyJson)
    if (!parsed) throw new Error("Invalid Xendit callback")
    return {
      partnerReferenceNo: parsed.externalId,
      referenceNo: parsed.xenditId,
      status: parsed.status,
      amount: parsed.amount,
    }
  }
}

export function createXenditProvider(): PaymentProvider {
  return new XenditPaymentProvider()
}
