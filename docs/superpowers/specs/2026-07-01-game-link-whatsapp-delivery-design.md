# Game Download-Link Delivery via WhatsApp (Fonnte) — Design

Status: Approved by user 2026-07-01, ready for implementation planning.

## 1. Problem / Motivation

Customers buy multiple games per order (e.g. Bully, PES 2021, Forza Horizon). Today,
once an order is placed there is no automated way to hand over the download link for
each purchased game. The admin has to do this manually per order.

Goal: when the admin marks an order **Lunas (paid)**, the system should automatically:
1. Send the buyer a WhatsApp message listing each purchased game and its download link,
   followed by an invitation to join the store's WhatsApp group.
2. Reveal the same links on the storefront, on the buyer's own order page.

## 2. Scope

**In scope:**
- Game download links (one per game), admin-managed.
- Automatic WhatsApp delivery via Fonnte when an order becomes paid.
- Storefront reveal of links on the buyer's order page.
- Switching storefront checkout from guest + username/password to **mandatory Google
  login**, because it is a prerequisite for delivering links/messages safely and
  correctly (see Section 4).
- Basic abuse protection on the endpoints this feature touches (order creation,
  manual resend).

**Out of scope (explicitly not doing):**
- Admin login/auth (`/admin/login`) — untouched, stays username/password.
- Multiple download links / mirrors per game — one link per game only.
- Network-level DDoS mitigation — that's a hosting-platform concern (Vercel/Cloudflare
  edge protection), not something this application's code can provide. This design
  only rate-limits the specific endpoints this feature adds load to.
- Migrating any existing guest orders in a live production database (see Section 9,
  Risks).
- Fonnte account creation and WhatsApp device pairing — the user does this themselves
  at fonnte.com; this design only consumes the resulting API token.
- Google OAuth client setup in Google Cloud Console / Supabase Dashboard — the user
  does this themselves; this design only consumes the resulting provider config.

## 3. Current State (for context)

- Checkout (`(storefront)/checkout/page.tsx`) is guest-first: collects name, WhatsApp
  number, and Player ID on every order, calls the `create_order` RPC. No login
  required. Customer login (`(storefront)/(auth)/login`, `/daftar`) exists separately,
  using a username→fake-email trick over Supabase Auth, but isn't required to buy.
- `orders.user_id` is nullable ("null = guest checkout").
- RLS policy `orders_owner_read` is `user_id = auth.uid() or is_admin()`. Under SQL's
  three-valued logic, `NULL = NULL` is never true, so **guest orders are currently
  unreadable by anyone but an admin, including the guest who placed them** — the
  existing "Cek Pesanan" lookup-by-order-number page is very likely broken for its
  main use case today.
- Order numbers (`ORD-YYYYMMDD-00001`) are sequential and guessable.
- `games` table has no download-link column.
- No WhatsApp automation exists; the only WA touchpoint is a manual `wa.me` deep link
  the admin can click to open a chat.

## 4. Why Mandatory Google Login

Mandatory login resolves two problems at once instead of needing a bespoke fix for
each:

- **Fixes the existing RLS gap**: once every order has a real `user_id`, the
  `orders_owner_read` policy that already exists works correctly with zero policy
  changes needed.
- **Removes the need for unguessable order numbers**: authorization now comes from
  real ownership (RLS), not from the secrecy of the order number. Anyone who guesses
  another user's order number is still rejected by RLS unless they're logged in as
  that user or an admin.

Trade-off accepted by the user: guest checkout goes away entirely, which adds a login
step for casual/impulse buyers. Google OAuth keeps that step low-friction (no password
to create).

## 5. Auth Changes

- `(storefront)/(auth)/login/page.tsx` becomes a single "Lanjut dengan Google" button
  calling `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo:
  <origin>/auth/callback?next=<intended path> } })`.
- `(storefront)/(auth)/daftar/page.tsx` is **removed** — first-time Google sign-in
  both creates and logs in the account (via the existing `handle_new_user()` trigger),
  so a separate register page is redundant. Route redirects to `/login`.
