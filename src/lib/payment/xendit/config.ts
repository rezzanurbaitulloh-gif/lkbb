// Xendit Sandbox config — server only, never expose secret to browser
// Docs: POST https://api.xendit.co/qr_codes (Basic auth secret_key:)

export function getXenditConfig() {
  const secretKey = process.env.XENDIT_SECRET_KEY || ""
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || ""
  const publicKey = process.env.NEXT_PUBLIC_XENDIT_PUBLIC_KEY || ""
  const mode = process.env.XENDIT_MODE || "test"
  const baseUrl = "https://api.xendit.co" // same host; test vs live determined by key
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lkbb.vercel.app").replace(/\/$/, "")
  const callbackUrl = `${appUrl}/api/payment/webhook/xendit`

  if (!secretKey) {
    console.warn("[xendit] XENDIT_SECRET_KEY missing — QR create will fail")
  }

  return { secretKey, webhookToken, publicKey, mode, baseUrl, appUrl, callbackUrl }
}

export function xenditAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}
