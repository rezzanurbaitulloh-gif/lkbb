import { headers } from "next/headers"
import { getEventTheme } from "@/lib/theme"
import { resolveEventFromHost } from "@/lib/event"

// Suntik variabel tema milik event saat ini ke <head>.
// Resolusi event mandiri dari host (tidak bergantung pada proxy matcher),
// terisolasi per event: hanya membaca baris events + site_settings event itu.
export default async function ThemeStyle() {
  let css = ""
  try {
    const hdrs = await headers()
    let eventId = hdrs.get("x-event-id")
    if (!eventId) {
      const host = hdrs.get("host") || hdrs.get("x-forwarded-host") || ""
      try {
        const r = await resolveEventFromHost(host)
        eventId = r.eventId
      } catch {}
    }
    const theme = await getEventTheme(eventId)
    const entries = Object.entries(theme.vars)
    if (entries.length > 0) {
      css = `:root{${entries.map(([k, v]) => `${k}:${v}`).join(";")}}`
      // Konsistensi full-site untuk heritage: terapkan gold/beige ke semua halaman via data-attribute
      // (navbar, card, footer, bottom-nav) — tidak hanya homepage
      if (theme.layoutVariant === "heritage" || theme.heroVariant === "heritage") {
        css += `\n[data-template="heritage"]{--color-primary:#C9A86A;--color-background:#0A0907;--color-surface:#1C1914}`
        css += `\n.template-heritage{--color-primary:#C9A86A}`
      }
    }
    // Variant heritage sudah di-handle via warna di atas — layout spesifik di-handle per halaman via heroVariant prop
  } catch {}
  if (!css) return null
  return <style id="lkbb-event-theme" dangerouslySetInnerHTML={{ __html: css }} />
}
