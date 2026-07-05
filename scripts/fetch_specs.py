"""
Fetch PC system requirements for every game in the catalog.

Pipeline per game:
  1. Search PCGamingWiki → get page title
  2. Query Infobox_game Cargo table → get Steam AppID
  3. Call Steam Store API → get pc_requirements HTML
  4. Parse HTML → extract RAM (GB), map CPU/GPU to tier 1-4
  5. PATCH Supabase games table (min_ram_gb, min_cpu_tier, min_gpu_tier)

Tier scale:
  1 = Low-End   (Integrated / Celeron / Dual-Core)
  2 = Mid-Range (GTX 1050 class / Core i3-i5 old)
  3 = Upper-Mid (GTX 1060 class / Core i5-i7 new)
  4 = High-End  (RTX 3060+ / Core i7+ new)

Usage:
    python scripts/fetch_specs.py                  # all games without specs
    python scripts/fetch_specs.py --limit 20       # test run
    python scripts/fetch_specs.py --retry-all      # overwrite existing
    python scripts/fetch_specs.py --slug elden-ring # single game
"""
import argparse
import os
import re
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PCGW_API     = "https://www.pcgamingwiki.com/w/api.php"
STEAM_API    = "https://store.steampowered.com/api/appdetails"

sb_headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

session = requests.Session()
session.headers["User-Agent"] = "ArkaGamez-SpecBot/1.0"


# ── Tier classification ────────────────────────────────────────────────────────

GPU_TIERS = [
    # (tier, pattern)
    (4, r"rtx [34][0-9]{3}|rtx 20[78]0|rx 6[7-9]00|rx 7[0-9]{3}|arc [ab]7[0-9]{2}"),
    (3, r"rtx 3050|rtx 2060|gtx 1060|gtx 970|gtx 980|rx 5[567]00|rx 580|rx 480|rx 6600|arc a[345][0-9]{2}"),
    (2, r"gtx 1050|gtx 1030|gtx 750|gtx [89][56]0|gtx 660|gtx 670|gtx 680|rx [45][67]0|rx 560|rx 460"),
    (1, r"intel hd|intel uhd|intel iris|integrated|vega [2-8]|vega3|vega8|radeon r[2-5] |gt [1-7][0-9]{2}[^0-9]"),
]

CPU_TIERS = [
    (4, r"i[79]-\d{4,}[hkx]?|ryzen [79]\s|ryzen 9|i9[-\s]|i7-[89]\d{3}|i7-1[0-9]\d{3}"),
    (3, r"i[57]-[89]\d{3}|i[57]-1[0-9]\d{3}|i7-[67]\d{3}|ryzen 5|i5-[89]\d{3}|i5-1[0-9]"),
    (2, r"i[35]-\d{4}|ryzen 3|athlon|i3|i5-[234567]\d{3}"),
    (1, r"dual.?core|celeron|pentium|atom|core 2|core2"),
]


def classify(text: str, tiers: list[tuple[int, str]], default: int | None = None) -> int | None:
    t = text.lower()
    for tier, pattern in tiers:
        if re.search(pattern, t):
            return tier
    # Text exists but no pattern matched → use default
    return default if text.strip() else None


def parse_ram(html: str) -> int | None:
    m = re.search(r"(\d+)\s*GB\s*RAM|Memory[^<]*?(\d+)\s*GB", html, re.I)
    if m:
        return int(next(g for g in m.groups() if g))
    return None


def parse_requirements(html: str) -> tuple[int | None, int | None, int | None]:
    """Return (ram_gb, cpu_tier, gpu_tier) from Steam pc_requirements HTML."""
    # Extract processor and graphics lines
    cpu_match = re.search(r"Processor[^<]*?</strong>\s*(.*?)<br", html, re.I)
    gpu_match = re.search(r"Graphics[^<]*?</strong>\s*(.*?)<br", html, re.I)
    cpu_text  = re.sub("<[^>]+>", "", cpu_match.group(1)) if cpu_match else ""
    gpu_text  = re.sub("<[^>]+>", "", gpu_match.group(1)) if gpu_match else ""

    ram  = parse_ram(html)
    cpu  = classify(cpu_text, CPU_TIERS, default=2)
    gpu  = classify(gpu_text, GPU_TIERS, default=2)
    return ram, cpu, gpu


# ── API helpers ────────────────────────────────────────────────────────────────

def clean_name(name: str) -> str:
    return re.sub(r"[™®©]", "", name).strip()


