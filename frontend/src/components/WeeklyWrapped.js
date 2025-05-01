import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import '../styles/WeeklyWrapped.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function WeeklyWrapped() {
  // Get authentication context
  const { token, refreshToken, updateToken, handleLogout } = useContext(AuthContext);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // No need for fallback data anymore as we removed the intro slide

    // Fetch weekly analytics data
    fetch(`http://localhost:8000/weekly-analytics?access_token=${token}&refresh_token=${refreshToken}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Check if we got a new access token
        if (data.newAccessToken) {
          console.log('Received new access token');
          updateToken(data.newAccessToken);
        }
        
        // We don't need the weekly data stats anymore
        console.log('Received weekly data from backend');
        
        // Fetch top tracks for the week
        return fetch(`http://localhost:8000/top-tracks?access_token=${data.newAccessToken || token}&refresh_token=${refreshToken}&time_range=short_term`);
      })
      .then(response => response.json())
      .then(data => {
        // Check if we got a new access token
        if (data.newAccessToken) {
          console.log('Received new access token');
          updateToken(data.newAccessToken);
        }
        
        setTopTracks(data.items || []);
        
        // Fetch top artists for the week
        return fetch(`http://localhost:8000/top-artists?access_token=${data.newAccessToken || token}&refresh_token=${refreshToken}&time_range=short_term`);
      })
      .then(response => response.json())
      .then(data => {
        // Check if we got a new access token
        if (data.newAccessToken) {
          console.log('Received new access token');
          updateToken(data.newAccessToken);
        }
        
        setTopArtists(data.items || []);
        
        // In a real app, we would generate insights from the AI backend
        // but we've removed this feature for now
        
        // In the new design, we're not displaying these insights directly
        // but we're keeping the code for potential future use
        
        setIsLoading(false);
        
        // Start animation sequence after data is loaded
        setTimeout(() => {
          setAnimationComplete(true);
        }, 1000);
      })
      .catch(error => {
        console.error('Error fetching weekly data:', error);
        // Log error but continue with default empty state
        console.log('Error fetching data from backend');
        
        // Check if we need to reauthenticate
        if (error.needsReauthentication) {
          handleLogout();
        }
        setIsLoading(false);
      });
  }, [token, refreshToken, updateToken, handleLogout]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Mock data for charts
  const topGenresData = {
    labels: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B'],
    datasets: [
      {
        label: 'Genres',
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // We're not using these chart data in the new design, but keeping them for reference
  // const weekdayData = {
  //   labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  //   datasets: [
  //     {
  //       label: 'Minutes Listened',
  //       data: [45, 59, 80, 81, 56, 95, 40],
  //       backgroundColor: 'rgba(75, 192, 192, 0.7)',
  //       borderColor: 'rgba(75, 192, 192, 1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  // const moodData = {
  //   labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  //   datasets: [
  //     {
  //       label: 'Energy',
  //       data: [65, 59, 80, 81, 56, 55, 70],
  //       fill: false,
  //       backgroundColor: 'rgba(255, 99, 132, 0.7)',
  //       borderColor: 'rgba(255, 99, 132, 1)',
  //       tension: 0.4,
  //     },
  //     {
  //       label: 'Happiness',
  //       data: [45, 70, 65, 50, 75, 85, 90],
  //       fill: false,
  //       backgroundColor: 'rgba(54, 162, 235, 0.7)',
  //       borderColor: 'rgba(54, 162, 235, 1)',
  //       tension: 0.4,
  //     },
  //   ],
  // };

  // Define 10 fixed music types with descriptions
  const musicTypes = [
    {
      type: 'Sonic Explorer',
      description: 'You seek out diverse sounds and genres, constantly expanding your musical horizons. Your playlists are a journey through different musical landscapes.'
    },
    {
      type: 'Rhythm Devotee',
      description: 'You gravitate toward beat-driven music with strong rhythmic elements. The percussion and groove are what move you most in a song.'
    },
    {
      type: 'Lyrical Connoisseur',
      description: 'You value meaningful lyrics and storytelling. The message and poetry in music speak to you on a deep level.'
    },
    {
      type: 'Mood Architect',
      description: 'You curate music to shape your emotional environment. Your listening habits reflect a desire to create specific atmospheres.'
    },
    {
      type: 'Nostalgic Soul',
      description: 'You connect with music that evokes the past. Classic sounds and retro vibes resonate with your appreciation for musical heritage.'
    },
    {
      type: 'Energy Seeker',
      description: 'You\'re drawn to high-energy tracks that fuel your day. Upbeat tempos and dynamic production keep your enthusiasm high.'
    },
    {
      type: 'Melodic Dreamer',
      description: 'You appreciate beautiful melodies and harmonies that transport you to another world. The tonal journey of a song captivates you.'
    },
    {
      type: 'Genre Loyalist',
      description: 'You have deep appreciation for specific genres, diving into their nuances and subgenres. Your expertise in your preferred styles is impressive.'
    },
    {
      type: 'Ambient Enthusiast',
      description: 'You enjoy atmospheric and textural music that creates a sonic space. Subtle details and soundscapes capture your attention.'
    },
    {
      type: 'Emotional Resonator',
      description: 'You connect with music that expresses deep emotions. Songs that capture the complexity of human feelings speak to your soul.'
    }
  ];

  // Get a music type based on the user's listening habits
  // In a real app, this would analyze actual listening data
  // For now, we'll just pick a random type for demonstration
  const getMusicType = () => {
    const randomIndex = Math.floor(Math.random() * musicTypes.length);
    return musicTypes[randomIndex];
  };
  
  const musicType = getMusicType();

  // Define slides for the wrapped experience
  const slides = [
    {
      id: 'recap-intro',
      title: 'Weekly Recap',
      content: (
        <div className="slide-content recap-slide">
          <div className="recap-header">[WEEKLY] RECAP</div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },
    {
      id: 'minutes-listened',
      title: 'Minutes Listened',
      content: (
        <div className="slide-content minutes-slide">
          <h2>My Minutes Listened</h2>
          <div className="big-stat">XX,XXX</div>
          <p className="stat-description">Biggest listening day: June 17 with 347 minutes</p>
          <p className="stat-context">Top 8% of listeners worldwide</p>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },
    {
      id: 'top-tracks',
      title: 'Top Tracks',
      content: (
        <div className="slide-content tracks-slide">
          <h2>My Top Songs</h2>
          <div className="top-tracks-list">
            {topTracks.slice(0, 5).map((track, index) => (
              <div key={index} className="track-item">
                <div className="track-rank">{index + 1}</div>
                {track.album && track.album.images && track.album.images[0] && (
                  <img 
                    src={track.album.images[0].url} 
                    alt={track.name} 
                    className="track-image" 
                  />
                )}
                <div className="track-info">
                  <h3>{track.name}</h3>
                  <p>{track.artists ? track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },
    {
      id: 'top-artists',
      title: 'Top Artists',
      content: (
        <div className="slide-content artists-slide">
          <h2>My Top Artists</h2>
          <div className="top-artists-list">
            {topArtists.slice(0, 5).map((artist, index) => (
              <div key={index} className="artist-item">
                <div className="artist-rank">{index + 1}</div>
                {artist.images && artist.images[0] && (
                  <img 
                    src={artist.images[0].url} 
                    alt={artist.name} 
                    className="artist-image" 
                  />
                )}
                <div className="artist-info">
                  <h3>{artist.name}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },

    {
      id: 'music-type',
      title: 'Music Type',
      content: (
        <div className="slide-content style-word-slide">
          <h2>Your Music Type</h2>
          <div className="style-word-container">
            <div className="style-word">{musicType.type}</div>
            <p className="style-description">{musicType.description}</p>
          </div>
          <div className="music-type-footer">
            <p>Based on your listening patterns and preferences</p>
          </div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },
    {
      id: 'genre-breakdown',
      title: 'Genre Breakdown',
      content: (
        <div className="slide-content genre-slide">
          <h2>My Top Genres</h2>
          <div className="chart-container">
            <Pie 
              data={topGenresData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: false
                  }
                }
              }} 
            />
          </div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    },
    {
      id: 'listening-stats',
      title: 'Listening Stats',
      content: (
        <div className="slide-content stats-slide">
          <h2>My Weekly Stats</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Top Artist</div>
              <div className="stat-value">{topArtists.length > 0 ? topArtists[0].name : 'Unknown'}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Top Song</div>
              <div className="stat-value">{topTracks.length > 0 ? topTracks[0].name : 'Unknown'}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Minutes Listened</div>
              <div className="stat-value">XX,XXX</div>
            </div>
          </div>
          <div className="recap-footer">RECAP</div>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Generating your Weekly Wrapped...</p>
      </div>
    );
  }

  return (
    <div className="weekly-wrapped-container">
      <header className="wrapped-header">
        <Link to="/dashboard" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      <main className={`wrapped-content ${animationComplete ? 'animated' : ''}`}>
        <div 
          className="slides-container" 
          style={{ 
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
            WebkitTransform: `translate3d(-${currentSlide * 100}%, 0, 0)`
          }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className={`slide ${currentSlide === index ? 'active' : ''}`}>
              <div className="slide-inner">
                {slide.content}
              </div>
            </div>
          ))}
        </div>

        <div className="slide-navigation">
          <button onClick={prevSlide} className="nav-button prev">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <div 
                key={index} 
                className={`indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></div>
            ))}
          </div>
          <button onClick={nextSlide} className="nav-button next">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </main>

      <footer className="wrapped-footer">
        <p>Spotify Weekly Wrapped &copy; 2025</p>
      </footer>
    </div>
  );
}

export default WeeklyWrapped;
