# Blueprint — LKBB Multi-Event Platform (1 Repo / 1 Deploy / 1 DB / N Events)

> Generated: 2026-09-18 · Repo: `rezzanurbaitulloh-gif/lkbb` → `prj_L3gfzDE9OKCc5tdoVVya2OGIaDqR` (lkbb.vercel.app)
> Isolated legacy: `rezzanurbaitulloh-gif/lkbbvoting` (lkbbvoting.my.id) — **tidak disentuh**
> DB baru: `xkakoecfzeiednklsrqd` (Supabase) · Stack: Next.js 16.3.4 / Supabase / Xendit(+DOKU)

---

## 0. Ringkasan Eksekutif

**Objective:** ubah `lkbb` dari single-event (tabel `competitions` global) menjadi **platform multi-event** yang secure, isolated, payment-safe, production-ready, sesuai 69-section PRD.

**Constraint keras:**
- `lkbbvoting` tetap standalone, zero coupling.
- 1 repo, 1 Vercel deploy, 1 Supabase project, N events.
- `SUPER_ADMIN` tepat 1 akun, platform-level, protected.
- `ADMIN` event-scoped via `event_members`, `USER` voter.
- Semua data event-specific punya `event_id` + RLS + API guard. UI hide ≠ aman.
- Payment: 1 webhook pusat, event-resolved dari `orders.event_id`, idempotent, amount-validated, atomic wallet credit.
- Visual editor, sponsor, countdown, ballot price, revenue — semua event-scoped.

**Hasil akhir tervalidasi via:** `typecheck → lint → build → DB validation → RLS validation → security matrix (30 skenario) → Playwright E2E (desktop/mobile) → responsive → UI audit → PRD gap check`, diulang sampai gap kritis 0.

---

## 1. Audit — Arsitektur Sebelum

### 1.1 Repo & Deploy
- Next.js App Router (`src/app/*`), middleware auth global, `createBrowserSupabase / createServerSupabase / createServiceSupabase`.
- 1 deployment Vercel `prj_L3gfz...` keduanya lkbb & lkbbvoting terpisah (benar, dipertahankan).

### 1.2 Database (17 migrasi)
- **Auth:** `profiles(id→auth.users, email, public_name, role USER|ADMIN, avatar_url)` — role global, bukan per-event. `SUPER_ADMIN` dihapus di `013` (sekarang hanya USER/ADMIN). Trigger `handle_new_user` OK.
- **Event:** `competitions(id, name, tagline, state NOT_STARTED…COMPLETED, voting_start/end, settings jsonb{online_price, offline_price, ballot_presets, whatsapp…}, show_provisional_result, show_final_result)` — **single row global**, bukan tabel `events`. Gap: tidak ada `events` multi, tidak ada `event_id` di mana pun.
- **Teams:** `peletons(id, slug unique, number, name, school, city, province, category SMP/SMA, status, verified, active, display_order, image_url, logo_url, cover_url, support_count)` — tanpa `event_id`.
- **Ledger:** `supports(id, peleton_id, user_id, transaction_id, amount, supports, source online/offline, note, admin_id, created_at)` + `transactions(id, user_id, peleton_id, amount, supports, method, status Pending/Success/Failed/Expired, provider XENDIT/DOKU, provider_ref unique, source, expires_at, qr_content, doku_*, metadata)` — tanpa `event_id`, tanpa `ballot_wallets`.
- **Ranking:** `team_ranking` view (online/offline/total per peleton) — tanpa filter event.
- **CMS:** `cms_pages, cms_sections, site_settings, media_library, permissions, role_permissions, user_permissions, cms_revisions` — tanpa `event_id`.
- **Lain:** `sponsors, judges, news, announcements, faqs, timeline_stages, audit_logs(id,user_id,action,target,details,before_state,after_state), notifications, peleton_members/gallery (obsolete)`.
- **Storage buckets:** `media, avatars` public.
- **RLS:** partial. `profiles public read (true)`, `peletons verified+active`, `supports/transactions users read own`, `competitions public read`, `sponsors/judges active`, `cms public read published/visible`. Gap: tidak ada event isolation, tidak ada SUPER_ADMIN platform check, banyak tabel tanpa RLS event.

