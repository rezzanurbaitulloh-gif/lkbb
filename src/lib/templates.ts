// Template UI/UX system — super admin pilih 1 klik, teraplikasi penuh ke event.
// Struktur selaras dengan kolom public.event_templates (migrasi 021).

export type ThemeTokens = {
  colors?: Record<string, string>
  fonts?: { display?: string; body?: string; mono?: string }
  spacing?: Record<string, string | number>
  radii?: Record<string, string>
  shadows?: Record<string, string>
}

export type EventTemplate = {
  id?: string
  name: string
  description?: string
  preview_image_url?: string | null
  category?: string
  theme_tokens?: ThemeTokens
  layout_variant?: string
  hero_variant?: string
  component_registry?: Record<string, any>
  cms_sections?: any[]
  default_settings?: Record<string, any>
  branding_assets?: Record<string, string>
  is_active?: boolean
  is_premium?: boolean
}

export const LAYOUT_VARIANTS = ["default", "modern", "classic", "compact"] as const
export const HERO_VARIANTS = ["split", "centered", "fullscreen", "video"] as const

// Template bawaan (seed). Super admin bisa tambah via UI.
export const BUILTIN_TEMPLATES: EventTemplate[] = [
  {
    name: "Paskibra Klasik",
    description: "Tampilan bawaan LKBB: gelap, tegas, aksen lime.",
    category: "paskibra",
    theme_tokens: {
      colors: {
        primary: "#D9FF3F",
        background: "#0A0A09",
        surface: "#141412",
        text: "#F2F0E9",
        muted: "#92918C",
        border: "#292927",
      },
      fonts: { display: "Instrument Sans", body: "Geist", mono: "JetBrains Mono" },
      radii: { sm: "4px", md: "8px", lg: "16px", full: "9999px" },
    },
    layout_variant: "default",
    hero_variant: "split",
    component_registry: {},
    cms_sections: [],
    default_settings: {
      online_price: 3000,
      offline_price: 5000,
      ballot_presets: [10, 50, 100, 300],
      voting_enabled: true,
      show_leaderboard: true,
    },
    branding_assets: {},
    is_active: true,
    is_premium: false,
  },
  {
    name: "Jawasoma Heritage Authentic",
    description: "Cinematic Javanese Heritage — Prambanan sunset, Gunungan Kayon Tropenmuseum & Batik Mega Mendung (Wikimedia CC BY-SA). Plek MASTER PRD.",
    category: "heritage",
    preview_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg",
    theme_tokens: {
      colors: {
        primary: "#D9AA5C",
        background: "#050403",
        surface: "#100D09",
        text: "#F2ECE1",
        muted: "rgba(242,236,225,.68)",
        subtle: "rgba(242,236,225,.42)",
        border: "rgba(218,170,92,.15)",
        borderStrong: "rgba(218,170,92,.25)",
        beige: "#E9C982",
        gold: "#C89445",
        highlight: "#F3DFA9",
      },
      fonts: { display: "Cormorant Garamond", body: "Manrope", mono: "JetBrains Mono" },
      spacing: { base: "4px", scale: "1.25" },
      radii: { sm: "8px", md: "12px", lg: "16px", xl: "20px", full: "9999px" },
      shadows: { card: "0 4px 24px rgba(0,0,0,0.4)", gold: "0 0 20px rgba(217,170,92,0.15)" },
    },
    layout_variant: "heritage",
    hero_variant: "heritage",
    component_registry: {
      Navbar: { variant: "heritage", height: "72px" },
      Hero: { variant: "heritage", temple: "https://images.unsplash.com/photo-1518544866330-95a2f0664541?w=1600&auto=format&fit=crop&q=80", gunungan: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg", batik: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/800px-Batik_Mega_Mendung.jpg", dancer: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sendratari.jpg/800px-Sendratari.jpg" },
      Card: { variant: "heritage", radius: "12px" },
      Button: { variant: "heritage", primaryBg: "#E9C982", primaryText: "#050403" },
    },
    cms_sections: [],
    default_settings: {
      online_price: 3000,
      offline_price: 5000,
      ballot_presets: [10, 50, 100, 300],
      voting_enabled: true,
      show_leaderboard: true,
    },
    branding_assets: {
      logo: "/assets/brand/lkbb-logo.jpg",
      hero: "https://images.unsplash.com/photo-1518544866330-95a2f0664541?w=1600&auto=format&fit=crop&q=80",
      gunungan: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg/800px-COLLECTIE_TROPENMUSEUM_Wajangfiguur_voorstellende_de_berg_Gunungan_TMnr_15-954-97.jpg",
      batik: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Batik_Mega_Mendung.jpg/800px-Batik_Mega_Mendung.jpg",
      dancer: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Sendratari.jpg/800px-Sendratari.jpg",
    },
    is_active: true,
    is_premium: false,
  },
]

// Gabungkan config template + override per-event (override menang).
export function mergeTemplateConfig(base: Record<string, any>, overrides: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...(base || {}) }
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v !== undefined) out[k] = v
  }
  return out
}
