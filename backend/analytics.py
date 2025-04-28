import os
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import json
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(supabase_url, supabase_key)

def get_weekly_listening_data():
    """Fetch the last week's listening data from Supabase"""
    # Get data from the past week
    from datetime import datetime, timedelta
    one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    
    response = supabase.table("listening_history").select("*").gte("played_at", one_week_ago).execute()
    
    if len(response.data) == 0:
        return pd.DataFrame()
    
    # Convert to DataFrame
    df = pd.DataFrame(response.data)
    return df

def generate_listening_patterns(df):
    """Generate listening patterns from the data"""
    if df.empty:
        return {}
    
    # Analyze listening patterns by hour of day
    df['played_at_dt'] = pd.to_datetime(df['played_at'])
    df['hour_of_day'] = df['played_at_dt'].dt.hour
    
    hourly_patterns = df.groupby('hour_of_day').size().reset_index(name='count')
    hourly_patterns = hourly_patterns.sort_values('hour_of_day')
    
    # Determine peak listening hours
    peak_hours = hourly_patterns.sort_values('count', ascending=False)['hour_of_day'].head(3).tolist()
    
    # Analyze listening patterns by day of week
    df['day_of_week'] = df['played_at_dt'].dt.day_name()
    
    daily_patterns = df.groupby('day_of_week').size().reset_index(name='count')
    
    # Convert to dictionary for JSON serialization
    hourly_data = hourly_patterns.to_dict(orient='records')
    daily_data = daily_patterns.to_dict(orient='records')
    
    return {
        'hourly_patterns': hourly_data,
        'daily_patterns': daily_data,
        'peak_listening_hours': peak_hours
    }

def cluster_tracks_by_features(df, n_clusters=3):
    """Cluster tracks based on their audio features"""
    if df.empty or 'audio_features' not in df.columns:
        return {}
    
    # Extract audio features
    features = ['danceability', 'energy', 'valence', 'tempo', 'acousticness']
    feature_matrix = []
    
    for _, row in df.iterrows():
        if row['audio_features']:
            audio_features = row['audio_features']
            feature_vector = [
                audio_features.get('danceability', 0),
                audio_features.get('energy', 0),
                audio_features.get('valence', 0),
                audio_features.get('tempo', 0) / 200,  # Normalize tempo
                audio_features.get('acousticness', 0)
            ]
            feature_matrix.append(feature_vector)
    
    if not feature_matrix:
        return {}
    
    # Apply KMeans clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(feature_matrix)
    
    # Analyze cluster characteristics
    cluster_centers = kmeans.cluster_centers_
    
    # Map cluster characteristics to mood labels
    mood_labels = []
    for center in cluster_centers:
        danceability, energy, valence, _, acousticness = center
        
        if valence > 0.6 and energy > 0.6:
            mood = "Happy & Energetic"
        elif valence < 0.4 and energy < 0.4:
            mood = "Sad & Calm"
        elif valence > 0.5 and acousticness > 0.5:
            mood = "Positive & Acoustic"
        elif energy > 0.7:
            mood = "Intense"
        elif acousticness > 0.7:
            mood = "Acoustic & Relaxed"
        else:
            mood = "Balanced"
        
        mood_labels.append(mood)
    
    # Assign tracks to mood clusters
    df_with_clusters = df.copy()
    df_with_clusters['cluster'] = pd.Series(clusters, index=df.index[:len(clusters)])
    
    # Group tracks by cluster/mood
    mood_playlists = {}
    for i, mood in enumerate(mood_labels):
        tracks_in_mood = df_with_clusters[df_with_clusters['cluster'] == i]
        if not tracks_in_mood.empty:
            mood_playlists[mood] = tracks_in_mood[['track_id', 'track_name', 'artist_name']].to_dict(orient='records')
    
    return {
        'mood_playlists': mood_playlists,
        'mood_distribution': {mood: len(tracks) for mood, tracks in mood_playlists.items()}
    }

