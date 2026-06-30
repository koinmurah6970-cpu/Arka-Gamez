"""
Cover-art ETL pipeline (runs locally, NOT in the browser).

For every game in data/games_raw.csv:
  1. Try SteamGridDB (curated cover art, best match quality) -> portrait grid
  2. Fallback to RAWG (broader coverage, incl. non-Steam titles)
  3. Fallback to a local placeholder if nothing is found
Every image is downloaded once, center-cropped/fit to a fixed 3:4 ratio
(matching the storefront's `.cover-container { aspect-ratio: 3/4 }`), and
re-encoded to WebP so every card in the grid looks visually consistent
regardless of the source image's native aspect ratio.

Idempotent: re-running the script skips games that were already
successfully processed (tracked in data/covers_progress.json), so you can
safely Ctrl+C and resume, or re-run later when new games are added to
games_raw.csv.

Setup:
    pip install -r scripts/requirements.txt
    set STEAMGRIDDB_API_KEY=...   (get one free at steamgriddb.com/profile/preferences/api)
    set RAWG_API_KEY=...          (get one free at rawg.io/apidocs)

Usage:
    python scripts/fetch_covers.py                # process everything not yet done
    python scripts/fetch_covers.py --limit 20      # test run on first 20 games
    python scripts/fetch_covers.py --retry-errors  # only reprocess failed/placeholder rows
    python scripts/fetch_covers.py --delay 1.0     # slower, gentler on the APIs
"""
import argparse
import csv
import json
import os
import time
from io import BytesIO
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
COVERS_DIR = DATA_DIR / "covers"
INPUT_CSV = DATA_DIR / "games_raw.csv"
PROGRESS_FILE = DATA_DIR / "covers_progress.json"
OUTPUT_CSV = DATA_DIR / "games_import.csv"
QC_CSV = DATA_DIR / "qc_report.csv"
PLACEHOLDER_SRC = ROOT / "scripts" / "assets" / "placeholder.webp"

STEAMGRIDDB_API_KEY = os.environ.get("STEAMGRIDDB_API_KEY", "")
RAWG_API_KEY = os.environ.get("RAWG_API_KEY", "")

TARGET_SIZE = (600, 800)  # 3:4 portrait, matches the storefront CSS aspect-ratio
USER_AGENT = "ArkaGamez-CatalogBot/1.0 (+catalog data pipeline; contact: admin)"
CHECKPOINT_EVERY = 25

session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT})


def request_with_retry(method, url, max_retries=3, backoff=1.6, **kwargs):
    kwargs.setdefault("timeout", 10)
    last_exc = None
    for attempt in range(max_retries):
        try:
            resp = session.request(method, url, **kwargs)
            if resp.status_code == 429:
                time.sleep(backoff ** (attempt + 2))
                continue
            if resp.status_code >= 500:
                time.sleep(backoff ** (attempt + 1))
                continue
            return resp
        except requests.RequestException as e:
            last_exc = e
            time.sleep(backoff ** (attempt + 1))
    if last_exc:
        raise last_exc
    return resp


def steamgriddb_find_cover(name: str):
    if not STEAMGRIDDB_API_KEY:
        return None
    headers = {"Authorization": f"Bearer {STEAMGRIDDB_API_KEY}"}
    search_url = f"https://www.steamgriddb.com/api/v2/search/autocomplete/{quote(name)}"
    resp = request_with_retry("GET", search_url, headers=headers)
    if resp.status_code != 200:
        return None
    data = resp.json()
    if not data.get("success") or not data.get("data"):
        return None
    game_id = data["data"][0]["id"]

    grid_url = (
        f"https://www.steamgriddb.com/api/v2/grids/game/{game_id}"
        "?dimensions=600x900&types=static"
    )
    resp = request_with_retry("GET", grid_url, headers=headers)
    if resp.status_code != 200:
        return None
    grids = resp.json()
    if not grids.get("success") or not grids.get("data"):
        return None
    best = max(grids["data"], key=lambda g: g.get("score", 0))
    return {"image_url": best["url"], "steamgriddb_id": game_id}


def rawg_find_cover(name: str):
    if not RAWG_API_KEY:
        return None
    resp = request_with_retry(
        "GET",
        "https://api.rawg.io/api/games",
        params={"key": RAWG_API_KEY, "search": name, "page_size": 1},
    )
    if resp.status_code != 200:
        return None
    results = (resp.json() or {}).get("results") or []
    if not results or not results[0].get("background_image"):
        return None
    return {"image_url": results[0]["background_image"], "rawg_id": results[0].get("id")}


