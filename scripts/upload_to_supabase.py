"""
Loads data/games_import.csv (output of fetch_covers.py) into Supabase:
  1. Uploads each normalized cover (data/covers/<slug>.webp) to Storage
     bucket `game-covers`.
  2. Upserts the game row into the `games` table.

Safe to re-run as the catalog grows (idempotent on `slug`):
  - New slugs are inserted as status='draft' (review before publishing).
  - Existing slugs only get cover_url/cover_source/source_id/size_label/
    category refreshed -- price, description and status are admin-owned
    fields and are NEVER overwritten by this script. If an admin manually
    fixed a cover in the dashboard (cover_source='manual'), this script
    leaves that row's cover alone entirely.

Setup:
    pip install -r scripts/requirements.txt
    set SUPABASE_URL=...
    set SUPABASE_SERVICE_ROLE_KEY=...   (service_role, NOT anon -- local/CI only)

Usage:
    python scripts/upload_to_supabase.py              # import as drafts
    python scripts/upload_to_supabase.py --publish     # import as active
"""
import argparse
import csv
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
INPUT_CSV = ROOT / "data" / "games_import.csv"
FAILURES_CSV = ROOT / "data" / "upload_failures.csv"

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "game-covers")
BATCH_SIZE = 200


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise SystemExit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set (lihat .env.example)")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def load_category_map(supabase: Client) -> dict:
    rows = supabase.table("categories").select("id,name").execute().data
    return {r["name"].strip().lower(): r["id"] for r in rows}


def load_existing_games(supabase: Client) -> dict:
    existing = {}
    page = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("games")
            .select("id,slug,cover_source")
            .range(page * page_size, page * page_size + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            existing[row["slug"]] = row
        if len(resp.data) < page_size:
            break
        page += 1
    return existing


def upload_cover(supabase: Client, slug: str, local_path: Path) -> str:
    storage_path = f"{slug}.webp"
    with local_path.open("rb") as f:
        supabase.storage.from_(BUCKET).upload(
            storage_path,
            f.read(),
            {"content-type": "image/webp", "upsert": "true"},
        )
    return supabase.storage.from_(BUCKET).get_public_url(storage_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--publish", action="store_true", help="set status='active' on insert (default: 'draft')")
    parser.add_argument("--skip-upload", action="store_true", help="skip Storage upload, only upsert DB rows (covers already uploaded)")
    args = parser.parse_args()

    supabase = get_client()
    category_map = load_category_map(supabase)
    existing_games = load_existing_games(supabase)

    with INPUT_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    to_insert, to_update, skipped, failures = [], [], [], []
    started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    for row in rows:
        slug = row["slug"]
        cat_id = category_map.get(row["category"].strip().lower())
        if cat_id is None:
            cat_id = category_map.get("berat")  # safe default for unmatched/dirty category text

        existing = existing_games.get(slug)
        if existing and existing.get("cover_source") == "manual":
            skipped.append(slug)
            continue

        cover_url = None
        if not args.skip_upload and row["cover_path"]:
            local_path = ROOT / row["cover_path"]
            try:
                cover_url = upload_cover(supabase, slug, local_path)
            except Exception as e:
                failures.append({**row, "error": f"upload_failed: {e}"})
                continue

        if existing:
            to_update.append({
                "id": existing["id"],
                "size_label": row["size"],
                "category_id": cat_id,
                "is_new": str(row.get("is_new", "false")).lower() == "true",
                **({"cover_url": cover_url, "cover_source": row["cover_source"], "source_id": row["source_id"]} if cover_url else {}),
            })
        else:
            to_insert.append({
                "slug": slug,
                "name": row["name"],
                "size_label": row["size"],
                "category_id": cat_id,
                "is_new": str(row.get("is_new", "false")).lower() == "true",
                "cover_url": cover_url,
                "cover_source": row["cover_source"],
                "source_id": row["source_id"] or None,
                "status": "active" if args.publish else "draft",
            })

    for i in range(0, len(to_insert), BATCH_SIZE):
        chunk = to_insert[i:i + BATCH_SIZE]
        try:
            supabase.table("games").insert(chunk).execute()
        except Exception as e:
            failures.extend({**row, "error": f"insert_failed: {e}"} for row in chunk)

    for row in to_update:
        try:
            supabase.table("games").update(row).eq("id", row["id"]).execute()
        except Exception as e:
            failures.append({**row, "error": f"update_failed: {e}"})

    finished_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    supabase.table("import_jobs").insert({
        "source_file": str(INPUT_CSV.relative_to(ROOT)),
        "total_rows": len(rows),
        "success_count": len(to_insert) + len(to_update) - len(failures),
        "error_count": len(failures),
        "started_at": started_at,
        "finished_at": finished_at,
    }).execute()

    print(f"Insert baru     : {len(to_insert)}")
    print(f"Update existing : {len(to_update)}")
    print(f"Skip (manual)   : {len(skipped)}")
    print(f"Gagal           : {len(failures)}")

    if failures:
        with FAILURES_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(failures[0].keys()))
            writer.writeheader()
            writer.writerows(failures)
        print(f"Detail kegagalan: {FAILURES_CSV}")


if __name__ == "__main__":
    main()
