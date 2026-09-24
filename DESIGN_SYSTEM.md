# DESIGN_SYSTEM.md — Cinematic Javanese Heritage Voting Platform
> Source of truth: `/home/reja/Downloads/template tema jawa.png` (MASTER) — plek, bukan interpretasi generik.

## 1. Identity
**Cinematic Javanese Heritage Voting Platform** — Luxury Heritage Editorial + Cinematic Photography + Asymmetric Grid + Layered Ornament + Dark UI + Gold Accent + Interactive Motion

Formula: Javanese Heritage + Cinematic Photography + Luxury Editorial + Asymmetric Grid + Layered Ornament + Dark UI + Gold Accent + Interactive Motion

**What it is NOT:** dashboard SaaS, landing biasa, glassmorphism murni, brutalism, template voting generik.

## 2. Canvas & Grid
- Reference: 1536×1024 showcase (bukan page real). Real desktop: **1440–1600px max**, full viewport, gutter **40–64px**. Jangan `max-width:1200px; margin:auto` — bunuh karakter.
- **12-col asymmetric**: hero 7+5, peserta header 8+4, detail 7+5, hasil full-bleed. Section tertentu full-bleed, floating panels, image bleed, edge ornaments. Negative space intentional.

## 3. Global Visual System
- Background: `#050403` (base, bukan #000), Secondary `#090806`, Elevated `#100D09` — jangan pure black.
- Vignette: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.55) 100%)`

## 4. Gold System (antique/champagne, jangan #FFD700)
- Gold 01 `#C89445` (primary CTA)
- Gold 02 `#D9AA5C` (secondary border, nav underline)
- Gold 03 `#E9C982` (muted ornament)
- Gold Highlight `#F3DFA9` (hover/winner)
- Hierarchy: primary CTA → secondary border → muted ornament → highlight hover

## 5. Text System
- Primary `#F2ECE1`, Secondary `rgba(242,236,225,.68)`, Tertiary `.42`, Disabled `.25`
- Display: **Cormorant Garamond** 700/800 for JAWASOMA/Peserta/Leaderboard/Hasil/Lebih dari Sekadar (editorial luxury)
- UI: **Manrope** 400/500/600 for nav/button/meta/angka/description (Phosphor uses Manrope, pairing proven)

## 6. Logo
`[Gunungan Mark 32–40px #D9AA5C 0.9] + JAWASOMA + THE IMPRESSION 2026` — simple in nav, detail complex only in hero.

## 7. Navbar
- Minimal Luxury, 72–80px, initial `rgba(5,4,3,.45)`, scrolled `rgba(5,4,3,.82) blur(18px)`, border `rgba(218,170,92,.10)`, active underline gold 1px scaleX 350ms cubic-bezier(.22,1,.36,1)

## 8. Hero — 11 Layers (cinematic scene, bukan bg+text+button)
1 dark base, 2 mountain, 3 temple, 4 sky, 5 marching team, 6 gunungan, 7 cloud/ornament, 8 dark gradient (90deg  .92→.20 + bottom transparent 45%→.9), 9 text, 10 CTA, 11 countdown
- Photography: Prambanan + Merapi sunset, rule of thirds (text left, subject center/right), vignette
- Title: `LKBB EVENT` 10px tracking 0.18em gold, `JAWASOMA` 84–110px Cormorant -0.02em #E8C47C, `THE IMPRESSION 2026` 13px tracking 0.28em, tagline 16–18px 1.5 320px max, meta `24 Oktober 2026` + `Kertosono` with Calendar/MapPin 16px 1.5px, CTA `Mulai Voting →` 44–48px radius 999px gold gradient #E8C47C→#C48A3D, countdown open typography `12 Hari` etc with 1px vertical separator opacity .15
- Gunungan: right edge oversized 60–75% visible, `overflow:hidden`, opacity .8–1, parallax 0.20
- Batik: Truntum/Kawung/Parang SVG CC0/CC BY-SA, opacity .025–.06 with mask linear, not repeat 1

## 9. Quick Info Bar (Feature Navigation Strip)
4 items: Peserta/Cara Voting/Hadiah/FAQ — bg #080705, border top rgba gold .15, bottom .10, icon Phosphor Regular 22px #D9AA5C

## 10. Participants (Cinematic Gallery)
- Header: `Peserta` Cormorant 22px, sub, filter `Semua/Putra/Putri/Campuran` segmented capsule (active #E3BC72 text #100C07, inactive transparent border white/.15), search 240–280px glass rgba .03 border .10
- Card: 4 col desktop /2 tablet /1 mobile, image 4:3, overlay `transparent 30% → rgba(0,0,0,.85)`, number badge 32×32 border rgba gold .6 bg rgba(0,0,0,.4) blur 8px, heart gold hover, `Vote Sekarang` beige pill, vote count eye, hover `scale 1.045` + `translateY -4px` + border gold .18→.55 + brightness 1.05, easing cubic-bezier(.22,1,.36,1)

## 11. Featured Team (Editorial Profile)
Rank + image bleed + name/category/location/description + total vote/pct/position + 6-field grid (Nama Tim/Pelatih/Asal Sekolah/Jumlah Anggota/Tahun Berdiri/Motivasi) icons User/UserCircle/GraduationCap/Users/Calendar/Sparkle + gallery horizontal rail + quote `rgba(255,255,255,.035)` border .06 gold quote 48px + CTA

## 12. Leaderboard (Luxury Ranking List)
5 rows, columns rank/icon/name/vote/pct, rank1 gold badge + crown subtle bg, not whole row gold

## 13. Winner Showcase (Hasil Akhir)
Center winner image + crown, Juara 1 gold, Juara 2/3 side, cinematic not table

## 14. Story (Lebih dari Sekadar Kompetisi)
Asymmetric image + text editorial manifesto

## 15. Motion
- GSAP + ScrollTrigger + Lenis smooth scroll
- Easing: `cubic-bezier(.22,1,.36,1)` for reveal/card/nav/image
- Entrance: opacity 0→1 + translateY 20→0 600–900ms, hero clip-path, image scale 1.08→1, ornament opacity 0→.2
- Parallax: bg 0.05, env 0.08, subject 0.15, ornament 0.20, UI 0, mouse ±8–12px, respect prefers-reduced-motion
- Particles: 20–40 gold dust 2–3px opacity .15–.35 blur 0–2px 8–14s, not 300
- Vignette, gold dust, float Y±8px, drift X±12px, parallax, draw, reveal

## 16. Glass & Blur
Ambient blur 40–80px .08–.15, glass 16–24px .04–.10, foreground 4–8px .10–.18 — never full glass

## 17. Responsive
Desktop asymmetric, tablet simplified, mobile 1-col cinematic, hero 720–850px, gunungan right -80px opacity .12, bottom nav Beranda/Peserta/Voting/Hasil/Menu

## 18. Assets
- Gunungan SVG Wikimedia CC BY-SA (modify with attribution) or Truntum/Kawung CC0
- Prambanan Commons CC BY 2.0 (credit)
- Batik motifs: Truntum/Kawung/Parang (CC0 preferred), opacity .025–.06 + mask
- Attribution record per asset

## 19. Performance & A11y
AVIF/WebP, SVG, lazy, thumbnails, GPU transforms; keyboard nav, focus, alt, aria, reduced-motion off for parallax

## 20. Anti-Slop (JANGAN)
white dashboard, generic SaaS card, giant rounded, glassmorphism, purple/blue gradient, emoji, random illustration, all centered, same layout, flat static, random gunungan, all glow, default shadcn
