-- 018_multi_event_foundation.sql — Multi-Event Platform Foundation
-- Target: 1 repo / 1 deploy / 1 DB / N events
-- Safe: ADD COLUMN nullable first, backfill default event, then enforce NOT NULL later step
-- SUPER_ADMIN: 1 akun rezzanurbaitulloh@gmail.com, protected

-- 1. EVENTS — master event table (migrasi dari competitions)
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null, -- e.g. lkbbvote, event-a
  name text not null,
  organizer_name text,
  description text,
  event_date date,
  status text not null default 'DRAFT' check (status in ('DRAFT','SETUP','READY','VOTING_OPEN','VOTING_CLOSED','FINISHED','ARCHIVED','NOT_STARTED','ACTIVE','REGISTRATION','VERIFICATION','RESULT_VERIFICATION','RESULT_PUBLISHED','COMPLETED')),
  logo text,
  settings jsonb default '{}'::jsonb,
  voting_start timestamptz,
  voting_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_status on public.events(status);

-- Seed default event dari competitions existing (jika belum ada)
do $$
declare
  comp record;
  evt_id uuid;
begin
  select * into comp from public.competitions order by created_at desc limit 1;
  if comp is not null then
    select id into evt_id from public.events where slug='lkbbvote' limit 1;
    if evt_id is null then
      insert into public.events (id, slug, name, organizer_name, description, event_date, status, settings, voting_start, voting_end)
      values (
        gen_random_uuid(),
        'lkbbvote',
        coalesce(comp.name, 'LKBB JAVASOMA'),
        'PASKIBRA SMKN 1 KERTOSONO',
        coalesce(comp.tagline, 'ASTRA DHARMA HAYUNING BUDAYA'),
        coalesce(comp.event_date, '2026-10-24'::date),
        case when comp.state in ('DRAFT','SETUP','READY','VOTING_OPEN','VOTING_CLOSED','FINISHED','ARCHIVED') then comp.state
             when comp.state='ACTIVE' then 'VOTING_OPEN'
             when comp.state='RESULT_PUBLISHED' then 'FINISHED'
             else 'READY' end,
        coalesce(comp.settings, '{}'::jsonb),
        comp.voting_start,
        comp.voting_end
      ) returning id into evt_id;
    end if;
  else
    -- fallback jika competitions kosong
    insert into public.events (slug, name, status, settings) values ('lkbbvote','LKBB JAVASOMA','READY','{}'::jsonb) on conflict (slug) do nothing;
  end if;
end $$;

-- 2. PLATFORM_ROLES — SUPER_ADMIN platform-level, hanya 1
create table if not exists public.platform_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role='SUPER_ADMIN'),
  created_at timestamptz default now()
);
-- Guard: hanya 1 SUPER_ADMIN
create or replace function public.prevent_second_super_admin()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.platform_roles) >= 1 and not exists (select 1 from public.platform_roles where user_id = new.user_id) then
    raise exception 'Only one SUPER_ADMIN allowed';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_prevent_second_super_admin on public.platform_roles;
create trigger trg_prevent_second_super_admin before insert on public.platform_roles for each row execute function public.prevent_second_super_admin();

-- 3. EVENT_MEMBERS — ADMIN/USER per event
create table if not exists public.event_members (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('ADMIN','USER')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);
create index if not exists idx_event_members_event_user on public.event_members(event_id, user_id);
create index if not exists idx_event_members_user on public.event_members(user_id);

-- Guard: tidak boleh ubah/hapus SUPER_ADMIN via event_members
create or replace function public.prevent_super_admin_member_change()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.platform_roles where user_id = coalesce(new.user_id, old.user_id)) then
    raise exception 'Cannot modify SUPER_ADMIN via event_members';
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_prevent_super_admin_member on public.event_members;
create trigger trg_prevent_super_admin_member before insert or update or delete on public.event_members for each row execute function public.prevent_super_admin_member_change();