### 1.3 Auth & Middleware
- `middleware.ts` guard `/admin` & `/api/admin` via `profiles.role !== ADMIN` → redirect/403. Gap: tidak kenal event, tidak kenal SUPER_ADMIN, tidak resolve event dari hostname.

### 1.4 Payment
- Abstraction `PaymentProvider (DOKU|XENDIT)`, `provider.ts + doku/* + xendit/*`, `settle.ts` (idempotent via `supports.transaction_id` unique check, atomic update transaction→Success→insert supports→notifications→audit). Gap: order = `transactions` tanpa `event_id`, price dari `competitions.settings` global, webhook resolve event belum ada, tidak ada `orders/payments` terpisah, tidak ada `payment_webhook_events` idempotency table, tidak ada `ballot_wallets/ballot_transactions`, settle tidak cek `event_id` consistency.

### 1.5 Visual Editor / CMS
- `cms_pages/sections` + `site_settings` global. Gap: tidak event-scoped, perubahan Event A bocor ke Event B, tidak ada `is_protected`.

### 1.6 Hardcode & Risk
- `src/lib/config.ts` fallback prices — sudah deprecated benar, tapi masih ada fallback.
- `team_ranking` & banyak API hard-filter tanpa event.
- No event lifecycle guard (DRAFT…ARCHIVED) — hanya 4 state disederhanakan.

### 1.7 Testing
- Tidak ada Playwright, tidak ada RLS test, tidak ada security matrix test.

---

## 2. Arsitektur Sesudah (Target)

```
[Browser / Domain] → Middleware (resolve event dari hostname → event_id, attach x-event-id)
        ↓
Next.js (1 repo, 1 deploy) → Server Components / Route Handlers
        ↓  authenticate → Supabase Auth (1 global identity)
        ↓  authorize → platform_roles (SUPER_ADMIN) OR event_members(event_id,user_id,role)
        ↓  query → Supabase (1 project) dengan RLS event-scoped
        ↓
Tables (event_id di semua event-scoped) + Storage (event-scoped path) + Audit (event_id)
```

**Key tables baru / ubah:**

```
platform_roles(user_id PK, role SUPER_ADMIN, created_at) -- CHECK role='SUPER_ADMIN', trigger cegah insert kedua
events(id, slug unique, name, organizer_name, description, event_date, status DRAFT…ARCHIVED, logo, settings jsonb, created_at, updated_at)
event_domains(id, event_id FK, domain unique, is_primary, is_verified, created_at)
event_members(id, event_id FK, user_id FK, role ADMIN|USER, status active|invited|suspended, created_at, updated_at) UNIQUE(event_id,user_id)
-- alter add event_id ke: peletons, supports, transactions, sponsors, judges, news, announcements, faqs, timeline_stages, audit_logs, cms_pages, cms_sections, site_settings, media_library, notifications, ballot_wallets, ballot_transactions, payment_webhook_events
ballot_wallets(id, event_id, user_id, balance int, updated_at) UNIQUE(event_id,user_id)
ballot_transactions(id, event_id, user_id, wallet_id, type credit|debit|support, amount int, order_id, peleton_id, created_at)
payment_webhook_events(id, provider, provider_event_id, order_id, event_id, payload_hash unique, processed bool, created_at)
-- competitions dipertahankan sementara sebagai view/alias ke events untuk backward compat, lalu di-drop setelah migrasi
```

**Event lifecycle:** `DRAFT → SETUP → READY → VOTING_OPEN → VOTING_CLOSED → FINISHED → ARCHIVED` (map ke existing `NOT_STARTED…RESULT_PUBLISHED`).

**Domain resolution:** `event_domains.domain` unique, middleware resolve `host` → `event_id`, header `x-event-id` request-scoped (bukan global mutable), `VERCEL_URL` fallback ke default event.

---

## 3. Gap Analysis (PRD §68 DoD vs Sekarang)

