import requests
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_access_token(spotify_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT access_token FROM users WHERE spotify_id = %s", (spotify_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def fetch_and_store_recent_tracks(spotify_id):
    access_token = get_access_token(spotify_id)
    if not access_token:
        print(f"No access token for user {spotify_id}")
        return

    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.spotify.com/v1/me/player/recently-played?limit=50"

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch tracks for {spotify_id}: {response.json()}")
        return

    tracks = response.json().get("items", [])

    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("DELETE FROM listening_history WHERE spotify_id = %s", (spotify_id,))
    conn.commit()


    for track_item in tracks:
        track_name = track_item["track"]["name"]
        artist_name = ", ".join(artist["name"] for artist in track_item["track"]["artists"])
        played_at = track_item["played_at"]

        cursor.execute("""
            INSERT INTO listening_history (spotify_id, track_name, artist_name, played_at)
            VALUES (%s, %s, %s, %s);
        """, (spotify_id, track_name, artist_name, played_at))

    conn.commit()
    conn.close()
    print(f"Replaced recent listening history for {spotify_id}")


def run_pipeline():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT spotify_id FROM users")
    users = cursor.fetchall()
    conn.close()

    for (spotify_id,) in users:
        fetch_and_store_recent_tracks(spotify_id)


if __name__ == "__main__":
    run_pipeline()