-- 4. EVENT_DOMAINS — subdomain per event
create table if not exists public.event_domains (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  domain text unique not null, -- e.g. lkbbvote.lkbb.vercel.app
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_event_domains_domain on public.event_domains(domain);
create index if not exists idx_event_domains_event on public.event_domains(event_id);

-- Seed domain untuk default event (subdomain)
do $$
declare evt_id uuid;
begin
  select id into evt_id from public.events where slug='lkbbvote' limit 1;
  if evt_id is not null then
    insert into public.event_domains (event_id, domain, is_primary, is_verified) values (evt_id, 'lkbbvote.lkbb.vercel.app', true, true) on conflict (domain) do nothing;
    insert into public.event_domains (event_id, domain, is_primary, is_verified) values (evt_id, 'lkbb.vercel.app', false, true) on conflict (domain) do nothing;
  end if;
end $$;

-- 5. BALLOT_WALLETS & BALLOT_TRANSACTIONS
create table if not exists public.ballot_wallets (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  balance int not null default 0 check (balance >=0),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);
create index if not exists idx_ballot_wallets_event_user on public.ballot_wallets(event_id, user_id);

create table if not exists public.ballot_transactions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid references public.ballot_wallets(id) on delete set null,
  type text not null check (type in ('credit','debit','support')),
  amount int not null check (amount >0),
  order_id uuid,
  peleton_id uuid references public.peletons(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_ballot_tx_event_user on public.ballot_transactions(event_id, user_id);
create index if not exists idx_ballot_tx_order on public.ballot_transactions(order_id);

-- 6. PAYMENT_WEBHOOK_EVENTS — idempotency
create table if not exists public.payment_webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  provider_event_id text not null,
  order_id uuid,
  event_id uuid references public.events(id) on delete set null,
  payload_hash text not null unique,
  processed boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_webhook_provider_event on public.payment_webhook_events(provider, provider_event_id);
create index if not exists idx_webhook_order on public.payment_webhook_events(order_id);

-- 7. ADD event_id to existing event-scoped tables (nullable dulu, backfill, nanti NOT NULL di migrasi 019)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='peletons' and column_name='event_id') then
    alter table public.peletons add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_peletons_event on public.peletons(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='supports' and column_name='event_id') then
    alter table public.supports add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_supports_event on public.supports(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='transactions' and column_name='event_id') then
    alter table public.transactions add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_transactions_event on public.transactions(event_id);
    create index if not exists idx_transactions_event_status on public.transactions(event_id, status);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='sponsors' and column_name='event_id') then
    alter table public.sponsors add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_sponsors_event on public.sponsors(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='audit_logs' and column_name='event_id') then
    alter table public.audit_logs add column event_id uuid references public.events(id) on delete set null;
    create index if not exists idx_audit_logs_event on public.audit_logs(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='cms_pages' and column_name='event_id') then
    alter table public.cms_pages add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_cms_pages_event on public.cms_pages(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='cms_sections' and column_name='event_id') then
    alter table public.cms_sections add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_cms_sections_event on public.cms_sections(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='site_settings' and column_name='event_id') then
    alter table public.site_settings add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_site_settings_event on public.site_settings(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='media_library' and column_name='event_id') then
    alter table public.media_library add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_media_event on public.media_library(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='event_id') then
    alter table public.notifications add column event_id uuid references public.events(id) on delete set null;
    create index if not exists idx_notifications_event on public.notifications(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='timeline_stages' and column_name='event_id') then
    alter table public.timeline_stages add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_timeline_event on public.timeline_stages(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='judges' and column_name='event_id') then
    alter table public.judges add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_judges_event on public.judges(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='news' and column_name='event_id') then
    alter table public.news add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_news_event on public.news(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='announcements' and column_name='event_id') then
    alter table public.announcements add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_announcements_event on public.announcements(event_id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='faqs' and column_name='event_id') then
    alter table public.faqs add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_faqs_event on public.faqs(event_id);
  end if;
end $$;

-- Backfill semua event_id ke default event lkbbvote
do $$
declare evt_id uuid;
begin
  select id into evt_id from public.events where slug='lkbbvote' limit 1;
  if evt_id is not null then
    update public.peletons set event_id=evt_id where event_id is null;
    update public.supports set event_id=evt_id where event_id is null;
    update public.transactions set event_id=evt_id where event_id is null;
    update public.sponsors set event_id=evt_id where event_id is null;
    update public.audit_logs set event_id=evt_id where event_id is null;
    update public.cms_pages set event_id=evt_id where event_id is null;
    update public.cms_sections set event_id=evt_id where event_id is null;
    update public.site_settings set event_id=evt_id where event_id is null;
    update public.media_library set event_id=evt_id where event_id is null;
    update public.notifications set event_id=evt_id where event_id is null;
    update public.timeline_stages set event_id=evt_id where event_id is null;
    update public.judges set event_id=evt_id where event_id is null;
    update public.news set event_id=evt_id where event_id is null;
    update public.announcements set event_id=evt_id where event_id is null;
    update public.faqs set event_id=evt_id where event_id is null;
  end if;
end $$;

-- Helper: is_super_admin
create or replace function public.is_super_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.platform_roles where user_id = uid and role='SUPER_ADMIN');
$$;

-- Helper: is_event_admin(event_id, uid)
create or replace function public.is_event_admin(eid uuid, uid uuid)
returns boolean language sql stable as $$
  select public.is_super_admin(uid) or exists (select 1 from public.event_members where event_id=eid and user_id=uid and role='ADMIN' and status='active');
$$;

comment on table public.events is 'Multi-event master — 1 row per event, slug lkbbvote default';
