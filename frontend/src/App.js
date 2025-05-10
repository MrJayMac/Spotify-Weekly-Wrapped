import React, { useState, useEffect, createContext } from 'react';
import './App.css';
import './styles/responsive.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import WeeklyWrapped from './components/WeeklyWrapped';

// Create auth context for token management
export const AuthContext = createContext(null);

function App() {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [userId, setUserId] = useState(null);
  
  useEffect(() => {
    // Check for token in URL params (after Spotify auth redirect)
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get('access_token');
    const refreshTokenParam = queryParams.get('refresh_token');
    const userIdParam = queryParams.get('user_id');
    
    if (accessToken) {
      setToken(accessToken);
      // Store tokens in localStorage
      localStorage.setItem('spotify_access_token', accessToken);
      if (refreshTokenParam) {
        setRefreshToken(refreshTokenParam);
        localStorage.setItem('spotify_refresh_token', refreshTokenParam);
      }
      if (userIdParam) {
        setUserId(userIdParam);
        localStorage.setItem('spotify_user_id', userIdParam);
        console.log('User ID stored:', userIdParam);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    } else {
      // Check if we have tokens in localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const storedUserId = localStorage.getItem('spotify_user_id');
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedRefreshToken) {
        setRefreshToken(storedRefreshToken);
      }
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, []);
  
  // Function to update token when refreshed
  const updateToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('spotify_access_token', newToken);
  };
  
  const handleLogout = () => {
    setToken(null);
    setRefreshToken(null);
    setUserId(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_user_id');
  };
  
  return (
    <AuthContext.Provider value={{ token, refreshToken, userId, updateToken, handleLogout }}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/" 
              element={token ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/dashboard" 
              element={token ? <Dashboard /> : <Navigate to="/" />} 
            />
            <Route 
              path="/weekly" 
              element={token ? <WeeklyWrapped /> : <Navigate to="/" />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