| Area | Sekarang | Gap |
|---|---|---|
| Multi-event | 1 event global (`competitions` single row) | ❌ Belum |
| 1 repo/1 deploy/1 DB/N events | Repo 1 ok, tapi DB belum multi | ❌ |
| Event isolation + domain | Tidak ada | ❌ |
| SUPER_ADMIN 1 akun protected | Dihapus | ❌ |
| ADMIN event-scoped | Global ADMIN | ❌ |
| Dashboard 1 /admin menu dinamis | Static menu | ❌ |
| Teams/sponsors/countdown per event | Global | ❌ |
| Ballot price per event | Global `competitions.settings` | ❌ |
| Transactions per event | Global | ❌ |
| Revenue per event | Global | ❌ |
| Visual editor per event | Global | ❌ |
| Central webhook event-aware | Provider-specific, tanpa event_id | ❌ |
| Idempotency | Partial (`supports.transaction_id`) | ❌ |
| Ballot wallet | Tidak ada, langsung supports | ❌ |
| RLS event-scoped | Tidak | ❌ |
| Audit event_id | Tidak | ❌ |
| No hardcode | Sebagian | ⚠️ |
| Playwright/Rls/security test | Tidak ada | ❌ |

---

## 4. Steps (8 PRs, cold-start capable)

### STEP 1 — DB Foundation (Model, Migration, Backfill) — STRONGEST, serial
**Branch:** `feat/multi-event-db-foundation`
**Context brief:** Repo single-event. Semua tabel event-scoped belum punya `event_id`. Harus buat `events/platform_roles/event_members/event_domains/ballot_*` tanpa hapus data production, backfill 1 default event dari `competitions` row existing, semua kolom baru nullable dulu lalu di-backfill lalu di-`NOT NULL`kan bertahap.
**Tasks:**
- [ ] `018_multi_event_foundation.sql`: create `events`, `platform_roles`, `event_members`, `event_domains`, `ballot_wallets`, `ballot_transactions`, `payment_webhook_events` (dengan index & constraint PRD §51-54).
- [ ] Seed `events` dari `competitions` paling baru (`name/slug/event_date/status` map). Set `slug = lkbb-2026` default.
- [ ] `ALTER TABLE peletons/supports/transactions/sponsors/... ADD COLUMN event_id uuid REFERENCES events(id)` nullable.
- [ ] Backfill `event_id = <default_event_id>` untuk semua row existing.
- [ ] `UNIQUE(event_id,user_id)` di `event_members`, `domain UNIQUE` di `event_domains`.
- [ ] `platform_roles` CHECK `role='SUPER_ADMIN'` + trigger `prevent_second_super_admin()` (count>1 → exception).
- [ ] Insert 1 SUPER_ADMIN dari env `SUPER_ADMIN_EMAIL` (service role, tidak via UI).
- [ ] Keep `competitions` as-is untuk backward compat (akan di-migrate ke `events` di step 7).
**Verify:** `npx supabase db push --dry-run` ok, `SELECT count(*) FROM events` 1, semua `event_id` NOT NULL setelah backfill (cek via `WHERE event_id IS NULL` 0).
**Exit:** migration applied di `xkakoecf...` tanpa data loss, `platform_roles` 1 row, semua event-scoped tables punya `event_id` terisi.
**Rollback:** `supabase db reset` ke migrasi 017, atau `DROP TABLE events CASCADE` (hanya di staging).

### STEP 2 — AuthZ Core (SUPER_ADMIN + Event Members, Middleware Event Resolution) — STRONGEST, depends 1
**Branch:** `feat/multi-event-authz`
**Context brief:** Auth masih global. Butuh helper `getEventContext(req)` yang resolve `event_id` dari `host` (via `event_domains`) server-side, dan helper `requireAuthz({event_id, required: ADMIN|SUPER_ADMIN})` yang cek `platform_roles` dulu lalu `event_members`.
**Tasks:**
- [ ] `src/lib/event.ts`: `resolveEventFromHost(host)`, `getEventContext(req)`, `requireEventAdmin(event_id)`, `requireSuperAdmin()`, `isSuperAdmin(user_id)`.
- [ ] `middleware.ts`: resolve event per-request, set `x-event-id` header, guard `/admin` check event_members OR platform_roles, guard `/api/admin` sama. Jangan pakai `role` dari `profiles` lagi sebagai source event role.
- [ ] `src/lib/supabase.ts`: helper `createEventSupabase(event_id)` jika perlu.
- [ ] Protect SUPER_ADMIN: no API boleh `INSERT platform_roles` kecuali service_role seed; `PATCH/DELETE platform_roles` deny untuk non-service.
- [ ] `profiles.role` tetap untuk backward compat tapi bukan source of truth event role (tulis di komentar).
**Verify:** `npx tsc --noEmit`, `middleware.test.ts` (host→event_id), manual curl `Host: event-a.lkbb.vercel.app` → `x-event-id` benar.
**Exit:** `SUPER_ADMIN` login ke event manapun → akses semua; `ADMIN` event A login ke event B → USER saja.

