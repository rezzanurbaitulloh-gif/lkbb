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
    }
  } catch {}
  if (!css) return null
  return <style id="lkbb-event-theme" dangerouslySetInnerHTML={{ __html: css }} />
}
