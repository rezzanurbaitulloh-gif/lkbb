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
    name: "Modern Minimal",
    description: "Bersih dan terang, fokus ke konten.",
    category: "generic",
    theme_tokens: {
      colors: {
        primary: "#2563EB",
        background: "#FFFFFF",
        surface: "#F4F4F5",
        text: "#18181B",
        muted: "#71717A",
        border: "#E4E4E7",
      },
      fonts: { display: "Inter", body: "Inter", mono: "JetBrains Mono" },
      radii: { sm: "6px", md: "10px", lg: "18px", full: "9999px" },
    },
    layout_variant: "modern",
    hero_variant: "centered",
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
    name: "Jawasoma Heritage",
    description: "Warisan Jawa — emas tempa di atas charcoal, batik & gunungan. Plek referensi template tema jawa.",
    category: "heritage",
    preview_image_url: null,
    theme_tokens: {
      colors: {
        primary: "#C9A86A",
        background: "#0A0907",
        surface: "#1C1914",
        text: "#FFF8E7",
        muted: "#9A9590",
        subtle: "#6B6560",
        border: "rgba(201,168,106,0.12)",
        borderStrong: "rgba(201,168,106,0.22)",
        beige: "#E8D9B8",
        goldGlow: "rgba(201,168,106,0.15)",
      },
      fonts: { display: "Cinzel", body: "Inter", mono: "JetBrains Mono" },
      spacing: { base: "4px", scale: "1.25" },
      radii: { sm: "8px", md: "12px", lg: "16px", xl: "20px", full: "9999px" },
      shadows: { card: "0 4px 24px rgba(0,0,0,0.4)", gold: "0 0 20px rgba(201,168,106,0.15)" },
    },
    layout_variant: "heritage",
    hero_variant: "heritage",
    component_registry: {
      Navbar: { variant: "heritage", height: "56px" },
      Hero: { variant: "heritage", temple: true, gunungan: true, batik: true },
      Card: { variant: "heritage", radius: "12px" },
      Button: { variant: "heritage", primaryBg: "#E8D9B8", primaryText: "#0A0907" },
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
      hero: "temple-sunset-prambanan",
      ornament_gunungan: "wayang-gunungan-gold",
      ornament_batik: "batik-ceplok-gold-15pct",
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
