import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import '../styles/Dashboard.css';

function Dashboard() {
  // Get authentication context
  const { token, refreshToken, updateToken, handleLogout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedRecentlyPlayed, setHasFetchedRecentlyPlayed] = useState(false);

  useEffect(() => {
    if (!hasFetchedRecentlyPlayed && token && refreshToken) {
      // Fetch user profile and recently played tracks
      fetch(`http://localhost:8000/me?access_token=${token}&refresh_token=${refreshToken}`)
        .then(response => response.json())
        .then(data => {
          // Check if we got a new access token
          if (data.newAccessToken) {
            console.log('Received new access token');
            updateToken(data.newAccessToken);
          }
          setProfile(data);

          // Fetch recently played tracks
          return fetch(`http://localhost:8000/recently-played?access_token=${data.newAccessToken || token}&refresh_token=${refreshToken}`);
        })
        .then(response => response.json())
        .then(data => {
          // Check if we got a new access token
          if (data.newAccessToken) {
            console.log('Received new access token');
            updateToken(data.newAccessToken);
          }
          setRecentTracks(data.items || []);
          setHasFetchedRecentlyPlayed(true);
        })
        .catch(error => console.error('Error fetching data:', error));
    }
  }, [token, refreshToken, updateToken, hasFetchedRecentlyPlayed]);

  useEffect(() => {
    // Fetch top artists
    fetch(`http://localhost:8000/top-artists?access_token=${token}&refresh_token=${refreshToken}&time_range=short_term`)
      .then(response => response.json())
      .then(data => {
        // Check if we got a new access token
        if (data.newAccessToken) {
          console.log('Received new access token');
          updateToken(data.newAccessToken);
        }
        setTopArtists(data.items || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching top artists:', error);
        setIsLoading(false);
      });
  }, [token, refreshToken, updateToken]);

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
          <button onClick={handleLogout} className="logout-button">Logout</button>
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
      </main>

      <footer className="dashboard-footer">
        <p>Spotify Weekly Wrapped &copy; 2025</p>
      </footer>
    </div>
  );
}

export default Dashboard;
