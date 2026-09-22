# JAWASOMA HERITAGE — Design System Specification
> Extracted from `template tema jawa.png` — 2026-09-22

## 1. Art Direction
**Heritage · Ceremonial · Gold on Charcoal** — LKBB × Kraton Jawa. Gelap pekat (charcoal-black) sebagai kanvas, emas tempa (gold leaf #C9A86A) sebagai satu-satunya aksen kromatik. Ornamen batik ceplok + ukiran gunungan wayang sebagai framing, bukan dekorasi acak. Foto peleton diperlakukan seperti relief candi: high contrast, warm, vignette.

**Reference anchors:** Batik Solo, Prambanan at sunset, Wayang Gunungan, Paskibra ceremonial.

## 2. Color System
| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | #0A0907 | Page canvas |
| `--color-surface` | #1C1914 | Cards, panels |
| `--color-surface-card` | #1A1814 | Peserta cards |
| `--color-border` | rgba(201,168,106,0.12) | Hairline gold |
| `--color-primary` (Gold) | #C9A86A | CTA, badges, active, dividers |
| `--color-primary-hover` | #B8944F | CTA hover |
| `--color-foreground` | #FFF8E7 | Body text, beige-50 |
| `--color-foreground-muted` | #9A9590 | Descriptions, meta |
| `--color-foreground-subtle` | #6B6560 | Timestamps, dividers |
| `--color-beige-100` | #F5E6C8 | Pill backgrounds |
| `--color-gold-glow` | shadow 20px rgba(201,168,106,0.15) | Card glow on hover |

**Palette rationale:** Monochrome warm-dark + single gold. Tidak ada warna kedua. Gold dipakai untuk: nav active underline, primary buttons (beige bg, black text), number badges, card CTA, leaderboard #1, divider lines, batik ornaments (opacity 15-22%).

## 3. Typography
| Role | Family | Weight | Size | Tracking | Leading |
|------|--------|--------|------|----------|---------|
| **Display Hero** | Cinzel / Cormorant | 700-800 | 54px (32px mobile) | -0.02em | 0.95 |
| **Display Section** | Cinzel | 700 | 30px | -0.01em | 1.05 |
| **Display Card** | Instrument Sans / Cinzel | 700 | 14px | -0.01em | 1.2 |
| **Body** | Inter / DM Sans | 400-500 | 13px | 0 | 1.5 |
| **Label / Meta** | Inter | 600-700 | 11px | 0.14em UPPERCASE | 1.2 |
| **Nav** | Inter | 500 | 12px | 0.06em | 1 |

**Pairing reason:** Cinzel (Trajan-inspired, carved stone) untuk JAWASOMA wordmark — echo prasasti candi. Inter untuk body — netral, legible pada kontras gelap, tidak bersaing dengan display. Tidak ada font ketiga.

## 4. Spacing & Layout
- **Base unit:** 4px / 8pt grid
- **Section rhythm:** 64px desktop, 40px mobile
- **Page gutter:** 24px (16px mobile)
- **Card gap:** 16px
- **Grid:** 12-col. Hero: 1 col. Peserta: 4 cols desktop → 2 tablet → 1 mobile. Detail: sidebar 2/3 + 1/3. Leaderboard: list.
- **Container:** max 1280px, centered.

## 5. Radius, Shadows, Borders
- **Radius:** sm 8px (badges), md 12px (cards), lg 16px (panels), full 9999px (pills/buttons)
- **Border:** hairline 1px rgba gold 12%, strong 22% on active/hover
- **Shadow:** card 0 4px 24px rgba(0,0,0,0.4); gold-glow 0 0 20px rgba(201,168,106,0.15) on hover/focus

## 6. Motion
- Duration: fast 150ms (micro), normal 250ms (hover), slow 400ms (hero reveal)
- Easing: out-expo (0.16,1,0.3,1) for reveals, gold ease for hovers
- Respect `prefers-reduced-motion`

## 7. Component Specs
### Button Primary
- bg gold-400, text black-950, radius full, padding 10px 20px, font 12px bold tracking 0.04em
- Hover: gold-500, glow
- Height 36px (peserta cards), 40px (hero)

### Card Peserta
- bg #1A1814, border hairline, radius 12px, overflow hidden
- Number badge: top-left, gold text on black/50 backdrop, 28x28, font 12px black on gold? Actually gold text, dark bg
- Image: aspect 16/10, object-cover, gradient overlay bottom
- Body: title 14px bold, sub 11px muted tracking 0.12em
- Footer: CTA pill beige + eye count
- Hover: border gold 22% + glow

### Leaderboard Row
- Number circle: #1 gold bg black text + crown, #2 #3 muted, rest dark border

### Hero
- Full bleed background image (temple sunset), overlay gradient to charcoal
- Ornament gunungan right edge (SVG), batik bottom frame
- Countdown pills: gold numerals, muted labels

## 8. Assets Required
- Temple sunset hero (Prambanan at dusk, Merapi silhouette)
- Gunungan wayang ornament SVG (right edge, gold line-art)
- Batik ceplok pattern SVG (bottom hero, footer, 15% opacity)
- Dancer silhouette (footer left, gold-illuminated)

## 9. Anti-Slop Rules
- Jangan pakai gradient pelangi, glassmorphism tebal, card grid berlebihan dengan shadow warna-warni
- Gold adalah satu-satunya warna aksen — jangan tambah biru/hijau acak
- Ornamen hanya di hero + footer + card divider, jangan di setiap section
