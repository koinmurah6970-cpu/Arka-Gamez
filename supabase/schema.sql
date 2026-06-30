-- Arka Gamez / GAMOS Store — Supabase schema
-- Run via Supabase SQL editor or `supabase db push`. Idempotent (safe to re-run).

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fast ILIKE search across 1000+ games

-- ============================================================
-- LOOKUP: categories (Ringan / Sedang / Agak Berat / Berat ...)
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int  not null default 0
);

insert into public.categories (name, sort_order) values
  ('Ringan', 1), ('Sedang', 2), ('Agak Berat', 3), ('Berat', 4)
on conflict (name) do nothing;

-- ============================================================
-- CORE: games
-- ============================================================
create table if not exists public.games (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  size_label      text,                 -- raw display text, e.g. "130 Gb" (source data not fully normalized)
  size_gb         numeric,              -- parsed numeric value, nullable, used for sort/filter
  category_id     uuid references public.categories(id),
  price           numeric not null default 20000,
  original_price  numeric not null default 350000,
  cover_url       text,
  cover_source    text check (cover_source in ('steamgriddb','rawg','manual','placeholder')),
  source_id       text,                 -- steamgriddb/rawg id, for re-fetch/debug
  rating          numeric default 4.5,
  status          text not null default 'draft' check (status in ('draft','active','archived')),
  is_featured     boolean not null default false,  -- admin-curated highlight
  is_new          boolean not null default false,  -- sourced from catalog feed's "[NEW GAME]" tag
  view_count      bigint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_games_status on public.games (status);
create index if not exists idx_games_category on public.games (category_id);
create index if not exists idx_games_name_trgm on public.games using gin (name gin_trgm_ops);

-- ============================================================
-- game_media: pre-fetched screenshots/trailers (replaces live
-- RAWG calls from the browser on every product page view)
-- ============================================================
create table if not exists public.game_media (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.games(id) on delete cascade,
  media_type    text not null check (media_type in ('image','video')),
  url           text not null,
  thumbnail_url text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_game_media_game on public.game_media (game_id);

-- ============================================================
-- profiles: extends auth.users with app-level role
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  whatsapp_number text,
  role            text not null default 'customer' check (role in ('customer','admin')),
  created_at      timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- orders / order_items
-- ============================================================
create sequence if not exists public.order_number_seq;

create or replace function public.generate_order_number()
returns text language sql as $$
  select 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' ||
         lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique default public.generate_order_number(),
  user_id         uuid references public.profiles(id),   -- null = guest checkout
  guest_name      text,
  guest_whatsapp  text,
  player_id       text not null,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','paid','processing','completed','cancelled')),
  payment_method  text not null default 'whatsapp_manual',
  subtotal        numeric not null,
  total           numeric not null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_status on public.orders (status);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  game_id           uuid references public.games(id),
  game_name_snapshot text not null,   -- preserved even if the game is later renamed/archived
  price             numeric not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items (order_id);

-- Atomic checkout: insert order + items in one transaction via RPC,
-- instead of separate client-side inserts (avoids partial/orphaned orders).
create or replace function public.create_order(
  p_player_id      text,
  p_guest_name     text,
  p_guest_whatsapp text,
  p_items          jsonb   -- [{ "game_id": "...", "name": "...", "price": 20000 }, ...]
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.orders;
  v_total   numeric := 0;
  v_item    jsonb;
begin
  select coalesce(sum((i ->> 'price')::numeric), 0) into v_total
  from jsonb_array_elements(p_items) as i;

  insert into public.orders (user_id, guest_name, guest_whatsapp, player_id, subtotal, total)
  values (auth.uid(), p_guest_name, p_guest_whatsapp, p_player_id, v_total, v_total)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, game_id, game_name_snapshot, price)
    values (
      v_order.id,
      (v_item ->> 'game_id')::uuid,
      v_item ->> 'name',
      (v_item ->> 'price')::numeric
    );
  end loop;

  return v_order;
end;
$$;

-- PostgREST/RPC callers (anon = guest checkout, authenticated = logged-in customers)
grant execute on function public.create_order(text, text, text, jsonb) to anon, authenticated;

-- ============================================================
-- wishlists (optional, requires logged-in account)
-- ============================================================
create table if not exists public.wishlists (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ============================================================
-- import_jobs: audit trail for catalog/cover ETL runs
-- ============================================================
create table if not exists public.import_jobs (
  id            uuid primary key default gen_random_uuid(),
  source_file   text,
  total_rows    int,
  success_count int,
  error_count   int,
  run_by        uuid references public.profiles(id),
  started_at    timestamptz,
  finished_at   timestamptz,
  log           jsonb
);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_games_updated_at on public.games;
create trigger trg_games_updated_at before update on public.games
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.categories  enable row level security;
alter table public.games       enable row level security;
alter table public.game_media  enable row level security;
alter table public.profiles    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlists   enable row level security;
alter table public.import_jobs enable row level security;

-- categories: public read, admin write
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- games: public sees only active, admin sees/edits everything
create policy "games_public_read_active" on public.games for select using (status = 'active' or public.is_admin());
create policy "games_admin_write" on public.games for insert with check (public.is_admin());
create policy "games_admin_update" on public.games for update using (public.is_admin());
create policy "games_admin_delete" on public.games for delete using (public.is_admin());

-- game_media: public read, admin write
create policy "game_media_public_read" on public.game_media for select using (true);
create policy "game_media_admin_write" on public.game_media for all using (public.is_admin()) with check (public.is_admin());

-- profiles: user sees/edits own row, admin sees all
create policy "profiles_self_read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid());

-- orders: owner or admin can read; writes go through create_order() RPC / admin
create policy "orders_owner_read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders for update using (public.is_admin());

-- order_items: visible if you can see the parent order
create policy "order_items_owner_read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);

-- wishlists: owner only
create policy "wishlists_owner_all" on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- import_jobs: admin only
create policy "import_jobs_admin_all" on public.import_jobs for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Storage bucket for normalized cover art (create via dashboard
-- or supabase CLI if this block is skipped by your SQL editor)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('game-covers', 'game-covers', true)
on conflict (id) do nothing;

create policy "game_covers_public_read" on storage.objects for select
  using (bucket_id = 'game-covers');
create policy "game_covers_admin_write" on storage.objects for insert
  with check (bucket_id = 'game-covers' and public.is_admin());
create policy "game_covers_admin_update" on storage.objects for update
  using (bucket_id = 'game-covers' and public.is_admin());
