-- Migration: add game_requests table
-- Run once via: Supabase Dashboard > SQL Editor > paste & click Run

create table if not exists public.game_requests (
  id              uuid primary key default gen_random_uuid(),
  game_name       text not null,
  platform        text,
  notes           text,
  requester_name  text not null,
  requester_wa    text not null,
  status          text not null default 'pending'
                  check (status in ('pending','fulfilled','rejected')),
  admin_notes     text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_game_requests_status on public.game_requests (status);
create index if not exists idx_game_requests_created on public.game_requests (created_at desc);

alter table public.game_requests enable row level security;

-- anyone (anon + authenticated) can submit a request
create policy "game_requests_anon_insert" on public.game_requests
  for insert to anon, authenticated with check (true);

-- only admin can view / update / delete
create policy "game_requests_admin_select" on public.game_requests
  for select using (public.is_admin());
create policy "game_requests_admin_update" on public.game_requests
  for update using (public.is_admin()) with check (public.is_admin());
create policy "game_requests_admin_delete" on public.game_requests
  for delete using (public.is_admin());
