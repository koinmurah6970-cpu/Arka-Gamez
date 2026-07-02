"""
Populates original_price for all games in Supabase using Steam Store Search API.
- Matches each game by name via storesearch
- Uses Steam's IDR price as original_price
- Falls back to random price for unmatched/free games

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/populate_steam_prices.py
"""

import os
import re
import time
import random
import unicodedata
from pathlib import Path

import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("web/.env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

RANDOM_PRICES = [100_000, 150_000, 200_000, 250_000, 300_000, 350_000, 400_000, 450_000, 500_000]
MATCH_THRESHOLD = 0.65
STOP_WORDS = {"the", "a", "an", "of", "in", "and", "or", "for", "to", "at", "on"}


# ── helpers ──────────────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = re.sub(r"[^\w\s]", " ", name.lower())
    return re.sub(r"\s+", " ", name).strip()


def sig_words(name: str) -> set[str]:
    return {w for w in normalize(name).split() if len(w) > 2 and w not in STOP_WORDS}


def jaccard(a: str, b: str) -> float:
    wa, wb = sig_words(a), sig_words(b)
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


# ── Steam search ──────────────────────────────────────────────────────────────

def search_steam(game_name: str) -> tuple[int | None, int | None]:
    """
    Returns (appid, price_idr) or (None, None).
    price_idr is already in full Rupiah (initial / 100).
    """
    try:
        url = (
            "https://store.steampowered.com/api/storesearch/"
            f"?term={requests.utils.quote(game_name)}&cc=id&l=english"
        )
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            return None, None

        # Pick best match by Jaccard similarity
        best_score = MATCH_THRESHOLD
        best_item = None
        for item in items[:5]:  # only check top 5 results
            score = jaccard(game_name, item.get("name", ""))
            # Exact normalized match wins immediately
            if normalize(item.get("name", "")) == normalize(game_name):
                best_item = item
                break
            if score > best_score:
                best_score = score
                best_item = item

        if not best_item:
            return None, None

        appid = best_item.get("id")
        price_data = best_item.get("price")
        if not price_data:
            return appid, None  # free game

        initial = price_data.get("initial", 0)
        # Steam stores IDR in cents (divide by 100)
        price_idr = initial // 100 if initial else None
        if price_idr and price_idr <= 10_000:
            price_idr = None  # unusably low, treat as no price

        return appid, price_idr

    except Exception as e:
        print(f" [err: {e}]", end="")
        return None, None


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Fetching games from Supabase...")
    result = supabase.table("games").select("id, name").execute()
    games = result.data
    total = len(games)
    print(f"  {total} games found\n")

    updates: list[dict] = []
    steam_hit = 0
    no_price = 0
    no_match = 0

    print(f"{'#':>5}  {'Game':<45}  {'Steam match / price':>30}")
    print("-" * 90)

    for i, game in enumerate(games, 1):
        print(f"{i:>5}  {game['name'][:45]:<45}", end="", flush=True)

        appid, price = search_steam(game["name"])

        if price:
            updates.append({"id": game["id"], "original_price": price})
            print(f"  Rp {price:>12,}")
            steam_hit += 1
        else:
            rp = random.choice(RANDOM_PRICES)
            updates.append({"id": game["id"], "original_price": rp})
            reason = "no match" if appid is None else "free/no price"
            print(f"  {reason:<15} → random Rp {rp:,}")
            if appid is None:
                no_match += 1
            else:
                no_price += 1

        time.sleep(0.3)

    # ── bulk update Supabase ─────────────────────────────────────────────────
    print(f"\nUpdating {len(updates)} games in Supabase...")
    BATCH = 50
    for i in range(0, len(updates), BATCH):
        batch = updates[i : i + BATCH]
        for item in batch:
            supabase.table("games").update(
                {"original_price": item["original_price"]}
            ).eq("id", item["id"]).execute()
        done = min(i + BATCH, len(updates))
        print(f"  {done}/{len(updates)}")

    print("\n✓ Done!")
    print(f"  Steam prices  : {steam_hit}")
    print(f"  Free/no price : {no_price}")
    print(f"  No match      : {no_match}")


if __name__ == "__main__":
    main()
