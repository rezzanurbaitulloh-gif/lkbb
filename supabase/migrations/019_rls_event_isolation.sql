-- 019_rls_event_isolation.sql — RLS event-scoped + platform_roles
-- Depends on 018

-- Make helpers SECURITY DEFINER to bypass RLS when checking roles
create or replace function public.is_super_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_roles where user_id = uid and role='SUPER_ADMIN');
$$;

create or replace function public.is_event_admin(eid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin(uid) or exists (select 1 from public.event_members where event_id=eid and user_id=uid and role='ADMIN' and status='active');
$$;

-- Enable RLS for new tables
alter table public.events enable row level security;
alter table public.platform_roles enable row level security;
alter table public.event_members enable row level security;
alter table public.event_domains enable row level security;
alter table public.ballot_wallets enable row level security;
alter table public.ballot_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

-- EVENTS: public read, super admin all, event admin update own event
drop policy if exists "public read events" on public.events;
create policy "public read events" on public.events for select using (true);
drop policy if exists "super_admin all events" on public.events;
create policy "super_admin all events" on public.events for all using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
drop policy if exists "event_admin update own event" on public.events;
create policy "event_admin update own event" on public.events for update using (public.is_event_admin(id, auth.uid())) with check (public.is_event_admin(id, auth.uid()));

-- PLATFORM_ROLES: user can read own, super admin all, no update via RLS (only service_role)
drop policy if exists "users read own platform_role" on public.platform_roles;
create policy "users read own platform_role" on public.platform_roles for select using (auth.uid() = user_id or public.is_super_admin(auth.uid()));
drop policy if exists "super_admin manage platform_roles" on public.platform_roles;
create policy "super_admin manage platform_roles" on public.platform_roles for all using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

-- EVENT_MEMBERS: super admin all, event admin read/write own event, user read own
drop policy if exists "event_members read" on public.event_members;
create policy "event_members read" on public.event_members for select using (
  public.is_super_admin(auth.uid()) or
  public.is_event_admin(event_id, auth.uid()) or
  auth.uid() = user_id
);
drop policy if exists "event_members write" on public.event_members;
create policy "event_members write" on public.event_members for insert with check (public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid()));
drop policy if exists "event_members update" on public.event_members;
create policy "event_members update" on public.event_members for update using (public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())) with check (public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid()));
drop policy if exists "event_members delete" on public.event_members;
create policy "event_members delete" on public.event_members for delete using (public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid()));

-- EVENT_DOMAINS: public read, super admin all
drop policy if exists "public read event_domains" on public.event_domains;
create policy "public read event_domains" on public.event_domains for select using (true);
drop policy if exists "super_admin all event_domains" on public.event_domains;
create policy "super_admin all event_domains" on public.event_domains for all using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

-- BALLOT_WALLETS: user read own, event admin + super admin read all in event, write via service only + event admin
drop policy if exists "wallets read own" on public.ballot_wallets;
create policy "wallets read own" on public.ballot_wallets for select using (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid()) or auth.uid() = user_id
);
drop policy if exists "wallets write service or event admin" on public.ballot_wallets;
create policy "wallets write service or event admin" on public.ballot_wallets for all using (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())
) with check (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())
);

-- BALLOT_TRANSACTIONS: similar
drop policy if exists "ballot_tx read" on public.ballot_transactions;
create policy "ballot_tx read" on public.ballot_transactions for select using (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid()) or auth.uid() = user_id
);
drop policy if exists "ballot_tx write" on public.ballot_transactions;
create policy "ballot_tx write" on public.ballot_transactions for all using (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())
) with check (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())
);

-- PAYMENT_WEBHOOK_EVENTS: only service + super admin
drop policy if exists "webhook read super" on public.payment_webhook_events;
create policy "webhook read super" on public.payment_webhook_events for select using (public.is_super_admin(auth.uid()));
drop policy if exists "webhook write super" on public.payment_webhook_events;
create policy "webhook write super" on public.payment_webhook_events for all using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

-- Existing tables: add event-scoped write policies (keep public read as before for peletons etc, but add event check for writes)
-- PELETONS: public read verified+active (any event), write only event admin/super
drop policy if exists "public can read verified peletons" on public.peletons;
create policy "public can read verified peletons" on public.peletons for select using (verified = true and active = true);
drop policy if exists "event_admin write peletons" on public.peletons;
create policy "event_admin write peletons" on public.peletons for insert with check (public.is_event_admin(event_id, auth.uid()));
drop policy if exists "event_admin update peletons" on public.peletons;
create policy "event_admin update peletons" on public.peletons for update using (public.is_event_admin(event_id, auth.uid())) with check (public.is_event_admin(event_id, auth.uid()));
drop policy if exists "event_admin delete peletons" on public.peletons;
create policy "event_admin delete peletons" on public.peletons for delete using (public.is_event_admin(event_id, auth.uid()));

-- TRANSACTIONS: users read own, event admin/super read all in event, write event admin/super (but creation via service, so keep)
drop policy if exists "users read own transactions" on public.transactions;
create policy "users read own transactions" on public.transactions for select using (
  auth.uid() = user_id or public.is_event_admin(event_id, auth.uid()) or public.is_super_admin(auth.uid())
);
drop policy if exists "admin can read transactions" on public.transactions;
create policy "admin can read transactions" on public.transactions for select using (
  public.is_event_admin(event_id, auth.uid()) or public.is_super_admin(auth.uid())
);

-- SUPPORTS: similar
drop policy if exists "users read own supports" on public.supports;
create policy "users read own supports" on public.supports for select using (
  auth.uid() = user_id or public.is_event_admin(event_id, auth.uid()) or public.is_super_admin(auth.uid())
);
drop policy if exists "admin can read supports" on public.supports;
create policy "admin can read supports" on public.supports for select using (
  public.is_event_admin(event_id, auth.uid()) or public.is_super_admin(auth.uid())
);

-- SPONSORS: public read active, event admin write
drop policy if exists "public read sponsors" on public.sponsors;
create policy "public read sponsors" on public.sponsors for select using (active = true);
drop policy if exists "event_admin write sponsors" on public.sponsors;
create policy "event_admin write sponsors" on public.sponsors for all using (public.is_event_admin(event_id, auth.uid())) with check (public.is_event_admin(event_id, auth.uid()));

-- AUDIT_LOGS: admin read own event, super all, no delete
drop policy if exists "admin can read audit_logs" on public.audit_logs;
create policy "admin can read audit_logs" on public.audit_logs for select using (
  public.is_super_admin(auth.uid()) or public.is_event_admin(event_id, auth.uid())
);
-- Prevent delete/update via RLS (no policy = deny)
