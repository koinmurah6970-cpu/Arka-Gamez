# Storefront Dark Theme Redesign — Design

Status: Approved by user 2026-07-01, ready for implementation planning.

## 1. Problem / Motivation

The storefront currently uses a flat, generic light theme (white background, default
Tailwind blue accent) that reads as a standard SaaS/corporate template rather than a
gaming storefront. Benchmarked against a competitor (mantagames.id), the direction
approved by the user (via visual mockups) is a dark, "premium gaming" look: neutral
near-black background (not tinted), sparse color accents, glassmorphic navbar, a
hero/bento promo section on the homepage, and glowing-border hover states on product
cards — with a light/dark **toggle**, not dark-only.

## 2. Scope

**In scope:**
- Light/dark theme toggle (user-controlled, persisted), applied to **all storefront
  pages**: homepage, game detail, cart, checkout, cek-pesanan, FAQ/Syarat &
  Ketentuan/Privasi (built in the prior SEO/footer pass), login/daftar.
- New hero/bento promo section on the homepage.
- Product card visual redesign (border glow + hover lift).
- Shimmer skeleton loaders replacing the current `animate-pulse` loading state.

**Out of scope:**
- Admin dashboard — stays as its current single dark theme, untouched.
- Any bundle/tiered-pricing product model (Premium/Standard bundles, Denuvo Access,
  etc.) seen on the reference site — that's a business-model decision, not a design
  one, and hasn't been discussed. This redesign reuses the reference's *visual
  language* only; the hero's content is built from Gamos's actual catalog (flat
  Rp20.000 per game), not bundles.
- Building the actual "Request Game" submission feature — that's a separate, later
  task. This redesign only adds a hero tile and a placeholder page for it (Section 6).

## 3. Theme Architecture

Tailwind v4, class-based dark mode (not OS-preference-only, since a manual toggle is
required):

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

Semantic CSS variables in `@theme`, defined once for light (`:root`) and overridden
under `.dark`, so components reference `bg-background`, `text-foreground`,
`bg-surface`, `border-subtle`, `text-accent`, etc. rather than hardcoded Tailwind
color names — this is what lets every component work in both themes without
duplicating classes. Needed tokens: `background`, `foreground` (primary text),
`muted` (secondary text), `surface` (card background), `border-subtle`, `accent`
(primary — indigo, replaces today's default `blue-600` everywhere for consistency),
plus dark-safe variants of the existing status colors already in use (`emerald` for
active/discount, `amber` for warning/draft, `red` for cancelled/error) so admin-style
badges reused on the storefront (e.g. discount tags) stay legible on a dark
background.

**Amber is reserved** for the hero promo tile's call-to-action only (the "featured
deal" gold-gradient button from the approved mockup) — it is not the site's general
accent, to avoid competing with indigo everywhere else.

**Toggle mechanics:**
- `components/theme-toggle.tsx` (client component): sun/moon icon button in the
  navbar. Toggles the `dark` class on `<html>` and writes the choice to
  `localStorage.theme` (`"light"` | `"dark"`).
- An inline `<script>` in `app/layout.tsx`'s `<head>`, before any rendered content,
  reads `localStorage.theme`; if unset, falls back to
  `window.matchMedia('(prefers-color-scheme: dark)')`. Applies the `dark` class
  synchronously so there's no flash of the wrong theme on load. This is the standard,
  well-established pattern for Tailwind dark-mode toggles — no new libraries needed.

## 4. Component Restyle

Applies the token system above; no visual behavior changes beyond what's listed:

- **Navbar** (`navbar-client.tsx`): `bg-background/60 backdrop-blur-xl`, subtle bottom
  border, adds the theme toggle button next to the cart icon.
- **Footer** (`footer.tsx`): matches surface/border tokens.
- **Product card** (`product-card.tsx` + `.cover-container`/related CSS): adds a
  subtle glowing border on hover and a lift, matching the reference's feel:
  `hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/10
  transition-all duration-300`. Cover ratio stays 3:4 (already correct, see prior
  session's fact-check).
- **Buttons/CTAs**: primary buttons move to the `accent` (indigo) token; the hero
  promo button only uses the amber gradient (Section 3).
- **Form inputs** (checkout, login/daftar, cek-pesanan search): swap hardcoded
  `bg-gray-50 border-gray-200` for the `surface`/`border-subtle` tokens so they're
  legible in both themes.
- **FAQ / Syarat & Ketentuan / Privasi**: same token swap, no content changes.

## 5. Homepage Hero / Bento Section

New component `components/storefront-hero.tsx`, rendered at the top of
`(storefront)/page.tsx`, above the existing "Jelajahi Koleksi" grid. Four tiles per
the approved mockup:

- **Featured deal** (large, 2-col span): the current `is_featured = true` active game
  with the deepest discount (`games.is_featured` already exists and is already
  admin-editable — "Tampilkan sebagai highlight/featured" checkbox on the edit game
  page). Copy: "Install simple, begitu selesai langsung extract dan play!" Amber
  gradient CTA → links to that game's detail page. If no game is currently featured,
  this tile is omitted (grid reflows to the remaining 3 tiles) rather than showing a
  placeholder.
- **"Baru Ditambahkan"**: count of active games created in the last 7 days, links to
  `/` (already sorted newest-first by default).
- **"Request Game"**: links to new placeholder page `app/(storefront)/request-game/page.tsx`
  — "Fitur request lagi disiapkan, sementara chat admin ya" + a WhatsApp link (reuses
  `getStoreSettings().waAdminNumber`, same pattern as the footer). When the real
  request-game feature (queued separately) is built later, only this link's
  destination changes.
- **"Produk Terlaris"**: top 5 games ranked by number of `order_items` referencing
  them (across all orders — a simple popularity signal; `games.view_count` exists in
  the schema but is never incremented anywhere in the code today, so it isn't a
  usable ranking signal). If the store has no orders yet (e.g. brand new), falls back
  to the 5 most recently created active games.

## 6. Loading State

`(storefront)/loading.tsx` currently uses `animate-pulse` gray blocks. Replace with a
shimmer effect: a CSS keyframe sweeping a lighter gradient band across each skeleton
block, defined once in `globals.css` using the `surface`/`border-subtle` tokens so it
looks correct in both themes.

## 7. Out-of-Scope Reminders (carried from user's own framing)

- No wallet/credits, wishlist, reseller program, or product tiering — those are
  business decisions, not part of this visual redesign.
- No changes to `/admin/*` — separate, already dark, not touched here.
