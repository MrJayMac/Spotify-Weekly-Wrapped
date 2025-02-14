import requests
import psycopg2
import os
import schedule
import time
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

# Connect to PostgreSQL
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# Fetch user's Spotify access token from the database
def get_access_token(spotify_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT access_token FROM users WHERE spotify_id = %s", (spotify_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

# Fetch and store ONLY the latest 50 tracks
def fetch_and_store_recent_tracks(spotify_id):
    access_token = get_access_token(spotify_id)
    if not access_token:
        print(f"❌ No access token for user {spotify_id}")
        return

    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.spotify.com/v1/me/player/recently-played?limit=50"

    response = requests.get(url, headers=headers)
    
    # Debugging: Print the raw response from Spotify
    print(f"🔍 Spotify API Response for {spotify_id}: {response.status_code}")

    if response.status_code != 200:
        print(f"❌ Failed to fetch tracks for {spotify_id}: {response.json()}")
        return

    tracks = response.json().get("items", [])

    if not tracks:
        print(f"⚠️ No recent tracks found for {spotify_id}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🚨 Step 1: Delete old records before inserting new ones
    cursor.execute("DELETE FROM listening_history WHERE spotify_id = %s", (spotify_id,))
    conn.commit()

    # 🚀 Step 2: Insert new tracks (only the latest 50)
    for track_item in tracks:
        track_name = track_item["track"]["name"]
        artist_name = ", ".join(artist["name"] for artist in track_item["track"]["artists"])
        played_at = track_item["played_at"]

        print(f"🎵 Storing track: {track_name} - {artist_name} at {played_at}")

        cursor.execute("""
            INSERT INTO listening_history (spotify_id, track_name, artist_name, played_at)
            VALUES (%s, %s, %s, %s);
        """, (spotify_id, track_name, artist_name, played_at))

    conn.commit()
    conn.close()
    print(f"✅ Replaced recent listening history for {spotify_id}")

# Run the summary script automatically after fetching data
def run_summary(spotify_id):
    try:
        print(f"⏳ Running summary for {spotify_id}...")
        result = subprocess.run(["python3", "analytics/spotify_summary.py", spotify_id], capture_output=True, text=True)
        print(f"✅ Summary completed:\n{result.stdout}")
    except Exception as e:
        print(f"❌ Error running summary for {spotify_id}: {str(e)}")

# Run pipeline: Fetches recent tracks and then generates a summary for each user
def run_pipeline():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT spotify_id FROM users")
    users = cursor.fetchall()
    conn.close()

    for (spotify_id,) in users:
        fetch_and_store_recent_tracks(spotify_id)
        run_summary(spotify_id)  # Automatically generate summary after updating data

# Schedule the pipeline to run every 30 seconds for testing
schedule.every(30).seconds.do(run_pipeline)

print("⏳ Data pipeline is running every 30 seconds for testing...")

while True:
    schedule.run_pending()
    time.sleep(1)  # Keep checking every second to avoid delays
