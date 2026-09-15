import { NextResponse } from "next/server"
import { createServiceSupabase, createServerSupabase } from "@/lib/supabase"
import { getPaymentProvider } from "@/lib/payment"

// POST /api/transactions — server calculates price, enforces event closure, creates transaction + XENDIT Sandbox QRIS
// (DOKU dinonaktifkan — di-comment, pakai Xendit untuk sekarang)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { peletonId, slug, quantity } = body
    if (!peletonId || !quantity || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "Invalid quantity or peleton" }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const service = createServiceSupabase()

    // Require login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Harus login terlebih dahulu untuk melakukan transaksi." }, { status: 401 })
    }

    // Rate limiting stub: check quantity bounds strictly
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ error: "Quantity must be 1-1000" }, { status: 400 })
    }

    // Hanya status Aktif yang boleh transaksi (4 status baru)
    const { data: event } = await supabase.from("competitions").select("state, settings").order("created_at", { ascending: false }).limit(1).single()
    if (!event) return NextResponse.json({ error: "Event not configured" }, { status: 500 })
    const state = event.state as string
    const canTransact = state === "ACTIVE" || state === "VOTING_OPEN"
    if (!canTransact) {
      const msg =
        state === "NOT_STARTED" ? "Belum dimulai — transaksi belum dibuka" :
        state === "VOTING_CLOSED" ? "Voting ditutup — transaksi dihentikan" :
        state === "RESULT_PUBLISHED" ? "Hasil sudah dipublikasikan — transaksi dihentikan" :
        "Transaksi ditutup — status tidak mengizinkan"
      return NextResponse.json({ error: msg }, { status: 403 })
    }

    // 2. Validate peleton
    const { data: peleton } = await supabase.from("peletons").select("id, slug, verified, active").eq("id", peletonId).single()
    if (!peleton || !peleton.verified || !peleton.active) {
      return NextResponse.json({ error: "Peleton tidak valid" }, { status: 404 })
    }

    // 3. Server-calculated price (never trust client)
    const onlinePrice = event.settings?.online_price ?? 3000
    const amount = quantity * onlinePrice

    // 4. Create transaction as PENDING with user_id — provider XENDIT Sandbox, never trust client amount
    // DOKU disabled: const initialRef = `doku_${Date.now()}_${peletonId.slice(0,8)}`
    const initialRef = `xnd_${Date.now()}_${peletonId.slice(0,8)}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { data: trx, error } = await service.from("transactions").insert({
      peleton_id: peletonId,
      user_id: user.id,
      amount,
      supports: quantity,
      method: "QRIS",
      status: "Pending",
      provider: "XENDIT",
      provider_ref: initialRef,
      source: "online",
      expires_at: expiresAt,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 5. Create XENDIT Sandbox QRIS via provider (server-side only, never expose secrets to browser)
    // Frontend must never call Xendit directly — we are the only caller
    // ===== DOKU DINONAKTIFKAN (di-comment) =====
    // const dokuReferenceNo ... (see git history for DOKU flow)
    let paymentUrl = `/checkout?id=${trx.id}&peleton=${slug}&qty=${quantity}&total=${amount}`
    let xenditReferenceNo: string | null = null
    let xenditQrContent: string | null = null

    try {
      const provider = getPaymentProvider()
      const xenditRes = await provider.createPayment({
        transactionId: trx.id,
        peletonId,
        peletonSlug: slug || peleton.slug,
        userId: user.id,
        quantity,
        amount,
        email: user.email || undefined,
      })

      xenditReferenceNo = xenditRes.referenceNo || xenditRes.providerReference || null
      xenditQrContent = xenditRes.qrContent

      if (!xenditQrContent) throw new Error("Xendit tidak mengembalikan qr_string — cek XENDIT_SECRET_KEY sandbox di server")

      // Persist Xendit references for webhook & status lookup
      // (kolom doku_* dipakai ulang untuk referensi provider agar tanpa migrasi DB)
      await service.from("transactions").update({
        provider_ref: trx.id,
        doku_reference_no: xenditReferenceNo,
        qr_content: xenditQrContent,
        metadata: { xendit_id: xenditReferenceNo, mode: "sandbox" },
      } as any).eq("id", trx.id)
    } catch (xenditErr: any) {
      console.error("[xendit] createPayment failed", xenditErr)
      // Hapus transaksi pending yang gagal generate QR
      await service.from("transactions").delete().eq("id", trx.id)
      const msg = xenditErr?.message || "Gagal generate QRIS Xendit"
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const invoiceId = `LKBB-${trx.id.slice(0,8).toUpperCase()}`
    return NextResponse.json({
      transactionId: trx.id,
      invoiceId,
      provider: "XENDIT",
      providerRef: trx.id,
      xenditReferenceNo,
      amount,
      quantity,
      expiresAt,
      paymentUrl,
      qrContent: xenditQrContent,
      qrString: xenditQrContent,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

// GET /api/transactions?userId=... — for history (requires auth)
// Admin dengan ?all=true melihat KESELURUHAN transaksi semua pengguna (admin + user biasa)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const peletonId = searchParams.get("peletonId")
  const id = searchParams.get("id")
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "ADMIN"
  const all = searchParams.get("all") === "true"
  // Join lengkap untuk invoice/detail: peleton + pembayar
  const SELECT_FULL = "*, peletons(name,number,school,category), profiles(public_name,email,role)"
  if (id) {
    // Admin all=true boleh lihat transaksi milik siapa pun; user biasa hanya miliknya
    if (all && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // Pakai service role agar join profiles tidak terhalang RLS, tapi tetap cek ownership manual
    if (all && isAdmin) {
      const service = createServiceSupabase()
      const { data, error } = await service.from("transactions").select(SELECT_FULL).eq("id", id).single()
      if (error) return NextResponse.json({ error: error.message }, { status: 404 })
      return NextResponse.json(data)
    }
    const { data, error } = await supabase.from("transactions").select(SELECT_FULL).eq("id", id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    if ((data as any).user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json(data)
  }
  // List: admin all=true -> KESELURUHAN tanpa filter user_id
  if (all) {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const service = createServiceSupabase()
    let query = service.from("transactions").select(SELECT_FULL).order("created_at", { ascending: false }).limit(200)
    if (peletonId) query = query.eq("peleton_id", peletonId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  let query = supabase.from("transactions").select(SELECT_FULL).order("created_at", { ascending: false }).limit(50)
  if (peletonId) query = query.eq("peleton_id", peletonId)
  query = query.eq("user_id", user.id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
