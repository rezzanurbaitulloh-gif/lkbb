/**
 * Payment abstraction — XENDIT Sandbox QRIS (DOKU disabled/commented).
 * Secrets must remain server-side. UI components should never couple to provider directly.
 *
 * Conceptual service per spec:
 *   createTransaction()
 *   getTransactionStatus()
 *   handlePaymentCallback()
 *   recordSuccessfulSupport()
 *
 * Critically: support count is ONLY incremented after VALID SUCCESSFUL TRANSACTION via Xendit webhook.
 * Never on checkout open, quantity select, pending, or transaction create.
 */

export type CreateTransactionParams = {
  peletonId: string
  peletonSlug: string
  supports: number
  amount: number
  userId?: string
  method?: string
}

export type PaymentTransaction = {
  id: string
  status: "Pending" | "Success" | "Failed" | "Expired"
  amount: number
  supports: number
  peletonId: string
  createdAt: string
  expiresAt: string
  paymentUrl?: string
  qrisData?: string
}

// Demo in-memory (client) — replace with Supabase + provider SDK on server
export async function createTransaction(params: CreateTransactionParams): Promise<PaymentTransaction> {
  const id = "TRX-" + Date.now().toString().slice(-8)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
  // NEVER increment support here — only after success
  return {
    id,
    status: "Pending",
    amount: params.amount,
    supports: params.supports,
    peletonId: params.peletonId,
    createdAt: now.toISOString(),
    expiresAt,
    paymentUrl: `/checkout?status=pending&id=${id}&peleton=${params.peletonSlug}&qty=${params.supports}&total=${params.amount}`,
  }
}

export async function getTransactionStatus(id: string): Promise<PaymentTransaction["status"]> {
  // In production: fetch from DB / provider
  // Demo: read from localStorage history if exists
  if (typeof window !== "undefined") {
    const hist = JSON.parse(localStorage.getItem("lkbb-history") || "[]")
    const found = hist.find((x: any)=> x.id===id)
    if(found) return found.status
  }
  return "Pending"
}

export async function handlePaymentCallback(payload: any): Promise<{ ok: boolean; shouldRecordSupport: boolean }> {
  // Verify webhook signature server-side, check provider status === SUCCESS
  // Only then record support in `supports` table and update leaderboard (which reads from valid supports)
  const isValidSuccess = payload?.status === "Success" && payload?.verified === true
  return { ok: true, shouldRecordSupport: isValidSuccess }
}

export async function recordSuccessfulSupport(transactionId: string): Promise<void> {
  // Insert into supports/transactions with FK to peleton, increment materialized support count via trigger / RPC
  // Protected by RLS + service-role, never from client directly
  console.log("[payment] recordSuccessfulSupport", transactionId)
}
