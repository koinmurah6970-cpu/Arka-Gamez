import os
import sys
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
RAWG_API_KEY = os.environ.get("RAWG_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not RAWG_API_KEY:
    print("Error: credentials missing in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 1. Fetch available genres from database to get mapping from slug to ID
res_genres = supabase.from_("genres").select("id, slug, name").execute()
db_genres = {g["slug"]: g["id"] for g in res_genres.data or []}
if not db_genres:
    print("Error: No genres found in database. Did you run the SQL migration 003_genres.sql first?")
    sys.exit(1)

print(f"Loaded {len(db_genres)} genres from database.")

# 2. Fetch games
res_games = supabase.from_("games").select("id, name, slug").execute()
games = res_games.data or []
print(f"Total games in database: {len(games)}")

# 3. Check which games already have genres mapped
res_mapped = supabase.from_("game_genres").select("game_id").execute()
already_mapped = {row["game_id"] for row in res_mapped.data or []}
print(f"Games already having genres: {len(already_mapped)}")

games_to_process = [g for g in games if g["id"] not in already_mapped]
print(f"Games to process: {len(games_to_process)}")

def map_rawg_metadata(rawg_genres, rawg_tags):
    mapped_slugs = set()
    
    rawg_genre_slugs = [g.get("slug") for g in rawg_genres]
    rawg_tag_slugs = [t.get("slug") for t in rawg_tags]
    rawg_tag_names = [t.get("name", "").lower() for t in rawg_tags]

    # Action
    if "action" in rawg_genre_slugs:
        mapped_slugs.add("action")
    
    # Adventure
    if "adventure" in rawg_genre_slugs:
        mapped_slugs.add("adventure")
        
    # Co-op
    coop_tags = ["co-op", "cooperative", "coop", "multiplayer", "online-co-op", "local-co-op"]
    if any(tag in rawg_tag_slugs for tag in coop_tags) or any("coop" in name or "co-op" in name for name in rawg_tag_names):
        mapped_slugs.add("co-op")
        
    # Horror
    if "horror" in rawg_genre_slugs or any("horror" in tag for tag in rawg_tag_slugs) or any("horror" in name for name in rawg_tag_names):
        mapped_slugs.add("horror")
        
    # RPG
    if "role-playing-games-rpg" in rawg_genre_slugs or "indie-rpg" in rawg_genre_slugs:
        mapped_slugs.add("rpg")
        
    # Shooter
    if "shooter" in rawg_genre_slugs or any("shooter" in tag for tag in rawg_tag_slugs):
        mapped_slugs.add("shooter")
        
    # Simulation
    if "simulation" in rawg_genre_slugs:
        mapped_slugs.add("simulation")
        
    # Strategy
    if "strategy" in rawg_genre_slugs:
        mapped_slugs.add("strategy")
        
    # Sports & Racing
    if "sports" in rawg_genre_slugs or "racing" in rawg_genre_slugs:
        mapped_slugs.add("sports-racing")
        
    # Casual
    if "casual" in rawg_genre_slugs:
        mapped_slugs.add("casual")
        
    # Anime
    if any("anime" in tag for tag in rawg_tag_slugs) or any("anime" in name for name in rawg_tag_names):
        mapped_slugs.add("anime")
        
    # Open World
    if any("open-world" in tag for tag in rawg_tag_slugs) or any("open world" in name for name in rawg_tag_names):
        mapped_slugs.add("open-world")

    return list(mapped_slugs)

url = "https://api.rawg.io/api/games"

all_rows_to_insert = []
rows_lock = threading.Lock()
print_lock = threading.Lock()

def process_single_game(index, game):
    name = game["name"]
    game_id = game["id"]
    
    # Slight stagger to avoid hitting the API at the exact same millisecond
    time.sleep((index % 8) * 0.1)
    
    params = {
        "key": RAWG_API_KEY,
        "search": name,
        "page_size": 1
    }
    
    local_rows = []
    log_msg = ""
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code != 200:
            log_msg = f"[{index+1}] Error status {resp.status_code} for {name}"
            return local_rows, log_msg
            
        data = resp.json()
        results = data.get("results", [])
        if not results:
            # fallback based on name patterns
            fallback_slugs = []
            lower_name = name.lower()
            if "horror" in lower_name or "resident evil" in lower_name or "silent hill" in lower_name:
                fallback_slugs.append("horror")
            if "coop" in lower_name or "co-op" in lower_name or "multiplayer" in lower_name or "it takes two" in lower_name:
                fallback_slugs.append("co-op")
            if "action" in lower_name:
                fallback_slugs.append("action")
            if "adventure" in lower_name or "tomb raider" in lower_name:
                fallback_slugs.append("adventure")
            if "rpg" in lower_name or "fantasy" in lower_name:
                fallback_slugs.append("rpg")
            if "soccer" in lower_name or "fifa" in lower_name or "pes" in lower_name or "racing" in lower_name or "nfs" in lower_name:
                fallback_slugs.append("sports-racing")
            
            if fallback_slugs:
                for slug in fallback_slugs:
                    if slug in db_genres:
                        local_rows.append({"game_id": game_id, "genre_id": db_genres[slug]})
                log_msg = f"[{index+1}] {name}: Fallback applied {fallback_slugs}"
            else:
                log_msg = f"[{index+1}] {name}: Not found on RAWG (no fallback)"
            return local_rows, log_msg
            
        rawg_game = results[0]
        rawg_genres = rawg_game.get("genres") or []
        rawg_tags = rawg_game.get("tags") or []
        
        mapped_genres = map_rawg_metadata(rawg_genres, rawg_tags)
        
        if mapped_genres:
            for slug in mapped_genres:
                if slug in db_genres:
                    local_rows.append({"game_id": game_id, "genre_id": db_genres[slug]})
            log_msg = f"[{index+1}] {name}: Success mapped {mapped_genres}"
        else:
            log_msg = f"[{index+1}] {name}: No matching target genres"
            
    except Exception as e:
        log_msg = f"[{index+1}] {name}: Exception: {e}"
        
    return local_rows, log_msg

# Run with 8 parallel workers
max_workers = 8
print(f"Starting execution with {max_workers} threads...")

success_count = 0
with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = [executor.submit(process_single_game, idx, game) for idx, game in enumerate(games_to_process)]
    
    for future in as_completed(futures):
        local_rows, log_msg = future.result()
        if log_msg:
            with print_lock:
                print(log_msg)
        if local_rows:
            with rows_lock:
                all_rows_to_insert.extend(local_rows)
                success_count += 1

print(f"\nFinished fetching data. Total associations to insert: {len(all_rows_to_insert)}")

# 4. Perform bulk insert in batches of 200
if all_rows_to_insert:
    print("Performing bulk insert into Supabase...")
    batch_size = 200
    for i in range(0, len(all_rows_to_insert), batch_size):
        batch = all_rows_to_insert[i:i+batch_size]
        try:
            supabase.from_("game_genres").insert(batch).execute()
            print(f"Inserted batch {i//batch_size + 1} ({len(batch)} rows)")
        except Exception as e:
            print(f"Error inserting batch: {e}")
            # Try inserting one-by-one for this batch to skip conflicts if any
            for row in batch:
                try:
                    supabase.from_("game_genres").insert(row).execute()
                except Exception as inner_e:
                    # probably duplicate key conflict, safe to ignore since user might have run earlier
                    pass
else:
    print("No new associations to insert.")

print(f"\nCompleted processing. Successfully mapped genres for {success_count} games.")