def generate_personalized_insights(df):
    """Generate natural language insights based on listening data"""
    if df.empty:
        return []
    
    insights = []
    
    # Top artist insight
    top_artist_counts = df['artist_name'].value_counts()
    if not top_artist_counts.empty:
        top_artist = top_artist_counts.index[0]
        top_artist_plays = top_artist_counts.iloc[0]
        total_plays = len(df)
        top_artist_percentage = (top_artist_plays / total_plays) * 100
        
        if top_artist_percentage > 50:
            insights.append(f"You're really into {top_artist} this week! They made up {top_artist_percentage:.1f}% of your listening.")
        elif top_artist_percentage > 30:
            insights.append(f"{top_artist} was your favorite artist this week, making up {top_artist_percentage:.1f}% of your listening.")
        else:
            insights.append(f"Your top artist this week was {top_artist}.")
    
    # Listening time insight
    total_duration_ms = df['duration_ms'].sum()
    total_duration_min = total_duration_ms / 60000
    
    if total_duration_min > 600:  # More than 10 hours
        insights.append(f"Wow! You listened to {total_duration_min:.0f} minutes of music this week. That's a lot of tunes!")
    elif total_duration_min > 300:  # More than 5 hours
        insights.append(f"You enjoyed {total_duration_min:.0f} minutes of music this week. Nice listening session!")
    else:
        insights.append(f"You listened to {total_duration_min:.0f} minutes of music this week.")
    
    # Genre diversity insight
    if 'genre' in df.columns and not df['genre'].isna().all():
        unique_genres = df['genre'].nunique()
        if unique_genres > 10:
            insights.append(f"Your music taste was super diverse this week with {unique_genres} different genres!")
        elif unique_genres > 5:
            insights.append(f"You explored {unique_genres} different genres this week. Nice variety!")
        else:
            insights.append(f"You stuck to {unique_genres} genres this week. You know what you like!")
    
    # New discoveries insight
    if 'first_listened' in df.columns:
        new_tracks = df[df['first_listened'] == True]
        if len(new_tracks) > 10:
            insights.append(f"You discovered {len(new_tracks)} new tracks this week! You're quite the explorer.")
        elif len(new_tracks) > 0:
            insights.append(f"You found {len(new_tracks)} new tracks this week.")
    
    return insights

def get_collaborative_recommendations(track_ids, limit=10):
    """Get recommendations based on collaborative filtering"""
    # This would typically use a more sophisticated model
    # For now, we'll simulate by fetching from Supabase
    
    # Get tracks that are frequently listened to alongside the input tracks
    similar_tracks = []
    for track_id in track_ids[:5]:  # Use top 5 tracks
        response = supabase.table("track_similarities").select("*").eq("track_id", track_id).execute()
        if response.data:
            similar_tracks.extend(response.data)
    
    # Sort by similarity score and take top recommendations
    if similar_tracks:
        similar_tracks.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
        recommendations = similar_tracks[:limit]
    else:
        # Fallback to random popular tracks if no similarities found
        response = supabase.table("tracks").select("*").order('popularity', desc=True).limit(limit).execute()
        recommendations = response.data
    
    return recommendations

def process_weekly_data():
    """Main function to process weekly data and generate insights"""
    # Get weekly listening data
    df = get_weekly_listening_data()
    
    if df.empty:
        return {
            "error": "No listening data available for the past week"
        }
    
    # Generate listening patterns
    patterns = generate_listening_patterns(df)
    
    # Generate mood clusters (would need audio features from Spotify API)
    # For now, we'll assume audio_features column doesn't exist
    mood_analysis = {}
    
    # Generate personalized insights
    insights = generate_personalized_insights(df)
    
    # Get top tracks for recommendations
    top_tracks = df['track_id'].value_counts().head(5).index.tolist()
    recommendations = get_collaborative_recommendations(top_tracks)
    
    # Compile results
    results = {
        "listening_patterns": patterns,
        "mood_analysis": mood_analysis,
        "insights": insights,
        "recommendations": recommendations
    }
    
    # Store results in Supabase
    user_id = "demo_user"  # In a real app, this would be the actual user ID
    
    supabase.table("weekly_analytics").insert({
        "user_id": user_id,
        "week_ending": pd.Timestamp.now().isoformat(),
        "analysis_results": results
    }).execute()
    
    return results

if __name__ == "__main__":
    results = process_weekly_data()
    print(json.dumps(results, indent=2))
