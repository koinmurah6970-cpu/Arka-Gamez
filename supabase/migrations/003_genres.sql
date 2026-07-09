-- ============================================================
-- LOOKUP: genres (Co-op, Action, Adventure, Horror ...)
-- ============================================================
create table if not exists public.genres (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Many-to-many join table for games and genres
create table if not exists public.game_genres (
  game_id     uuid not null references public.games(id) on delete cascade,
  genre_id    uuid not null references public.genres(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (game_id, genre_id)
);

create index if not exists idx_game_genres_game on public.game_genres (game_id);
create index if not exists idx_game_genres_genre on public.game_genres (genre_id);

alter table public.genres enable row level security;
alter table public.game_genres enable row level security;

-- Policies for genres
create policy "genres_public_read" on public.genres for select using (true);
create policy "genres_admin_write" on public.genres for all using (public.is_admin()) with check (public.is_admin());

-- Policies for game_genres
create policy "game_genres_public_read" on public.game_genres for select using (true);
create policy "game_genres_admin_write" on public.game_genres for all using (public.is_admin()) with check (public.is_admin());

-- Seed standard genres
insert into public.genres (slug, name) values
  ('action', 'Action'),
  ('adventure', 'Adventure'),
  ('co-op', 'Co-op'),
  ('horror', 'Horror'),
  ('rpg', 'RPG'),
  ('shooter', 'Shooter'),
  ('simulation', 'Simulation'),
  ('strategy', 'Strategy'),
  ('sports-racing', 'Sports & Racing'),
  ('casual', 'Casual'),
  ('anime', 'Anime'),
  ('open-world', 'Open World')
on conflict (slug) do nothing;