- New route `app/auth/callback/route.ts`: standard Supabase `exchangeCodeForSession`
  handler, then redirects to `next` (default `/`).
- New route `app/(storefront)/(auth)/lengkapi-profil/page.tsx`: shown when
  `profiles.whatsapp_number IS NULL`. Single field, saves to `profiles`, then
  continues to `next`.
- `checkout/page.tsx`: drop the Nama/No. WhatsApp fields and their state. On mount (or
  server-side before render), if not authenticated → redirect to
  `/login?next=/checkout`; if authenticated but `whatsapp_number` is null → redirect
  to `/lengkapi-profil?next=/checkout`. Only Player ID remains as a form field.
- Admin login/session handling is untouched.

## 6. Schema Changes

```sql
alter table public.games add column if not exists download_url text;

alter table public.store_settings add column if not exists wa_group_link text;

alter table public.orders add column if not exists wa_sent_at timestamptz;
alter table public.orders add column if not exists wa_send_error text;
```

`create_order` RPC changes:
- Drop `p_guest_name` and `p_guest_whatsapp` parameters (no longer collected;
  `guest_name`/`guest_whatsapp` columns stay in the table, just unused going forward —
  no destructive column drop).
- Raise an exception if `auth.uid()` is null (defensive; the grant change below should
  already prevent this).
- Rate limit: before inserting, count orders by this `user_id` created in the last 10
  minutes; if the count is `>= 5`, raise an exception (`'Terlalu banyak pesanan,
  coba lagi nanti.'`).
- `revoke execute on function public.create_order(...) from anon;` — grant to
  `authenticated` only, since guest checkout no longer exists.

No changes needed to `orders_owner_read`, `order_items_owner_read`, or any other
existing RLS policy — they already do the right thing once `user_id` is always
populated.

## 7. Critical: Don't Leak `download_url` on Public Pages

`games` RLS (`games_public_read_active`) is row-level, not column-level — it can't
hide `download_url` on an otherwise-public row. Any public query that does
`select("*")` on `games` and passes the result into a Client Component will ship
`download_url` to every visitor's browser in the RSC payload, whether they bought the
game or not (Server Component data becomes visible client-side once passed as props to
a `"use client"` component, e.g. `<PurchasePanel game={game} />` currently receives the
whole `game` object).

**Required as part of implementation:** audit every public-facing `games` query
(catalog `(storefront)/page.tsx`, product detail `game/[slug]/page.tsx`'s `getGame()`,
`product-card.tsx`, and anywhere else) and switch `select("*")` to an explicit column
list that excludes `download_url`. `download_url` should only ever be selected in:
admin game edit/list queries, and the paid-order link-reveal/send code paths (Sections
8–9), which are already scoped to the owner or admin via RLS.

## 8. WhatsApp Delivery (Fonnte)

New module `web/src/lib/fonnte.ts`:
- `sendWhatsAppMessage(to: string, message: string)` — POSTs to
  `https://api.fonnte.com/send` with `Authorization: process.env.FONNTE_TOKEN`,
  `target`/`message` form fields. Returns `{ ok: true }` or `{ ok: false, error }`;
  never throws.
- `FONNTE_TOKEN` — new server-only env var (no `NEXT_PUBLIC_` prefix). Not stored in
  the database (would be publicly readable via `store_settings`' public-read RLS
  policy if it were).

New module (or same file) `buildGameLinksMessage({ customerName, orderNumber, items,
waGroupLink })` — builds the approved casual-tone message:

