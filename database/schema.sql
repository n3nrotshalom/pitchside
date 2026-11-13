-- Run this entire file in Supabase Dashboard > SQL Editor.
-- It creates profiles, tournaments, teams and matches, with row-level security.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('fan', 'organizer')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'fan')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  location text,
  start_date date,
  end_date date,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  coach_name text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (tournament_id, name)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  kickoff_at timestamptz not null,
  venue text,
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'completed', 'postponed', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;

-- Profiles: users can read their own profile.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- Tournaments: everyone can view published tournaments; organizers manage their own.
drop policy if exists "Anyone reads published tournaments" on public.tournaments;
create policy "Anyone reads published tournaments"
on public.tournaments for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Organizers manage own tournaments" on public.tournaments;
create policy "Organizers manage own tournaments"
on public.tournaments for all
to authenticated
using (
  organizer_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
)
with check (
  organizer_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
);

-- Teams: visible when their tournament is published; only its organizer can manage.
drop policy if exists "Teams visible for published tournaments" on public.teams;
create policy "Teams visible for published tournaments"
on public.teams for select
to anon, authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_id and t.status = 'published'
  )
);

drop policy if exists "Organizers manage teams in own tournaments" on public.teams;
create policy "Organizers manage teams in own tournaments"
on public.teams for all
to authenticated
using (
  exists (
    select 1 from public.tournaments t
    join public.profiles p on p.id = auth.uid()
    where t.id = tournament_id and t.organizer_id = auth.uid() and p.role = 'organizer'
  )
)
with check (
  exists (
    select 1 from public.tournaments t
    join public.profiles p on p.id = auth.uid()
    where t.id = tournament_id and t.organizer_id = auth.uid() and p.role = 'organizer'
  )
);

-- Matches: visible when their tournament is published; only its organizer can manage.
drop policy if exists "Matches visible for published tournaments" on public.matches;
create policy "Matches visible for published tournaments"
on public.matches for select
to anon, authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_id and t.status = 'published'
  )
);

drop policy if exists "Organizers manage matches in own tournaments" on public.matches;
create policy "Organizers manage matches in own tournaments"
on public.matches for all
to authenticated
using (
  exists (
    select 1 from public.tournaments t
    join public.profiles p on p.id = auth.uid()
    where t.id = tournament_id and t.organizer_id = auth.uid() and p.role = 'organizer'
  )
)
with check (
  exists (
    select 1 from public.tournaments t
    join public.profiles p on p.id = auth.uid()
    where t.id = tournament_id and t.organizer_id = auth.uid() and p.role = 'organizer'
  )
);