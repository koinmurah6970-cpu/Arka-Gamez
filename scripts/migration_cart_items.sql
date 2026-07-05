-- Cart items table: persistent cart per user stored in Supabase
create table if not exists cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  game_id    uuid not null references games(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, game_id)
);

alter table cart_items enable row level security;

create policy "Users manage their own cart"
  on cart_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
