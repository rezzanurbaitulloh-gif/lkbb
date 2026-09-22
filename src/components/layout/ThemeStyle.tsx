import { headers } from "next/headers"
import { getEventTheme } from "@/lib/theme"

// Suntik variabel tema milik event saat ini ke <head>.
// Terisolasi per event: hanya membaca baris events + site_settings event itu.
export default async function ThemeStyle() {
  let css = ""
  try {
    const hdrs = await headers()
    const eventId = hdrs.get("x-event-id")
    const theme = await getEventTheme(eventId)
    const entries = Object.entries(theme.vars)
    if (entries.length > 0) {
      css = `:root{${entries.map(([k, v]) => `${k}:${v}`).join(";")}}`
    }
  } catch {}
  if (!css) return null
  return <style id="lkbb-event-theme" dangerouslySetInnerHTML={{ __html: css }} />
}
