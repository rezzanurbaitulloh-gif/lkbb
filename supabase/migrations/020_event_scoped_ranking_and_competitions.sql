-- 020_event_scoped_ranking_and_competitions.sql
-- Make competitions and team_ranking event-aware

-- 1. Add event_id to competitions (for per-event state)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='competitions' and column_name='event_id') then
    alter table public.competitions add column event_id uuid references public.events(id) on delete cascade;
    create index if not exists idx_competitions_event on public.competitions(event_id);
  end if;
end $$;

-- Backfill competitions.event_id to default event
do $$
declare evt_id uuid;
begin
  select id into evt_id from public.events where slug='lkbbvote' limit 1;
  if evt_id is not null then
    update public.competitions set event_id=evt_id where event_id is null;
  end if;
end $$;

-- 2. Recreate team_ranking view to be event-aware (include event_id)
drop view if exists public.team_ranking cascade;
create view public.team_ranking as
select
  p.event_id,
  p.id,
  p.slug,
  p.number,
  p.name,
  p.school,
  p.city,
  p.province,
  p.category,
  p.image_url,
  p.logo_url,
  p.cover_url,
  p.display_order,
  p.active,
  p.verified,
  coalesce(sum(case when s.source='online' then s.supports else 0 end),0) as online_ballots,
  coalesce(sum(case when s.source='offline' then s.supports else 0 end),0) as offline_ballots,
  coalesce(sum(s.supports),0) as total_ballots
from public.peletons p
left join public.supports s on s.peleton_id = p.id and s.event_id = p.event_id
where p.verified = true and p.active = true
group by p.id;

-- Grant
grant select on public.team_ranking to anon, authenticated, service_role;

-- 3. Update is_event_admin to handle NULL event_id gracefully (for old rows)
create or replace function public.is_event_admin(eid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    case when eid is null then
      exists (select 1 from public.event_members where user_id=uid and role='ADMIN' and status='active')
      or public.is_super_admin(uid)
    else
      public.is_super_admin(uid) or exists (select 1 from public.event_members where event_id=eid and user_id=uid and role='ADMIN' and status='active')
    end;
$$;
