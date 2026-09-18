// Shared PAID settlement — used by Xendit webhook AND sandbox simulate endpoint.
// Idempotent: safe to call multiple times for the same transaction.
// ONLY call after payment is verified (webhook token) or explicitly simulated in test mode.

export async function settlePaidTransaction(
  service: any,
  trx: any,
  provider: string,
  providerRef: string,
): Promise<{ ok: boolean; message?: string; status?: number; shouldRecordSupport?: boolean }> {
  // Idempotency: if already Success, do not create ledger again
  if (trx.status === "Success" || trx.status === "PAID") {
    return { ok: true, message: "Already PAID (idempotent)" }
  }

  const { data: existing } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
  if (existing) {
    if (trx.status !== "Success") {
      await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
    }
    return { ok: true, message: "Ledger already exists (idempotent)" }
  }

  const { error: updErr } = await service.from("transactions").update({ status: "Success" }).eq("id", trx.id)
  if (updErr) {
    return { ok: false, message: updErr.message, status: 500 }
  }

  // Use immutable transaction data for ballot creation (never trust webhook quantity)
  const supportsQty = Number(trx.supports)
  const amount = Number(trx.amount)
  if (!supportsQty || supportsQty < 1) {
    return { ok: false, message: "Invalid supports quantity", status: 400 }
  }

  // Event-aware: resolve event_id (from transaction, fallback to peleton)
  let eventId = (trx as any).event_id
  if (!eventId) {
    const { data: p } = await service.from("peletons").select("event_id").eq("id", trx.peleton_id).maybeSingle()
    eventId = (p as any)?.event_id || null
  }
  if (!eventId) {
    const { data: ev } = await service.from("events").select("id").eq("slug", "lkbbvote").maybeSingle()
    eventId = (ev as any)?.id || null
  }

  // Ballot wallet: credit atomically (upsert) — PAYMENT -> WALLET -> SUPPORT
  let walletId: string | null = null
  if (eventId) {
    try {
      const { data: existingWallet } = await service.from("ballot_wallets").select("id, balance").eq("event_id", eventId).eq("user_id", trx.user_id).maybeSingle()
      if (existingWallet) {
        walletId = (existingWallet as any).id
        await service.from("ballot_wallets").update({ balance: (existingWallet as any).balance + supportsQty, updated_at: new Date().toISOString() }).eq("id", walletId)
        await service.from("ballot_transactions").insert({ event_id: eventId, user_id: trx.user_id, wallet_id: walletId, type: "credit", amount: supportsQty, order_id: trx.id, peleton_id: trx.peleton_id } as any)
      } else {
        const { data: w } = await service.from("ballot_wallets").insert({ event_id: eventId, user_id: trx.user_id, balance: supportsQty } as any).select("id").single()
        walletId = (w as any).id
        await service.from("ballot_transactions").insert({ event_id: eventId, user_id: trx.user_id, wallet_id: walletId, type: "credit", amount: supportsQty, order_id: trx.id, peleton_id: trx.peleton_id } as any)
      }
    } catch {}
  }

  const { error: supErr } = await service.from("supports").insert({
    peleton_id: trx.peleton_id,
    user_id: trx.user_id,
    transaction_id: trx.id,
    amount,
    supports: supportsQty,
    source: "online",
    event_id: eventId,
  } as any)

  if (supErr) {
    const { data: dup } = await service.from("supports").select("id").eq("transaction_id", trx.id).maybeSingle()
    if (dup) {
      return { ok: true, message: "Ledger exists after race (idempotent)" }
    }
    return { ok: false, message: supErr.message, status: 500 }
  }

  const { data: peleton } = await service.from("peletons").select("id, slug, name, school, category, number").eq("id", trx.peleton_id).maybeSingle()
  const { data: profile } = await service.from("profiles").select("public_name, email, avatar_url").eq("id", trx.user_id).maybeSingle()
  const supporterName = profile?.public_name || profile?.email?.split("@")[0] || "Seseorang"
  const supporterAvatar = (profile as any)?.avatar_url || null
  const peletonName = peleton?.name || peleton?.school || "peleton"
  const peletonSlug = peleton?.slug || ""
  const peletonCategory = peleton?.category || ""

  try {
    await service.from("notifications").insert([
      {
        user_id: null,
        title: "Dukungan Baru!",
        body: `Selamat!! ${supporterName} telah mendukung ${peletonName}`,
        peleton_id: trx.peleton_id,
        peleton_name: peletonName,
        peleton_slug: peletonSlug,
        supporter_name: supporterName,
        supporter_avatar: supporterAvatar,
        event_id: eventId,
        data: { is_private: false, is_public: true, peleton_category: peletonCategory, peleton_number: peleton?.number, supporter_avatar: supporterAvatar, ballot_quantity: supportsQty },
      },
      {
        user_id: trx.user_id,
        title: "Dukungan Berhasil!",
        body: `Selamat!! Kamu telah mendukung ${peletonName} — ${supportsQty} ballot`,
        peleton_id: trx.peleton_id,
        peleton_name: peletonName,
        peleton_slug: peletonSlug,
        supporter_name: supporterName,
        supporter_avatar: supporterAvatar,
        event_id: eventId,
        data: { is_private: true, ballot_quantity: supportsQty, peleton_category: peletonCategory, peleton_number: peleton?.number, supporter_avatar: supporterAvatar },
      },
    ] as any)
  } catch {}

  try {
    await service.from("audit_logs").insert({
      action: "transaction_paid",
      target: trx.id,
      details: { provider, provider_ref: providerRef, amount, supports: supportsQty, peleton_id: trx.peleton_id },
      event_id: eventId,
    } as any)
  } catch {}

  return { ok: true, shouldRecordSupport: true }
}