def normalize_to_webp(image_bytes: bytes, out_path: Path):
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    # bias crop slightly toward the top third: most box-art/key-art keeps
    # character faces and logos there, so a plain center crop tends to
    # decapitate portraits on wide source images.
    fitted = ImageOps.fit(img, TARGET_SIZE, Image.LANCZOS, centering=(0.5, 0.3))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fitted.save(out_path, "WEBP", quality=85, method=6)


def use_placeholder(name: str, slug: str) -> Path:
    out_path = COVERS_DIR / f"{slug}.webp"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if PLACEHOLDER_SRC.exists():
        out_path.write_bytes(PLACEHOLDER_SRC.read_bytes())
        return out_path
    # no static asset provided: generate a simple flat placeholder so the
    # pipeline never produces a broken <img> while waiting for QC review.
    img = Image.new("RGB", TARGET_SIZE, color=(31, 41, 55))
    draw = ImageDraw.Draw(img)
    label = "NO COVER\n" + name[:28]
    draw.multiline_text((24, TARGET_SIZE[1] // 2 - 20), label, fill=(156, 163, 175), spacing=6)
    img.save(out_path, "WEBP", quality=85)
    return out_path


def process_game(row: dict) -> dict:
    name, slug = row["name"], row["slug"]
    result = {
        "name": name, "slug": slug, "size": row["size"], "category": row["category"],
        "is_new": row.get("is_new", "false"),
        "cover_source": None, "source_id": None, "confidence": "none",
        "cover_path": None, "error": None,
    }
    try:
        found = steamgriddb_find_cover(name)
        source = "steamgriddb"
        confidence = "high"
        if not found:
            found = rawg_find_cover(name)
            source = "rawg"
            confidence = "medium"

        if found:
            img_resp = request_with_retry("GET", found["image_url"])
            img_resp.raise_for_status()
            out_path = COVERS_DIR / f"{slug}.webp"
            normalize_to_webp(img_resp.content, out_path)
            result.update(
                cover_source=source,
                source_id=found.get("steamgriddb_id") or found.get("rawg_id"),
                confidence=confidence,
                cover_path=str(out_path.relative_to(ROOT)).replace("\\", "/"),
            )
            return result

        out_path = use_placeholder(name, slug)
        result.update(
            cover_source="placeholder",
            confidence="none",
            cover_path=str(out_path.relative_to(ROOT)).replace("\\", "/"),
        )
        return result
    except Exception as e:
        result["cover_source"] = "error"
        result["error"] = str(e)
        return result


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    return {}


def save_progress(progress: dict):
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8")


def write_outputs(progress: dict, ordered_slugs: list):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fields = ["name", "slug", "size", "category", "is_new", "cover_source", "source_id",
              "confidence", "cover_path", "error"]

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for slug in ordered_slugs:
            if slug in progress:
                writer.writerow(progress[slug])

    qc_rows = [progress[s] for s in ordered_slugs
               if s in progress and progress[s]["confidence"] in ("none", "low")
               or s in progress and progress[s]["cover_source"] == "error"]
    with QC_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(qc_rows)

    print(f"\nOutput katalog : {OUTPUT_CSV}")
    print(f"QC report      : {QC_CSV} ({len(qc_rows)} game butuh review manual)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="batasi jumlah game diproses (buat testing)")
    parser.add_argument("--delay", type=float, default=0.4, help="jeda detik antar game")
    parser.add_argument("--retry-errors", action="store_true", help="cuma proses ulang yang error/placeholder")
    args = parser.parse_args()

    if not STEAMGRIDDB_API_KEY and not RAWG_API_KEY:
        print("PERINGATAN: STEAMGRIDDB_API_KEY dan RAWG_API_KEY dua-duanya kosong.")
        print("Semua game bakal jatuh ke placeholder. Set minimal salah satu env var dulu.\n")

    with INPUT_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if args.limit:
        rows = rows[: args.limit]

    progress = load_progress()
    ordered_slugs = [r["slug"] for r in rows]
    total = len(rows)
    done_this_run = 0

    try:
        for i, row in enumerate(rows, 1):
            slug = row["slug"]
            existing = progress.get(slug)
            already_ok = existing and existing.get("cover_source") not in (None, "error")
            if already_ok and not (args.retry_errors and existing.get("cover_source") in ("error", "placeholder")):
                continue

            result = process_game(row)
            progress[slug] = result
            done_this_run += 1
            print(f"[{i}/{total}] {row['name']} -> {result['cover_source']} ({result['confidence']})")

            if done_this_run % CHECKPOINT_EVERY == 0:
                save_progress(progress)
            time.sleep(args.delay)
    except KeyboardInterrupt:
        print("\nDihentikan manual, nyimpen progress dulu...")
    finally:
        save_progress(progress)
        write_outputs(progress, ordered_slugs)


if __name__ == "__main__":
    main()
