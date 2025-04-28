import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Recommendations.css';

function Recommendations({ token, onLogout }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState('all');

  useEffect(() => {
    // Fetch recommendations from backend
    fetch(`http://localhost:8000/recommendations?access_token=${token}`)
      .then(response => response.json())
      .then(data => {
        setRecommendations(data.tracks || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching recommendations:', error);
        setIsLoading(false);
      });
  }, [token]);

  // Filter recommendations by mood (this would be more sophisticated with real audio features)
  const filterByMood = (mood) => {
    setSelectedMood(mood);
  };

  // Group recommendations into playlists (in a real app, this would use AI clustering)
  const playlists = {
    'Energetic Mix': recommendations.slice(0, 5),
    'Chill Vibes': recommendations.slice(5, 10),
    'New Discoveries': recommendations.slice(10, 15),
    'Based on Your Favorites': recommendations.slice(15, 20)
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Generating your recommendations...</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <header className="recommendations-header">
        <Link to="/dashboard" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
        <h1>Your Weekly Recommendations</h1>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>

      <main className="recommendations-content">
        <div className="mood-filter">
          <h2>Filter by Mood</h2>
          <div className="mood-buttons">
            <button 
              className={selectedMood === 'all' ? 'active' : ''} 
              onClick={() => filterByMood('all')}
            >
              All
            </button>
            <button 
              className={selectedMood === 'energetic' ? 'active' : ''} 
              onClick={() => filterByMood('energetic')}
            >
              Energetic
            </button>
            <button 
              className={selectedMood === 'chill' ? 'active' : ''} 
              onClick={() => filterByMood('chill')}
            >
              Chill
            </button>
            <button 
              className={selectedMood === 'happy' ? 'active' : ''} 
              onClick={() => filterByMood('happy')}
            >
              Happy
            </button>
            <button 
              className={selectedMood === 'focused' ? 'active' : ''} 
              onClick={() => filterByMood('focused')}
            >
              Focused
            </button>
          </div>
        </div>

        <section className="ai-playlists">
          <h2>AI-Generated Playlists</h2>
          <p>Based on your listening patterns this week</p>
          
          <div className="playlists-grid">
            {Object.entries(playlists).map(([name, tracks], index) => (
              <div key={index} className="playlist-card">
                <div className="playlist-header">
                  <h3>{name}</h3>
                  <p>{tracks.length} songs</p>
                </div>
                
                <div className="playlist-tracks">
                  {tracks.slice(0, 3).map((track, idx) => (
                    <div key={idx} className="playlist-track">
                      {track.album.images && track.album.images[0] && (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.name} 
                          className="track-image" 
                        />
                      )}
                      <div className="track-info">
                        <h4>{track.name}</h4>
                        <p>{track.artists.map(artist => artist.name).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                  {tracks.length > 3 && (
                    <p className="more-tracks">+{tracks.length - 3} more</p>
                  )}
                </div>
                
                <button className="save-playlist-button">
                  Save to Spotify
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="recommendation-explanation">
          <h2>How These Recommendations Work</h2>
          <div className="explanation-content">
            <div className="explanation-item">
              <div className="explanation-icon">🎧</div>
              <div className="explanation-text">
                <h3>Based on Your Weekly Listening</h3>
                <p>Unlike regular recommendations, these are based specifically on what you listened to this week, not your overall history.</p>
              </div>
            </div>
            
            <div className="explanation-item">
              <div className="explanation-icon">🧠</div>
              <div className="explanation-text">
                <h3>AI-Powered Analysis</h3>
                <p>Our AI analyzes the audio features, lyrics, and patterns in your weekly listening to find songs that match your current taste.</p>
              </div>
            </div>
            
            <div className="explanation-item">
              <div className="explanation-icon">🔄</div>
              <div className="explanation-text">
                <h3>Weekly Updates</h3>
                <p>Your recommendations refresh every week based on your latest listening habits, helping you discover new music that matches your evolving taste.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="recommendations-footer">
        <p>Spotify Weekly Wrapped &copy; 2025</p>
      </footer>
    </div>
  );
}

export default Recommendations;