### STEP 3 — RLS & API Guards (Event Isolation) — DEFAULT, depends 2
**Branch:** `feat/multi-event-rls`
**Context brief:** RLS belum event-aware. Semua SELECT tanpa `event_id` bocor cross-event. Harus enable RLS event-scoped + API authorize per-request.
**Tasks:**
- [ ] `019_rls_event_isolation.sql`: enable RLS, policies per tabel:
  - `peletons`: `SELECT WHERE event_id = current_event_id() AND verified+active`, `ADMIN(event_id)` can write.
  - `supports/transactions/sponsors/...` similar (`event_id = current_event_id()`).
  - Helper `current_event_id()` via `SET LOCAL app.event_id` dari `auth.jwt()`? Atau pakai `is_super_admin()` bypass. Alternatif: RLS via `exists (select 1 from event_members where event_id = table.event_id AND user_id = auth.uid())` + `is_super_admin(auth.uid())`.
  - `audit_logs`: `event_id` required, no UPDATE/DELETE for anyone.
- [ ] Update semua Route Handlers: `requireEventContext` → `event_id` → query `WHERE event_id = ?`. Validasi `order.event_id == team.event_id` consistency.
- [ ] `src/app/api/admin/crud` → tambah `event_id` filter, block cross-event.
- [ ] Add `X-Event-Id` cache vary.
**Verify:** RLS validation script (insert as Admin A, try read as Admin B → 0 rows), `EXPLAIN` pakai index `event_id`.
**Exit:** 30-scenario matrix §48 sebagian besar DENY (test manual).

### STEP 4 — Domain Resolution & Cache Isolation — DEFAULT, depends 2
**Branch:** `feat/multi-event-domain-cache`
**Context brief:** Cache global bisa bocor Event A → Event B. Domain adalah source of truth, bukan `?event_id` atau `localStorage`.
**Tasks:**
- [ ] `event_domains` CRUD di `/admin` (SUPER_ADMIN only).
- [ ] Middleware: `event-a.lkbb.vercel.app → event_id A`, `lkbb.vercel.app` → default event (slug `lkbb-2026`).
- [ ] `revalidate` & `fetch` cache key include `event_id` (`unstable_cache` key `['teams', event_id]`), atau `no-store` untuk sensitif.
- [ ] Remove `currentEvent` global mutable.
**Verify:** `curl -H "Host: event-a..."` vs `event-b` → data berbeda, no leakage.
**Exit:** domain unique constraint, cache key event-aware.

### STEP 5 — Payment Event-Aware + Idempotency + Ballot Wallet — STRONGEST, depends 1,3
**Branch:** `feat/multi-event-payment`
**Context brief:** Payment masih `transactions` tanpa `event_id`, price global, settle langsung `supports`. Harus jadi `orders(event_id)` → `payments` → `ballot_wallets`.
**Tasks:**
- [ ] `src/lib/payment/provider.ts`: tambah `eventId` di `PaymentCreateParams`, `merchant_account_id` per event.
- [ ] `POST /api/transactions`: resolve event, `price = events.settings.online_price`, `INSERT transactions(event_id, ...)`, `INSERT orders` jika dipisah (atau `transactions` sebagai orders).
- [ ] `payment_webhook_events` idempotency: `payload_hash` unique, `SELECT ... FOR UPDATE` on order, amount check, duplicate → no double credit.
- [ ] `ballot_wallets` + `ballot_transactions`: `settlePaidTransaction` → `UPDATE wallet SET balance = balance + supports` atomically (`INSERT ... ON CONFLICT DO UPDATE`), lalu `INSERT ballot_transactions`, lalu `supports` (team vote) debit wallet.
- [ ] Single webhook `POST /api/payment/webhook` dispatcher (Xendit/DOKU by header), verify signature, read `event_id` from DB, not URL.
- [ ] Keep `supports` as final vote ledger (1 ballot=1 point) tapi sekarang via wallet.
**Verify:** webhook replay test (kirim 2x payload sama → balance +100 sekali), amount mismatch → reject.
**Exit:** revenue tidak double-count, concurrent double-credit safe.

