-- Dev3pack Rust Scholarship application table and RLS
-- Created 2026-09-29

create extension if not exists pgcrypto;

-- Admin table
create table if not exists public.scholarship_admins (
  email text primary key
);

-- Settings for open/close window
create table if not exists public.scholarship_settings (
  id int primary key default 1,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  constraint single_row check (id = 1)
);

-- Main applications table
create table if not exists public.rust_scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone_whatsapp text not null check (char_length(phone_whatsapp) between 7 and 20),
  telegram_handle text,
  department text not null,
  level text not null check (level in ('100','200','300','400','500','Postgraduate','Graduate')),
  gender text not null check (gender in ('male','female')),
  github_url text,
  social_url text,
  club_member boolean not null,
  club_activity text check (char_length(club_activity) <= 600),
  programming_experience text not null check (programming_experience in ('never','beginner','intermediate','advanced')),
  languages_tools text[] not null default '{}',
  rust_experience text not null check (rust_experience in ('none','a_little','comfortable')),
  built_description text not null check (char_length(built_description) <= 800),
  built_link text,
  motivation text not null check (char_length(motivation) <= 800),
  rust_reasoning text not null check (char_length(rust_reasoning) <= 500),
  hard_learning text not null check (char_length(hard_learning) <= 600),
  goal_by_end_nov text not null check (char_length(goal_by_end_nov) <= 500),
  can_attend_full text not null check (can_attend_full in ('yes','mostly','no')),
  weekly_hours text not null check (weekly_hours in ('under_5','5_10','10_15','15_plus')),
  clashes text check (char_length(clashes) <= 300),
  has_laptop text not null check (has_laptop in ('yes','shared','no')),
  internet_quality text not null check (internet_quality in ('reliable','sometimes','poor')),
  support_needed text check (char_length(support_needed) <= 400),
  giveback_plan text not null check (char_length(giveback_plan) <= 500),
  how_heard text,
  accuracy_confirmed boolean not null check (accuracy_confirmed = true),
  seat_forfeit_ack boolean not null check (seat_forfeit_ack = true),
  data_consent boolean not null check (data_consent = true),
  -- Admin review fields
  status text not null default 'pending' check (status in ('pending','shortlisted','selected','waitlisted','rejected')),
  score_commitment smallint check (score_commitment between 0 and 5),
  score_motivation smallint check (score_motivation between 0 and 5),
  score_evidence smallint check (score_evidence between 0 and 5),
  score_community smallint check (score_community between 0 and 5),
  score_potential smallint check (score_potential between 0 and 5),
  score_giveback smallint check (score_giveback between 0 and 5),
  total_score numeric generated always as (
    coalesce(score_commitment,0)*0.25*20 +
    coalesce(score_motivation,0)*0.20*20 +
    coalesce(score_evidence,0)*0.20*20 +
    coalesce(score_community,0)*0.15*20 +
    coalesce(score_potential,0)*0.10*20 +
    coalesce(score_giveback,0)*0.10*20
  ) stored,
  reviewer_notes text,
  reviewed_by text,
  reviewed_at timestamptz
);

-- Unique email index
create unique index if not exists rust_scholarship_applications_email_lower_idx
on public.rust_scholarship_applications (lower(email));

-- Indexes
create index if not exists rust_scholarship_applications_status_idx
on public.rust_scholarship_applications (status);
create index if not exists rust_scholarship_applications_total_score_idx
on public.rust_scholarship_applications (total_score desc);

-- Helper functions
create or replace function public.is_scholarship_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.scholarship_admins
    where email = coalesce(auth.jwt() ->> 'email','')
  );
$$;

create or replace function public.applications_open()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.scholarship_settings
    where id = 1
      and now() >= opens_at
      and now() <= closes_at
  );
$$;

-- RLS
alter table public.rust_scholarship_applications enable row level security;
alter table public.scholarship_admins enable row level security;
alter table public.scholarship_settings enable row level security;

-- Policies for applications
drop policy if exists "anon can insert when open" on public.rust_scholarship_applications;
create policy "anon can insert when open"
on public.rust_scholarship_applications
for insert
to anon, authenticated
with check (
  public.applications_open()
  and status = 'pending'
  and score_commitment is null
  and score_motivation is null
  and score_evidence is null
  and score_community is null
  and score_potential is null
  and score_giveback is null
  and reviewer_notes is null
);

drop policy if exists "admins can select" on public.rust_scholarship_applications;
create policy "admins can select"
on public.rust_scholarship_applications
for select
to authenticated
using (public.is_scholarship_admin());

drop policy if exists "admins can update" on public.rust_scholarship_applications;
create policy "admins can update"
on public.rust_scholarship_applications
for update
to authenticated
using (public.is_scholarship_admin())
with check (public.is_scholarship_admin());

-- Settings read for anon to check open status
drop policy if exists "read settings" on public.scholarship_settings;
create policy "read settings"
on public.scholarship_settings
for select
to anon, authenticated
using (true);

-- Admins manage settings
drop policy if exists "admins manage settings" on public.scholarship_settings;
create policy "admins manage settings"
on public.scholarship_settings
for all
to authenticated
using (public.is_scholarship_admin())
with check (public.is_scholarship_admin());

-- Seed settings
insert into public.scholarship_settings (id, opens_at, closes_at)
values (1, now(), '2026-10-10 23:59:00+01')
on conflict (id) do update set closes_at = excluded.closes_at;

-- Seed admin
insert into public.scholarship_admins (email)
values ('benedictisaac258@gmail.com')
on conflict do nothing;
