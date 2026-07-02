-- Migration 002: rate limiting on create_order + new submit_game_request RPC
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. create_order: max 5 orders per WA number per hour
-- ============================================================
create or replace function public.create_order(
  p_player_id      text,
  p_guest_name     text,
  p_guest_whatsapp text,
  p_items          jsonb
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
  v_count   int;
begin
  -- Rate limit: max 5 orders per WA per hour
  select count(*) into v_count
  from public.orders
  where guest_whatsapp = p_guest_whatsapp
    and created_at > now() - interval '1 hour';

  if v_count >= 5 then
    raise exception 'rate_limit_exceeded'
      using hint = 'Terlalu banyak pesanan dari nomor ini. Coba lagi dalam 1 jam.';
  end if;

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

-- ============================================================
-- 2. submit_game_request: max 3 requests per WA per hour
--    Replaces direct INSERT so rate limit runs server-side
-- ============================================================
create or replace function public.submit_game_request(
  p_game_name      text,
  p_platform       text,
  p_notes          text,
  p_requester_name text,
  p_requester_wa   text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Rate limit: max 3 requests per WA per hour
  select count(*) into v_count
  from public.game_requests
  where requester_wa = p_requester_wa
    and created_at > now() - interval '1 hour';

  if v_count >= 3 then
    return json_build_object('error', 'rate_limit_exceeded');
  end if;

  insert into public.game_requests (game_name, platform, notes, requester_name, requester_wa)
  values (p_game_name, p_platform, p_notes, p_requester_name, p_requester_wa);

  return json_build_object('success', true);
end;
$$;

grant execute on function public.submit_game_request(text, text, text, text, text) to anon, authenticated;
