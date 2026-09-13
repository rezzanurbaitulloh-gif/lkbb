import { NextResponse } from "next/server"
import { createServiceSupabase, createServerSupabase } from "@/lib/supabase"
import { settlePaidTransaction } from "@/lib/payment/settle"

// POST /api/payment/simulate — SANDBOX ONLY: simulate successful Xendit payment.
// Body: { transactionId }. Settles PAID ledger exactly like the real webhook.
// Guarded: only when XENDIT_MODE=test, logged-in owner (or ADMIN), Pending XENDIT trx.
export async function POST(req: Request) {
  if ((process.env.XENDIT_MODE || "test") !== "test") {
    return NextResponse.json({ error: "Simulasi hanya tersedia di sandbox (XENDIT_MODE=test)" }, { status: 403 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const transactionId = String(body?.transactionId || "")
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId wajib diisi" }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Harus login" }, { status: 401 })
  }

  const service = createServiceSupabase()
  const { data: trx } = await service.from("transactions").select("*").eq("id", transactionId).maybeSingle()
  if (!trx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).maybeSingle()
  const isAdmin = profile?.role === "ADMIN"
  if (!isAdmin && trx.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (trx.provider && trx.provider !== "XENDIT") {
    return NextResponse.json({ error: "Simulasi hanya untuk transaksi XENDIT" }, { status: 400 })
  }
  if (trx.status === "Success") {
    return NextResponse.json({ ok: true, message: "Already PAID (idempotent)", status: "Success" })
  }
  if (trx.status !== "Pending") {
    return NextResponse.json({ error: `Transaksi sudah ${trx.status}, tidak bisa disimulasi` }, { status: 400 })
  }

  const settled = await settlePaidTransaction(service, trx, "XENDIT", `simulate_${trx.id.slice(0, 8)}`)
  if (!settled.ok) {
    return NextResponse.json({ error: settled.message || "Simulasi gagal" }, { status: settled.status || 500 })
  }
  return NextResponse.json({ ok: true, message: "Simulasi bayar sukses (sandbox)", status: "Success", transactionId: trx.id })
}
