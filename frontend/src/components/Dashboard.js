import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile
    fetch(`http://localhost:8000/me?access_token=${token}`)
      .then(response => response.json())
      .then(data => {
        setProfile(data);
        
        // Fetch recently played tracks
        return fetch(`http://localhost:8000/recently-played?access_token=${token}`);
      })
      .then(response => response.json())
      .then(data => {
        setRecentTracks(data.items || []);
        
        // Fetch top artists
        return fetch(`http://localhost:8000/top-artists?access_token=${token}&time_range=short_term`);
      })
      .then(response => response.json())
      .then(data => {
        setTopArtists(data.items || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your music data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-profile">
          {profile && profile.images && profile.images[0] && (
            <img 
              src={profile.images[0].url} 
              alt="Profile" 
              className="profile-image" 
            />
          )}
          <div className="user-info">
            <h1>Hi, {profile ? profile.display_name : 'there'}!</h1>
            <p>Welcome to your Weekly Wrapped</p>
          </div>
        </div>
        <nav className="dashboard-nav">
          <Link to="/dashboard" className="nav-link active">Home</Link>
          <Link to="/weekly" className="nav-link">Weekly Wrapped</Link>
          <Link to="/recommendations" className="nav-link">Recommendations</Link>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="weekly-highlight">
          <div className="highlight-card">
            <h2>Your Weekly Wrapped is Ready!</h2>
            <p>Discover your listening trends and get personalized insights.</p>
            <Link to="/weekly" className="highlight-button">View Weekly Wrapped</Link>
          </div>
        </section>

        <section className="dashboard-overview">
          <div className="overview-card recent-tracks">
            <h2>Recently Played</h2>
            <ul className="track-list">
              {recentTracks.slice(0, 5).map((item, index) => (
                <li key={index} className="track-item">
                  {item.track.album.images && item.track.album.images[0] && (
                    <img 
                      src={item.track.album.images[0].url} 
                      alt={item.track.album.name} 
                      className="track-image" 
                    />
                  )}
                  <div className="track-info">
                    <h3>{item.track.name}</h3>
                    <p>{item.track.artists.map(artist => artist.name).join(', ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="overview-card top-artists">
            <h2>Your Top Artists This Week</h2>
            <div className="artist-grid">
              {topArtists.slice(0, 6).map((artist, index) => (
                <div key={index} className="artist-card">
                  {artist.images && artist.images[0] && (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name} 
                      className="artist-image" 
                    />
                  )}
                  <h3>{artist.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="recommendation-preview">
          <h2>Discover New Music</h2>
          <p>We've created personalized recommendations based on your recent listening.</p>
          <Link to="/recommendations" className="recommendation-button">View Recommendations</Link>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>Spotify Weekly Wrapped &copy; 2025</p>
      </footer>
    </div>
  );
}

export default Dashboard;