def name_similarity(a: str, b: str) -> float:
    """Simple word-overlap similarity ratio."""
    wa = set(re.sub(r"[^a-z0-9]", " ", a.lower()).split())
    wb = set(re.sub(r"[^a-z0-9]", " ", b.lower()).split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / max(len(wa), len(wb))


def pcgw_search(name: str) -> str | None:
    for attempt in range(3):
        try:
            r = session.get(PCGW_API, params={
                "action": "query", "list": "search",
                "srsearch": clean_name(name), "srnamespace": 0,
                "srlimit": 1, "format": "json",
            }, timeout=15)
            if r.status_code == 429 or not r.text.strip():
                time.sleep(2 ** attempt)
                continue
            results = r.json().get("query", {}).get("search", [])
            if not results:
                return None
            title = results[0]["title"]
            # Reject poor matches (e.g. "Dying Light" → "Dying Light 2")
            if name_similarity(clean_name(name), title) < 0.5:
                return None
            return title
        except Exception:
            time.sleep(2 ** attempt)
    return None


def steam_search_appid(name: str) -> str | None:
    """Search Steam Store directly by game name — fallback when PCGW fails."""
    for attempt in range(2):
        try:
            r = session.get(
                "https://store.steampowered.com/api/storesearch/",
                params={"term": clean_name(name), "l": "english", "cc": "us"},
                timeout=10,
            )
            if not r.text.strip():
                return None
            items = r.json().get("items", [])
            if not items:
                return None
            # Pick best name match
            best = max(items, key=lambda x: name_similarity(clean_name(name), x.get("name", "")))
            if name_similarity(clean_name(name), best.get("name", "")) < 0.5:
                return None
            return str(best["id"])
        except Exception:
            time.sleep(2 ** attempt)
    return None


def pcgw_steam_id(page_title: str) -> str | None:
    for attempt in range(3):
        try:
            r = session.get(PCGW_API, params={
                "action": "cargoquery", "tables": "Infobox_game",
                "fields": "Steam_AppID",
                "where": f'Infobox_game._pageName="{page_title}"',
                "format": "json",
            }, timeout=15)
            if r.status_code == 429 or not r.text.strip():
                time.sleep(2 ** attempt)
                continue
            items = r.json().get("cargoquery", [])
            if not items:
                return None
            raw = items[0]["title"].get("Steam AppID", "")
            return raw.split(",")[0].strip() if raw else None
        except Exception:
            time.sleep(2 ** attempt)
    return None


def steam_requirements(app_id: str) -> tuple[int | None, int | None, int | None]:
    r = session.get(STEAM_API, params={
        "appids": app_id, "l": "english",
    }, timeout=15)
    data = r.json().get(str(app_id), {})
    if not data.get("success"):
        return None, None, None
    req = data.get("data", {})
    if isinstance(req, list):
        return None, None, None
    minimum = req.get("pc_requirements", {})
    if isinstance(minimum, list):
        return None, None, None
    html = minimum.get("minimum", "")
    return parse_requirements(html)


def patch_game(slug: str, ram: int | None, cpu: int | None, gpu: int | None):
    payload = {}
    if ram is not None: payload["min_ram_gb"]   = ram
    if cpu is not None: payload["min_cpu_tier"] = cpu
    if gpu is not None: payload["min_gpu_tier"] = gpu
    if not payload:
        return
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/games",
        headers=sb_headers,
        params={"slug": f"eq.{slug}"},
        json=payload,
        timeout=30,
    )


# ── Main ───────────────────────────────────────────────────────────────────────

def fetch_all_games(only_missing: bool = True, slug_filter: str | None = None) -> list[dict]:
    params = {"select": "slug,name,min_ram_gb", "status": "eq.active", "limit": 2000}
    if slug_filter:
        params["slug"] = f"eq.{slug_filter}"
    elif only_missing:
        params["min_ram_gb"] = "is.null"
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/games",
        headers={**sb_headers, "Prefer": ""},
        params=params,
        timeout=15,
    )
    return r.json()


def process(game: dict, verbose: bool = True) -> str:
    name = game["name"]
    slug = game["slug"]

    app_id = None

    # Path A: PCGamingWiki → Steam AppID
    page = pcgw_search(name)
    if page:
        app_id = pcgw_steam_id(page)

    # Path B: Steam Store search directly (fallback)
    if not app_id:
        app_id = steam_search_appid(name)
        if app_id and verbose:
            print(f"    (via Steam search fallback)")

    if not app_id:
        return "no-steam-id"

    try:
        ram, cpu, gpu = steam_requirements(app_id)
    except Exception as e:
        return f"steam-error: {e}"

    if not any([ram, cpu, gpu]):
        return "no-data"

    patch_game(slug, ram, cpu, gpu)
    if verbose:
        print(f"    → RAM {ram}GB | CPU tier {cpu} | GPU tier {gpu}")
    return "ok"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--limit",     type=int,  default=None)
    p.add_argument("--retry-all", action="store_true", help="overwrite existing specs")
    p.add_argument("--slug",      default=None, help="process a single game by slug")
    p.add_argument("--delay",     type=float, default=0.6)
    args = p.parse_args()

    games = fetch_all_games(only_missing=not args.retry_all, slug_filter=args.slug)
    if args.limit:
        games = games[: args.limit]

    total   = len(games)
    ok      = 0
    skipped = 0

    print(f"Processing {total} games...\n")

    for i, game in enumerate(games, 1):
        print(f"[{i}/{total}] {game['name']}")
        try:
            status = process(game)
        except Exception as e:
            status = f"error: {e}"
        if status == "ok":
            ok += 1
        else:
            skipped += 1
            print(f"    skipped ({status})")
        time.sleep(args.delay)

    print(f"\nDone — {ok} updated, {skipped} skipped/failed out of {total}")


if __name__ == "__main__":
    main()