### STEP 6 — Revenue & Transactions Isolation — DEFAULT, depends 3,5
**Branch:** `feat/multi-event-revenue`
**Context brief:** Revenue global. Admin Event A bisa lihat revenue Event B via `?event_id=B` jika tidak di-guard.
**Tasks:**
- [ ] `src/app/api/admin/stats`: filter `WHERE event_id = current_event_id` untuk semua count, recentTx, ranking, chart. SUPER_ADMIN `?event_id=all` → global.
- [ ] `src/app/api/transactions`: `GET ?all=true` → check event membership, `WHERE event_id = ?`.
- [ ] Dashboard: `totalRevenue`, `ballotSold` pakai `paid_at` (bukan `created_at`), timezone Asia/Jakarta, filter `status=Success`.
- [ ] `src/app/admin/transaksi/page.tsx` & `src/app/admin/page.tsx` recentTx → event-scoped fetch.
**Verify:** `Admin A → /api/admin/stats?event_id=B` → 403, `SUPER_ADMIN` → 200.
**Exit:** Example §35 validated (300k/150k/450k).

### STEP 7 — Dashboard & Visual Editor Event-Scoped — DEFAULT, depends 1,3
**Branch:** `feat/multi-event-dashboard-editor`
**Context brief:** 1 route `/admin` harus render menu berbeda per role, dan visual editor/CMS harus event-scoped.
**Tasks:**
- [ ] `/admin` layout: fetch `platform_roles` + `event_members(event_id)`, render nav per matrix §45 (SUPER_ADMIN all, ADMIN own event, USER redirect).
- [ ] Event switcher untuk SUPER_ADMIN: `[ All Events ▼ ]` → `?event_id=` query, context provider.
- [ ] `cms_pages/sections/site_settings/media_library`: tambah `event_id`, migrate existing `event_id = default`, RLS event-scoped.
- [ ] `page_elements` (jika belum ada) → `event_id, page_id, type, props, style, visibility, position, order, is_protected`.
- [ ] Editor guard: `is_protected` (AUTH/PAYMENT/VOTING_CORE) cannot delete, confirmation + audit log.
**Verify:** Admin A edit Event B via API → 403, SUPER_ADMIN switcher works, `is_protected` cannot delete.
**Exit:** Visual Editor Event A tidak memengaruhi Event B.

### STEP 8 — Security Hardening + Playwright + Verification Loop — DEFAULT, depends 3,5,6,7
**Branch:** `feat/multi-event-hardening`
**Context brief:** Final gate. Harus lolos 30-scenario matrix + Playwright + RLS validation + responsive + UI audit.
**Tasks:**
- [ ] `npx tsc --noEmit`, `npx eslint`, `npm run build` green.
- [ ] RLS validation script (supabase-js as anon/authenticated).
- [ ] Security matrix §48 (30 tests) — script `tests/security/matrix.test.ts` semua DENY saat tidak berhak.
- [ ] Playwright E2E: `tests/e2e/multi-event.spec.ts` (Super Admin login, Admin A/B, cross-event, domain resolution, team CRUD, ballot price, voting, results, transaction, revenue, webhook, visual editor, SUPER_ADMIN protection).
- [ ] Responsive matrix (mobile/tablet/desktop/1366/1920).
- [ ] `AUDIT_REPORT.md` update, `Definition of Done` checklist §68 tick.
**Verify:** `npx playwright test --project=chromium` all green, `npm run build` green.
**Exit:** Production-ready, deployment readiness report (§16 items).

---

## 5. Migration Safety (Jangan Rusak lkbbvoting)

