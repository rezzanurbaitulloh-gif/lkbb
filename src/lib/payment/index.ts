import { createXenditProvider } from "./xendit/client"
import type { PaymentProvider } from "./provider"

// ===== DOKU DINONAKTIFKAN (di-comment) — pakai Xendit Sandbox untuk sekarang =====
// import { createDokuProvider } from "./doku/client"

// Singleton provider — XENDIT Sandbox is current
let cached: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached
  // DOKU disabled: cached = createDokuProvider()
  cached = createXenditProvider()
  return cached
}

export * from "./provider"
