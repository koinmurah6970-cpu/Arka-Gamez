"""
Populates original_price for all games in Supabase:
  - Matched to Steam by name → uses Steam's IDR price
  - Unmatched → random price (150k–500k)

Setup:
    pip install -r scripts/requirements.txt
    set SUPABASE_URL=...               (or use web/.env.local)
    set SUPABASE_SERVICE_ROLE_KEY=...

Usage:
    python scripts/populate_steam_prices.py
"""

import json
import os
import re
import time
import random
import unicodedata
from pathlib import Path

import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("web/.env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
STEAM_CACHE = Path("scripts/steam_apps_cache.json")

RANDOM_PRICES = [150_000, 200_000, 250_000, 300_000, 350_000, 400_000, 450_000, 500_000]
MATCH_THRESHOLD = 0.72

STOP_WORDS = {"the", "a", "an", "of", "in", "and", "or", "for", "to", "at", "on"}


# ── helpers ─────────────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = re.sub(r"[^\w\s]", " ", name.lower())
    return re.sub(r"\s+", " ", name).strip()


def significant_words(name: str) -> set[str]:
    return {w for w in normalize(name).split() if len(w) > 2 and w not in STOP_WORDS}


def jaccard(a: str, b: str) -> float:
    wa, wb = significant_words(a), significant_words(b)
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


# ── Steam app list ───────────────────────────────────────────────────────────

def load_steam_apps() -> tuple[list[dict], dict[str, list[int]]]:
    """Returns (apps_list, word_inverted_index)."""
    if STEAM_CACHE.exists():
        print("Loading cached Steam app list...")
        with open(STEAM_CACHE, encoding="utf-8") as f:
            apps = json.load(f)
    else:
        print("Downloading Steam app list (~5 MB, one-time)...")
        resp = requests.get(
            "https://api.steampowered.com/ISteamApps/GetAppList/v2/", timeout=60
        )
        resp.raise_for_status()
        apps = resp.json()["applist"]["apps"]
        # filter out empty names
        apps = [a for a in apps if a.get("name", "").strip()]
        with open(STEAM_CACHE, "w", encoding="utf-8") as f:
            json.dump(apps, f)
        print(f"Cached {len(apps):,} apps")

    # Build inverted index: word → [index positions in apps list]
    print("Building word index...")
    word_index: dict[str, list[int]] = {}
    for i, app in enumerate(apps):
        for word in significant_words(app["name"]):
            word_index.setdefault(word, []).append(i)

    return apps, word_index


def find_best_match(
    game_name: str, apps: list[dict], word_index: dict[str, list[int]]
) -> tuple[int | None, str, float]:
    """Returns (appid, steam_name, score)."""
    norm = normalize(game_name)

    # Candidate pool: apps that share at least one significant word
    q_words = significant_words(game_name)
    candidate_indices: set[int] = set()
    for word in q_words:
        for idx in word_index.get(word, []):
            candidate_indices.add(idx)

    best_score = MATCH_THRESHOLD
    best_appid = None
    best_name = ""

    for idx in candidate_indices:
        app = apps[idx]
        candidate_norm = normalize(app["name"])

        # Exact normalized match
        if candidate_norm == norm:
            return app["appid"], app["name"], 1.0

        score = jaccard(game_name, app["name"])
        # Boost if one is a prefix of the other
        if norm.startswith(candidate_norm) or candidate_norm.startswith(norm):
            score = min(score + 0.15, 1.0)

        if score > best_score:
            best_score = score
            best_appid = app["appid"]
            best_name = app["name"]

    return best_appid, best_name, best_score


# ── Steam price ──────────────────────────────────────────────────────────────

def get_steam_price_idr(appid: int) -> int | None:
    """Returns original price in full IDR, or None."""
    try:
        url = (
            f"https://store.steampowered.com/api/appdetails"
            f"?appids={appid}&cc=id&filters=price_overview"
        )
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        app_data = data.get(str(appid), {})
        if not app_data.get("success"):
            return None
        game_data = app_data.get("data") or {}
        po = game_data.get("price_overview")
        if not po:
            return None  # free game

        # Use initial_formatted → strip non-digits
        formatted = po.get("initial_formatted", "")
        digits = re.sub(r"\D", "", formatted)
        if digits:
            price = int(digits)
            # Steam sometimes returns IDR in cents (divide by 100 if > 10M)
            if price > 10_000_000:
                price = price // 100
            return price if price >= 15_000 else None

        # Fallback: initial field
        initial = po.get("initial", 0)
        if initial > 10_000_000:
            initial = initial // 100
        return initial if initial >= 15_000 else None

    except Exception as e:
        print(f" [err: {e}]", end="")
        return None


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Fetching games from Supabase...")
    result = supabase.table("games").select("id, name").execute()
    games = result.data
    print(f"  {len(games)} games found\n")

    apps, word_index = load_steam_apps()
    print(f"  Word index: {len(word_index):,} unique words\n")

    # ── Phase 1: match names ─────────────────────────────────────────────────
    print("=" * 60)
    print("Phase 1: Fuzzy matching names to Steam")
    print("=" * 60)

    matched: list[dict] = []
    unmatched: list[dict] = []

    for game in games:
        appid, steam_name, score = find_best_match(game["name"], apps, word_index)
        if appid:
            matched.append({**game, "steam_appid": appid, "steam_name": steam_name, "score": score})
            print(f"  ✓ {game['name'][:38]:<38} → {steam_name[:35]} ({score:.2f})")
        else:
            unmatched.append(game)

    print(f"\nMatched: {len(matched)} | Unmatched: {len(unmatched)}")

    # ── Phase 2: fetch Steam prices ──────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Phase 2: Fetching Steam IDR prices (1.2 s/req)")
    print("=" * 60)

    updates: list[dict] = []

    for i, game in enumerate(matched):
        print(f"  [{i+1:>4}/{len(matched)}] {game['name'][:45]:<45}", end="", flush=True)
        price = get_steam_price_idr(game["steam_appid"])
        if price and price > 10_000:
            updates.append({"id": game["id"], "original_price": price})
            print(f" Rp {price:>10,}")
        else:
            rp = random.choice(RANDOM_PRICES)
            updates.append({"id": game["id"], "original_price": rp})
            print(f" Steam N/A → random Rp {rp:,}")
        time.sleep(1.2)

    for game in unmatched:
        updates.append({"id": game["id"], "original_price": random.choice(RANDOM_PRICES)})

    # ── Phase 3: bulk update Supabase ────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"Phase 3: Updating {len(updates)} games in Supabase")
    print("=" * 60)

    BATCH = 50
    for i in range(0, len(updates), BATCH):
        batch = updates[i : i + BATCH]
        for item in batch:
            supabase.table("games").update(
                {"original_price": item["original_price"]}
            ).eq("id", item["id"]).execute()
        done = min(i + BATCH, len(updates))
        print(f"  {done}/{len(updates)} updated")

    # ── Summary ──────────────────────────────────────────────────────────────
    steam_count = sum(1 for u in updates if u["original_price"] not in RANDOM_PRICES)
    random_count = len(updates) - steam_count
    print("\n✓ Done!")
    print(f"  Steam prices used : {steam_count}")
    print(f"  Random prices used: {random_count}")


if __name__ == "__main__":
    main()