- Semua `ALTER TABLE ... ADD COLUMN event_id` **nullable dulu**, backfill, baru `SET NOT NULL` di migrasi terpisah setelah verify.
- `lkbbvoting` repo & DB (`ghunq...`) **tidak tersentuh**. Deploy `lkbb` tetap `prj_L3gfz...`. Env `lkbb` sudah di-point ke DB baru `xkako...` (verified).
- `competitions` tidak di-drop di step 1-6; di-alias ke `events` via view `CREATE VIEW competitions AS SELECT ... FROM events` setelah stabil, lalu di-drop di step 8.

---

## 6. Indexes & Performance (PRD §49)

```sql
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_event_members_event_user ON event_members(event_id, user_id);
CREATE INDEX idx_teams_event_category ON peletons(event_id, category, active, display_order);
CREATE INDEX idx_supports_event_peleton ON supports(event_id, peleton_id);
CREATE INDEX idx_transactions_event_status ON transactions(event_id, status);
CREATE INDEX idx_transactions_event_paid ON transactions(event_id, paid_at) WHERE status='Success';
-- ... plus yang sudah ada
```

Pagination: `limit 50` + `cursor` untuk transaksi, `order by total_ballots desc` via `team_ranking` mat view per event.

---

## 7. SUPER_ADMIN Protection (PRD §4,19,25-28)

- `platform_roles` hanya `SUPER_ADMIN`, `UNIQUE(user_id)` + trigger `BEFORE INSERT` cek `COUNT(*) =0` → `RAISE EXCEPTION 'Only one SUPER_ADMIN allowed'`.
- Semua `event_members` write: `IF is_super_admin(target_user_id) THEN RAISE EXCEPTION 'Cannot modify SUPER_ADMIN'`.
- Middleware & RLS: `is_super_admin(auth.uid())` → bypass event check (tapi tetap audit).
- UI: Admin tidak pernah lihat menu `Platform Settings` / `Global Revenue` / `Super Admin Management`.

---

## 8. Verification Loop (PRD §67)

```
AUDIT → PLAN (this file) → IMPLEMENT (step 1..8) → TYPECHECK → LINT → BUILD
→ DB VALIDATION (event_id NOT NULL, FK) → RLS VALIDATION (cross-event 0 rows)
→ SECURITY TEST (30 matrix) → PLAYWRIGHT (8 suites) → RESPONSIVE (5 viewports)
→ UI AUDIT (premium ceremonial, dark default) → PRD GAP → FIX → TEST AGAIN
```

---

## 9. File yang Akan Diubah (ringkas)

- `supabase/migrations/018_*.sql` .. `025_*.sql`
- `middleware.ts`, `src/lib/event.ts`, `src/lib/supabase.ts`, `src/lib/authz.ts`
- `src/app/api/**` (semua route admin + public + webhook)
- `src/app/admin/**` (layout, page, klasemen, transaksi, visual editor)
- `src/app/(public)/**` (beranda, tim, kompetisi, podium)
- `src/components/competition/Podium.tsx`, `src/components/cms/*`
- `tests/**` (playwright, security)

---

## 10. Deployment Readiness

- Env: `SUPER_ADMIN_EMAIL`, `XENDIT_*`, `DOKU_*` per-event di `event_settings` (bukan global), `SUPABASE_*` tetap global.
- Vercel: `lkbb` `prj_L3gfz...` auto-deploy dari `main`, `lkbbvoting` `prj_Zu2d...` tidak tersentuh.
- Rollback: tiap step punya revert migration (`down` sql di `supabase/migrations/.down/`).

---

## 11. Next Action (butuh konfirmasi sebelum eksekusi STEP 1)

1. **SUPER_ADMIN email** — siapa 1 akun owner? (contoh: `admin@lkbb.id` atau akun Supabase existing).
2. **Default event slug** — pakai `lkbb-2026` atau `javasoma-2026`?
3. **Domain mapping** — mau subdomain `*.lkbb.vercel.app` atau path `/e/[slug]` untuk MVP? (PRD minta hostname, tapi path lebih cepat untuk MVP).
4. **GO / HOLD** — setuju blueprint ini? Jika GO, gue langsung eksekusi **STEP 1 DB Foundation** (migration + backfill) di DB baru `xkako...` — aman, tidak sentuh `lkbbvoting`.