```
Halo {customerName}! 🎮
Pesanan {orderNumber} udah LUNAS, cus langsung download:

1️⃣ {game 1 name}
🔗 {game 1 link}

2️⃣ {game 2 name}
🔗 {game 2 link}

Makasih udah belanja di GAMOS STORE! 🙏
Gabung grup buat update promo & bantuan install ya: {waGroupLink}
```
(numbering repeats for however many items are in the order; a missing/blank
`download_url` on a game is rendered as "Link belum tersedia, admin bakal follow up
manual" for that line rather than being silently omitted.)

**Trigger** — `updateOrderStatus` in `admin/(protected)/pesanan/actions.ts`:
1. Read the order's current status before updating.
2. Update status as today.
3. If old status ≠ `paid` and new status = `paid` (i.e. this update is what makes it
   paid): fetch order_items joined to `games.name, games.download_url`, fetch the
   buyer's `profiles.whatsapp_number`, fetch `store_settings.wa_group_link`, build the
   message, call `sendWhatsAppMessage`. On success set `wa_sent_at = now()`,
   `wa_send_error = null`. On failure set `wa_send_error` to the returned error and
   leave `wa_sent_at` as-is. **The status update itself is never blocked or rolled
   back by a WhatsApp send failure.**

**Manual resend** — new action `resendGameLinks(orderId)`, usable from the admin order
detail page whenever status is `paid`:
- Reject (no-op, surface a message) if `wa_sent_at` is less than 60 seconds ago —
  cooldown to prevent spam-clicking from hammering the Fonnte API or re-messaging the
  customer repeatedly.
- Otherwise repeats the same compose-and-send logic as above.

Admin order detail page (`pesanan/[id]/page.tsx`) gains:
- A status indicator: "Link terkirim {relative time}" / "Belum terkirim: {error}" /
  nothing (not yet paid).
- A "Kirim Ulang Link" button, visible only when status is `paid`.

## 9. Storefront Reveal

- Replace `(storefront)/cek-pesanan/` (manual order-number lookup) with
  `(storefront)/pesanan/page.tsx` — lists the logged-in user's own orders, newest
  first, via the existing RLS (`orders_owner_read` filters to `auth.uid()`
  automatically — no manual number entry, no admin-only exposure risk).
- Order detail view (`(storefront)/pesanan/[id]/page.tsx`) shows status (reusing the
  existing step indicator) and:
  - If not yet `paid`: a locked placeholder — "Link download muncul otomatis di sini
    & dikirim ke WhatsApp begitu pembayaran dikonfirmasi LUNAS."
  - If `paid`: one row per game — name + "Download ↗" — pulling `download_url` live
    from `games` via the order's items (same live-lookup rule as the WA message, so
    the two channels never disagree). A small note: "Link yang sama juga udah dikirim
    ke WhatsApp kamu."
- Navbar gains a "Pesanan Saya" link, shown only when logged in.
- `cek-pesanan/search-form.tsx` and the old page are deleted.

## 10. Risks / Open Notes

- **Existing data**: this design assumes there is no real production order data yet
  (the web app's own `.env.local` still points at a placeholder Supabase project). If
  real guest orders already exist in a live database, removing guest checkout makes
  those specific orders permanently unreadable by their original buyers (same RLS gap
  as today, just now permanent since there's no login path to retroactively attach
  them to). Confirm before applying this to a database with real historical orders.
- **External setup required from the user, outside this codebase**: Google OAuth
  client + enabling the provider in Supabase Auth; Fonnte account signup, WhatsApp
  device pairing, and API token. The feature will not function end-to-end until both
  are done, independent of how correct the code is.
- **Rate limiting** covers `create_order` (5 / 10 min / user) and the resend button
  (60s cooldown). It does not and cannot protect against network-level DDoS — that's
  a hosting-platform concern.

## 11. Suggested Implementation Phasing

Large enough to land in two reviewable chunks:
- **Phase 1** — Auth migration: Google login, remove guest checkout/`/daftar`,
  `lengkapi-profil` flow, `create_order` changes (params + rate limit + grant), replace
  `/cek-pesanan` with `/pesanan`. Fully testable on its own (order flow works, no
  links/WA yet).
- **Phase 2** — Delivery: `games.download_url` + admin field, `store_settings`
  additions, Fonnte module, send-on-paid trigger + resend action + admin UI, storefront
  link reveal, the `download_url` column-leak audit from Section 7.
