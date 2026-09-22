import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase"

// Central webhook — PRD §26: semua provider kirim ke https://lkbb.my.id/api/payment/webhook
// Dispatch berdasarkan header / body shape
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/payment/webhook",
    message: "Central webhook ready — routes to XENDIT (x-callback-token) or DOKU (signature)",
  })
}

export async function POST(req: Request) {
  const rawBody = await req.text().catch(() => "")
  let bodyJson: any = {}
  try { bodyJson = rawBody ? JSON.parse(rawBody) : {} } catch {}
  const headers = req.headers
  const hasXendit = headers.get("x-callback-token") || headers.get("X-Callback-Token")
  const hasDoku = headers.get("signature") || headers.get("Signature") || bodyJson?.order?.invoiceNumber || bodyJson?.invoiceNumber
  // Heuristic: if x-callback-token present → XENDIT, else DOKU
  if (hasXendit) {
    // Forward to Xendit handler
    const { POST: xenditPOST } = await import("./xendit/route")
    // Xendit handler expects rawBody via req.text(), so we need to recreate request with same body
    const newReq = new Request(req.url.replace("/api/payment/webhook", "/api/payment/webhook/xendit"), {
      method: "POST",
      headers: req.headers,
      body: rawBody,
    })
    return (xenditPOST as any)(newReq)
  }
  if (hasDoku || bodyJson?.order || bodyJson?.transaction) {
    const { POST: dokuPOST } = await import("./doku/route")
    const newReq = new Request(req.url.replace("/api/payment/webhook", "/api/payment/webhook/doku"), {
      method: "POST",
      headers: req.headers,
      body: rawBody,
    })
    return (dokuPOST as any)(newReq)
  }
  // Fallback: try Xendit first, then DOKU
  return NextResponse.json({ error: "Unknown provider webhook" }, { status: 400 })
}
