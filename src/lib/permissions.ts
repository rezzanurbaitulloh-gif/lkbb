// Matriks kontrol akses eksplisit — SUMBER KEBENARAN TUNGGAL untuk 3 peran.
//
// SUPER_ADMIN : akses penuh semua event + platform.
// ADMIN       : hanya event sendiri (own event via event_members).
// USER        : hanya melihat event sendiri (publik), tanpa akses admin.
//
// Aturan cakupan:
//  - 'event' : ADMIN boleh, dibatasi event_id miliknya.
//  - 'super' : hanya SUPER_ADMIN.
//  - 'docs'  : halaman dokumentasi, terlihat semua admin.

export type Scope = "all" | "own" | "none"

export type AdminSectionKey =
  | "dashboard" | "cms" | "peleton" | "transaksi" | "klasemen" | "results"
  | "offline-recap" | "pengumuman" | "timeline" | "juri" | "sponsor"
  | "settings" | "audit-log" | "access"
  | "users" | "roles" | "events" | "templates" | "events" | "templates"

export interface SectionDef {
  key: AdminSectionKey
  label: string
  href: string
  group: "RINGKASAN" | "KOMPETISI" | "KONTEN" | "AKSES" | "SISTEM" | "PLATFORM"
  super: Scope   // selalu 'all'
  admin: Scope   // 'own' | 'none'
  note: string
}

export const ACCESS_MATRIX: SectionDef[] = [
  // ——— RINGKASAN ———
  { key: "dashboard", label: "Dasbor", href: "/admin", group: "RINGKASAN", super: "all", admin: "own", note: "Statistik & pendapatan event sendiri" },
  // ——— KOMPETISI (event sendiri) ———
  { key: "peleton", label: "Tim", href: "/admin/peleton", group: "KOMPETISI", super: "all", admin: "own", note: "Kelola tim event sendiri" },
  { key: "transaksi", label: "Transaksi", href: "/admin/transaksi", group: "KOMPETISI", super: "all", admin: "own", note: "Transaksi event sendiri" },
  { key: "klasemen", label: "Klasemen", href: "/admin/klasemen", group: "KOMPETISI", super: "all", admin: "own", note: "Klasemen event sendiri" },
  { key: "results", label: "Hasil", href: "/admin/results", group: "KOMPETISI", super: "all", admin: "own", note: "Manajemen voting & hasil event sendiri" },
  { key: "offline-recap", label: "Rekap Offline", href: "/admin/offline-recap", group: "KOMPETISI", super: "all", admin: "own", note: "Rekap offline milik sendiri" },
  // ——— KONTEN (event sendiri) ———
  { key: "cms", label: "Konten Dinamis", href: "/admin/cms", group: "KONTEN", super: "all", admin: "own", note: "Visual editor event sendiri" },
  { key: "pengumuman", label: "Pengumuman", href: "/admin/pengumuman", group: "KONTEN", super: "all", admin: "own", note: "Pengumuman event sendiri" },
  { key: "timeline", label: "Jadwal", href: "/admin/timeline", group: "KONTEN", super: "all", admin: "own", note: "Jadwal/countdown event sendiri" },
  { key: "juri", label: "Juri", href: "/admin/juri", group: "KONTEN", super: "all", admin: "own", note: "Juri event sendiri" },
  { key: "sponsor", label: "Sponsor", href: "/admin/sponsor", group: "KONTEN", super: "all", admin: "own", note: "Sponsor event sendiri" },
  // ——— AKSES ———
  { key: "access", label: "Akses & Admin", href: "/admin/access", group: "AKSES", super: "all", admin: "own", note: "Kelola admin event sendiri (super: semua + matriks global)" },
  { key: "users", label: "Pengguna", href: "/admin/users", group: "AKSES", super: "all", admin: "own", note: "Pengguna event sendiri (super admin disembunyikan)" },
  // ——— PLATFORM (super saja: sewa multi-event) ———
  { key: "events", label: "Kelola Event", href: "/admin/events", group: "PLATFORM", super: "all", admin: "none", note: "Buat & provisioning web sewa (subdomain)" },
  { key: "templates", label: "Template", href: "/admin/templates", group: "PLATFORM", super: "all", admin: "none", note: "Template UI/UX, 1 klik terapkan ke event" },
  // ——— SISTEM ———
  { key: "settings", label: "Pengaturan", href: "/admin/settings", group: "SISTEM", super: "all", admin: "own", note: "Pengaturan, harga suara & countdown event sendiri" },
  { key: "audit-log", label: "Riwayat", href: "/admin/audit-log", group: "SISTEM", super: "all", admin: "own", note: "Log event sendiri, baca saja" },
  { key: "roles", label: "Peran", href: "/admin/roles", group: "SISTEM", super: "all", admin: "own", note: "Dokumentasi peran" },
  // ——— PLATFORM (super saja: sewa multi-event) ———
  { key: "events", label: "Kelola Event", href: "/admin/events", group: "PLATFORM", super: "all", admin: "none", note: "Buat & provisioning web sewa (subdomain)" },
  { key: "templates", label: "Template", href: "/admin/templates", group: "PLATFORM", super: "all", admin: "none", note: "Template UI/UX, 1 klik terapkan ke event" },
]

