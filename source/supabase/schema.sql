-- Run this file once in the Supabase SQL editor.
-- Participants may insert completed responses. Only authenticated researchers
-- may read them. The public GitHub Pages bundle never receives a service key.

create table if not exists public.experience_responses (
  id text primary key,
  project_id text not null,
  family_id text not null,
  member_id text not null,
  member_name text not null,
  member_role text not null,
  scenario_id text not null,
  choice text not null check (choice in ('A', 'B', 'C', 'Other')),
  choice_label text not null,
  decision_time_ms integer not null check (decision_time_ms >= 0),
  third_option text not null default 'None',
  difficulty integer not null check (difficulty between 1 and 5),
  rationale text not null,
  created_at timestamptz not null default now()
);

create index if not exists experience_responses_project_family_idx
  on public.experience_responses (project_id, family_id, created_at);
create index if not exists experience_responses_project_scenario_idx
  on public.experience_responses (project_id, scenario_id, created_at);

create table if not exists public.researcher_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.experience_responses enable row level security;
alter table public.researcher_access enable row level security;

-- Keep Data API privileges narrower than the RLS policies: participants can
-- only append records, while signed-in researchers can only read them.
revoke all on public.experience_responses from anon, authenticated;
grant insert on public.experience_responses to anon, authenticated;
grant select on public.experience_responses to authenticated;
revoke all on public.researcher_access from anon, authenticated;
grant select on public.researcher_access to authenticated;

drop policy if exists "participants can submit responses" on public.experience_responses;
create policy "participants can submit responses"
  on public.experience_responses
  for insert
  to anon, authenticated
  with check (
    length(project_id) between 1 and 120
    and length(family_id) between 1 and 120
    and length(member_id) between 1 and 120
    and length(scenario_id) between 1 and 160
    and length(rationale) between 1 and 5000
    and length(third_option) <= 5000
  );

drop policy if exists "researchers can read responses" on public.experience_responses;
create policy "researchers can read responses"
  on public.experience_responses
  for select
  to authenticated
  using (exists (
    select 1 from public.researcher_access
    where researcher_access.user_id = (select auth.uid())
  ));

drop policy if exists "researchers can verify their access" on public.researcher_access;
create policy "researchers can verify their access"
  on public.researcher_access
  for select
  to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  alter publication supabase_realtime add table public.experience_responses;
exception
  when duplicate_object then null;
end $$;
