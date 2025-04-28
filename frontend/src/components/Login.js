import React, { useState, useEffect } from 'react';
import '../styles/Login.css';

function Login() {
  const [loginUrl, setLoginUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch login URL from backend
    fetch('http://localhost:8000/login')
      .then(response => response.json())
      .then(data => {
        setLoginUrl(data.url);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching login URL:', error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Spotify Weekly Wrapped</h1>
          <p>Discover your weekly listening insights</p>
        </div>
        
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="login-content">
            <p>Connect your Spotify account to see your personalized weekly music insights.</p>
            <a 
              href={loginUrl} 
              className="spotify-login-button"
            >
              <i className="fab fa-spotify"></i> Login with Spotify
            </a>
            <div className="login-features">
              <div className="feature">
                <i className="fas fa-chart-line"></i>
                <h3>Weekly Stats</h3>
                <p>See your top artists, songs, and genres every week</p>
              </div>
              <div className="feature">
                <i className="fas fa-brain"></i>
                <p>AI-powered insights about your listening habits</p>
              </div>
              <div className="feature">
                <i className="fas fa-music"></i>
                <p>Get personalized recommendations based on your weekly taste</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="login-footer">
          <p>Your data is securely processed and never shared.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
