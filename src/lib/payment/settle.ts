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

  const { error: supErr } = await service.from("supports").insert({
    peleton_id: trx.peleton_id,
    user_id: trx.user_id,
    transaction_id: trx.id,
    amount,
    supports: supportsQty,
    source: "online",
  })

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
        data: { is_private: true, ballot_quantity: supportsQty, peleton_category: peletonCategory, peleton_number: peleton?.number, supporter_avatar: supporterAvatar },
      },
    ])
  } catch {}

  try {
    await service.from("audit_logs").insert({
      action: "transaction_paid",
      target: trx.id,
      details: { provider, provider_ref: providerRef, amount, supports: supportsQty, peleton_id: trx.peleton_id },
    })
  } catch {}

  return { ok: true, shouldRecordSupport: true }
}
