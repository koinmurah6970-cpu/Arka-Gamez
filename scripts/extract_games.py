"""
Extract the raw game list embedded in one or more legacy JS sources (the
`rawCSV` / `csvData` template literals) into a single clean, deduplicated
CSV that the rest of the pipeline (fetch_covers.py -> upload_to_supabase.py)
consumes.

Supports merging multiple sources (e.g. the old index (1).html plus a
newer data_game.js export) -- later sources win on conflicting size/category
data, and `[NEW GAME]` tags from any source mark a title as `is_new`.

Usage:
    python scripts/extract_games.py
    python scripts/extract_games.py "index (1).html" "data/data_game_raw.js"

Output: ../data/games_raw.csv  (name,size,category,slug,is_new)
"""
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCES = [ROOT / "index (1).html", ROOT / "data" / "data_game_raw.js"]
DEFAULT_OUT = ROOT / "data" / "games_raw.csv"

VAR_PATTERNS = [r"const rawCSV = `(.*?)`;", r"const csvData = `(.*?)`;"]
NEW_GAME_PREFIX = re.compile(r"^\[NEW GAME\]\s*", re.IGNORECASE)
HYPERVISOR_SUFFIX = re.compile(r"\s*-?\s*Hypervisor\s*$", re.IGNORECASE)
MARKER_ROW = re.compile(r"^-{2,}")  # e.g. "--- WAJIB PESAN DI LINK.YU ---"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s


def extract_raw_csv_block(text: str) -> str:
    for pattern in VAR_PATTERNS:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1)
    raise ValueError("Could not find a `const rawCSV/csvData = ...` block in source file")


def clean_name(raw_name: str):
    name = raw_name.strip()
    is_new = bool(NEW_GAME_PREFIX.match(name))
    name = NEW_GAME_PREFIX.sub("", name)
    name = HYPERVISOR_SUFFIX.sub("", name)
    return name.strip(), is_new


def parse_lines(block: str):
    """Mirrors the original client-side parsing logic: parts[0] = name,
    parts[2] = category (defaults to 'Berat' if missing). Size is kept as
    raw text since source data isn't fully normalized (some rows are
    missing the comma before the category, e.g. '74 GB Berat').
    """
    rows = []
    for raw_line in block.strip().split("\n"):
        line = raw_line.strip()
        if not line or MARKER_ROW.match(line):
            continue
        parts = line.split(",")
        name, is_new = clean_name(parts[0])
        if not name or name.lower() == "nama game":  # skip header rows like "NAMA GAME,SIZE,KETERANGAN"
            continue
        size = parts[1].strip() if len(parts) > 1 else ""
        category = parts[2].strip() if len(parts) > 2 else "Berat"
        rows.append({"name": name, "size": size, "category": category, "is_new": is_new})
    return rows


def merge_sources(all_rows: list):
    """Later sources override size/category on name collision; is_new is OR'd."""
    merged = {}
    duplicates = []
    for row in all_rows:
        key = row["name"].strip().lower()
        if key in merged:
            duplicates.append(row["name"])
            merged[key]["size"] = row["size"] or merged[key]["size"]
            merged[key]["category"] = row["category"] or merged[key]["category"]
            merged[key]["is_new"] = merged[key]["is_new"] or row["is_new"]
        else:
            merged[key] = dict(row)
    return list(merged.values()), duplicates


def main():
    source_paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else DEFAULT_SOURCES
    out_path = DEFAULT_OUT
    out_path.parent.mkdir(parents=True, exist_ok=True)

    all_rows = []
    for path in source_paths:
        if not path.exists():
            print(f"(lewati, file tidak ada: {path})")
            continue
        text = path.read_text(encoding="utf-8")
        block = extract_raw_csv_block(text)
        rows = parse_lines(block)
        print(f"{path.name}: {len(rows)} baris")
        all_rows.extend(rows)

    unique_rows, duplicates = merge_sources(all_rows)
    unique_rows.sort(key=lambda r: r["name"].lower())

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "size", "category", "slug", "is_new"])
        for row in unique_rows:
            writer.writerow([row["name"], row["size"], row["category"],
                              slugify(row["name"]), "true" if row["is_new"] else "false"])

    new_count = sum(1 for r in unique_rows if r["is_new"])
    print(f"\nTotal baris mentah (semua sumber) : {len(all_rows)}")
    print(f"Total game unik setelah merge     : {len(unique_rows)}")
    print(f"Ditandai [NEW GAME]               : {new_count}")
    print(f"Duplikat/overlap antar sumber     : {len(duplicates)}")
    print(f"Output                            : {out_path}")


if __name__ == "__main__":
    main()