// Tabel super-only (tulis via API generik dilarang untuk ADMIN).
export const SUPER_ONLY_TABLES = ["profiles", "permissions", "role_permissions", "user_permissions", "platform_roles", "event_domains", "event_templates", "events"]

// Tabel event-scoped (wajib lolos cek event_id untuk ADMIN).
export const EVENT_TABLES = [
  "peletons", "transactions", "supports", "announcements", "timeline_stages",
  "judges", "sponsors", "news", "faqs", "competitions", "cms_pages",
  "cms_sections", "site_settings", "audit_logs",
]

export function sectionScope(key: AdminSectionKey, isSuper: boolean): Scope {
  const def = ACCESS_MATRIX.find((s) => s.key === key)
  if (!def) return "none"
  return isSuper ? def.super : def.admin
}

export function canAccessSection(key: AdminSectionKey, isSuper: boolean): boolean {
  return sectionScope(key, isSuper) !== "none"
}

// Cek baris DB milik event admin ybs (untuk API). Super lolos semua.
// Baris tanpa event_id (legacy) hanya boleh disentuh super.
export function rowInScope(ctx: { isSuper: boolean; eventIds: string[] }, rowEventId: string | null | undefined): boolean {
  if (ctx.isSuper) return true
  if (!rowEventId) return false
  return ctx.eventIds.includes(rowEventId)
}

// Path admin → section (untuk middleware/guard).
export function sectionForPath(pathname: string): AdminSectionKey | null {
  const p = pathname.replace(/\/$/, "")
  if (p === "/admin") return "dashboard"
  const map: [string, AdminSectionKey][] = [
    ["/admin/cms", "cms"],
    ["/admin/peleton", "peleton"],
    ["/admin/transaksi", "transaksi"],
    ["/admin/klasemen", "klasemen"],
    ["/admin/results", "results"],
    ["/admin/offline-recap", "offline-recap"],
    ["/admin/pengumuman", "pengumuman"],
    ["/admin/timeline", "timeline"],
    ["/admin/juri", "juri"],
    ["/admin/sponsor", "sponsor"],
    ["/admin/settings", "settings"],
    ["/admin/audit-log", "audit-log"],
    ["/admin/access", "access"],
    ["/admin/users", "users"],
    ["/admin/roles", "roles"],
    ["/admin/events", "events"],
    ["/admin/templates", "templates"],
  ]
  for (const [prefix, key] of map) {
    if (p === prefix || p.startsWith(prefix + "/")) return key
  }
  return null
}
