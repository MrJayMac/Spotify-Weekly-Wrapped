import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import WeeklyWrapped from './components/WeeklyWrapped';
import Recommendations from './components/Recommendations';

function App() {
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    // Check for token in URL params (after Spotify auth redirect)
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');
    
    if (accessToken) {
      setToken(accessToken);
      // Store tokens in localStorage
      localStorage.setItem('spotify_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('spotify_refresh_token', refreshToken);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    } else {
      // Check if we have a token in localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []);
  
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  };
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={token ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/weekly" 
            element={token ? <WeeklyWrapped token={token} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/recommendations" 
            element={token ? <Recommendations token={token} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
