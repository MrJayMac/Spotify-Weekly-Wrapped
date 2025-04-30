import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import '../styles/WeeklyWrapped.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function WeeklyWrapped() {
  // Get authentication context
  const { token, refreshToken, updateToken, handleLogout } = useContext(AuthContext);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [insights, setInsights] = useState([]);
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
        
        // Generate insights (in a real app, these would come from the AI backend)
        const generatedInsights = [
          "You listened to more rock music this week than usual.",
          "Your most active listening time was Tuesday evening.",
          "You discovered 8 new artists this week!",
          "Your musical mood shifted from energetic to relaxed throughout the week."
        ];
        setInsights(generatedInsights);
        
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
  const genreData = {
    labels: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B'],
    datasets: [
      {
        label: 'Genre Distribution',
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const weekdayData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Listening Minutes by Day',
        data: [45, 59, 80, 81, 56, 120, 90],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const moodData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Energy',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Happiness',
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Define slides for the wrapped experience
  const slides = [
    {
      id: 'top-tracks',
      title: 'Your Top Tracks',
      content: (
        <div className="slide-content">
          <h2>Your Top Tracks This Week</h2>
          <div className="top-tracks-list">
            {topTracks.slice(0, 5).map((track, index) => (
              <div key={index} className="top-track-item">
                <div className="track-rank">{index + 1}</div>
                {track.album.images && track.album.images[0] && (
                  <img 
                    src={track.album.images[0].url} 
                    alt={track.name} 
                    className="track-image" 
                  />
                )}
                <div className="track-info">
                  <h3>{track.name}</h3>
                  <p>{track.artists.map(artist => artist.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'top-artists',
      title: 'Your Top Artists',
      content: (
        <div className="slide-content">
          <h2>Your Top Artists This Week</h2>
          <div className="top-artists-grid">
            {topArtists.slice(0, 5).map((artist, index) => (
              <div key={index} className="top-artist-card">
                {artist.images && artist.images[0] && (
                  <img 
                    src={artist.images[0].url} 
                    alt={artist.name} 
                    className="artist-image" 
                  />
                )}
                <h3>{artist.name}</h3>
                <p className="artist-rank">#{index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'genres',
      title: 'Genre Breakdown',
      content: (
        <div className="slide-content">
          <h2>Your Genre Mix</h2>
          <div className="chart-container">
            <Pie 
              data={genreData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: '#fff'
                    }
                  }
                },
                layout: {
                  padding: 20
                }
              }} 
            />
          </div>
          <p className="chart-description">Pop dominated your week with 35% of your listening time.</p>
        </div>
      )
    },
    {
      id: 'listening-patterns',
      title: 'Listening Patterns',
      content: (
        <div className="slide-content">
          <h2>When You Listened</h2>
          <div className="chart-container">
            <Bar 
              data={weekdayData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Listening Minutes by Day of Week'
                  }
                }
              }} 
            />
          </div>
          <p className="chart-description">Saturday was your most active listening day this week.</p>
        </div>
      )
    },
    {
      id: 'mood-journey',
      title: 'Mood Journey',
      content: (
        <div className="slide-content">
          <h2>Your Mood Journey</h2>
          <div className="chart-container">
            <Line 
              data={moodData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Music Mood Throughout the Week'
                  }
                }
              }} 
            />
          </div>
          <p className="chart-description">Your music choices got happier toward the weekend!</p>
        </div>
      )
    },
    {
      id: 'insights',
      title: 'AI Insights',
      content: (
        <div className="slide-content">
          <h2>AI-Generated Insights</h2>
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-icon">💡</div>
                <p>{insight}</p>
              </div>
            ))}
          </div>
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
