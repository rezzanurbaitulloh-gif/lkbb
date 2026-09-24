# WIREFRAME — Cinematic Javanese Heritage (12-col Asymmetric)

## Desktop 1440 (1280 content + 64 gutter)
```
| 1 2 3 4 5 6 7 8 9 10 11 12 |
Navbar: [logo 2cols][nav 7cols][actions 3cols] h72
Hero: full-bleed, 12-col, left 7 cols text + right 5 cols image bleed + gunungan oversized right -100px (60% visible) + countdown 4 pills bottom-right
QuickInfo: full-bleed strip 4 cols equal
Peserta: header 8cols + filter 4cols, grid 3 cols? Actually 4 cards per row = 3 cols each (12/4=3), gap 16
Featured: 7 cols (profile) + 5 cols (leaderboard) — image bleed left
Hasil: full-bleed, center winner 4 cols, side 4 cols each
Story: 5 cols image + 7 cols text asymmetric
Footer: 12-col 3 cols (5+3+4)
```

## Tablet 768
- Navbar: logo + hamburger
- Hero: stack 1-col, gunungan opacity .12 right -80px
- Peserta: 2 cols
- Featured: 1-col stack
- Hasil: 1-col stack

## Mobile 375
- Hero: 720px height, 1-col, countdown 2x2 grid, gunungan right -80px opacity .12
- Peserta: 1-col cinematic, card 4:3, full-width
- Leaderboard: rank/team/vote 1-col, pct secondary line
- Bottom Nav: 5 items Beranda/Peserta/Voting/Hasil/Menu

## Sections & CMS control
- Hero `is_visible` false = hide
- Participant `is_visible` false = hide
- Featured/Leaderboard/Result each toggle via CMS, but structure fixed (admin cannot change grid/DOM)

## Motion triggers
- Hero: clip reveal title, scale image, gunungan drift, gold line draw
- Participant cards: stagger 16px→0 opacity
- Leaderboard: reveal per row
- Winner: scale + crown float
