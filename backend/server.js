require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Routes
app.get('/login', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ];
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.json({ url: authorizeURL });
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    // Set the access token and refresh token
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
    
    // Store tokens in Supabase (in a real app, you'd associate this with a user)
    const { error } = await supabase
      .from('user_tokens')
      .insert({
        access_token: data.body['access_token'],
        refresh_token: data.body['refresh_token'],
        expires_in: data.body['expires_in'],
        created_at: new Date().toISOString()
      });
    
    if (error) console.error('Error storing tokens:', error);
    
    // Redirect to frontend with tokens
    res.redirect(`http://localhost:3000?access_token=${data.body['access_token']}&refresh_token=${data.body['refresh_token']}`);
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.redirect('http://localhost:3000?error=auth_error');
  }
});

// Token refresh middleware
async function refreshTokenIfNeeded(req, res, next) {
  const { access_token, refresh_token } = req.query;
  
  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  spotifyApi.setAccessToken(access_token);
  
  if (refresh_token) {
    spotifyApi.setRefreshToken(refresh_token);
  }
  
  try {
    // Try a simple API call to check if token is valid
    await spotifyApi.getMe();
    // If successful, continue with the original request
    next();
  } catch (err) {
    // Check if token expired error
    if (err.statusCode === 401 && refresh_token) {
      console.log('Access token expired, attempting to refresh...');
      try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];
        
        // Update token in database
        const { error } = await supabase
          .from('user_tokens')
          .update({
            access_token: newAccessToken,
            updated_at: new Date().toISOString()
          })
          .eq('refresh_token', refresh_token);
        
        if (error) console.error('Error updating token in database:', error);
        
        // Set new access token for the API call
        spotifyApi.setAccessToken(newAccessToken);
        
        // Add the new token to the request for the route handler
        req.newAccessToken = newAccessToken;
        
        next();
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
        return res.status(401).json({ 
          error: 'Session expired. Please log in again.',
          needsReauthentication: true 
        });
      }
    } else {
      console.error('API Error:', err);
      return res.status(err.statusCode || 500).json({ error: err.message || 'API error' });
    }
  }
}

// Get user's profile
app.get('/me', refreshTokenIfNeeded, async (req, res) => {
  try {
    const data = await spotifyApi.getMe();
    
    // If we have a new token from the middleware, include it in the response
    if (req.newAccessToken) {
      return res.json({
        ...data.body,
        newAccessToken: req.newAccessToken
      });
    }
    
    res.json(data.body);
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get user's recently played tracks
app.get('/recently-played', refreshTokenIfNeeded, async (req, res) => {
  try {
    const data = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    
    // Store listening data in Supabase
    const tracks = data.body.items.map(item => ({
      track_id: item.track.id,
      track_name: item.track.name,
      artist_name: item.track.artists[0].name,
      played_at: item.played_at,
      album_name: item.track.album.name,
      album_image: item.track.album.images[0]?.url || null,
      duration_ms: item.track.duration_ms
    }));
    
    // Store in Supabase
    const { error } = await supabase
      .from('listening_history')
      .insert(tracks);
    
    if (error) console.error('Error storing listening history:', error);
    
    // If we have a new token from the middleware, include it in the response
    if (req.newAccessToken) {
      return res.json({
        ...data.body,
        newAccessToken: req.newAccessToken
      });
    }
    
    res.json(data.body);
  } catch (err) {
    console.error('Error getting recently played tracks:', err);
    res.status(500).json({ error: 'Failed to get recently played tracks' });
  }
});

// Get user's top tracks
app.get('/top-tracks', refreshTokenIfNeeded, async (req, res) => {
  const { time_range = 'short_term' } = req.query;
  
  try {
    const data = await spotifyApi.getMyTopTracks({ 
      time_range, // short_term (4 weeks), medium_term (6 months), long_term (years)
      limit: 20 
    });
    
    // If we have a new token from the middleware, include it in the response
    if (req.newAccessToken) {
      return res.json({
        ...data.body,
        newAccessToken: req.newAccessToken
      });
    }
    
    res.json(data.body);
  } catch (err) {
    console.error('Error getting top tracks:', err);
    res.status(500).json({ error: 'Failed to get top tracks' });
  }
});

// Get user's top artists
app.get('/top-artists', refreshTokenIfNeeded, async (req, res) => {
  const { time_range = 'short_term' } = req.query;
  
  try {
    const data = await spotifyApi.getMyTopArtists({ 
      time_range,
      limit: 20 
    });
    
    // If we have a new token from the middleware, include it in the response
    if (req.newAccessToken) {
      return res.json({
        ...data.body,
        newAccessToken: req.newAccessToken
      });
    }
    
    res.json(data.body);
  } catch (err) {
    console.error('Error getting top artists:', err);
    res.status(500).json({ error: 'Failed to get top artists' });
  }
});

// Get recommendations based on user's top tracks
app.get('/recommendations', refreshTokenIfNeeded, async (req, res) => {
  try {
    // First get user's top tracks
    const topTracks = await spotifyApi.getMyTopTracks({ 
      time_range: 'short_term', 
      limit: 5 
    });
    
    const seedTracks = topTracks.body.items.map(track => track.id);
    
    // Get recommendations based on top tracks
    const recommendations = await spotifyApi.getRecommendations({
      seed_tracks: seedTracks,
      limit: 20
    });
    
    // If we have a new token from the middleware, include it in the response
    if (req.newAccessToken) {
      return res.json({
        ...recommendations.body,
        newAccessToken: req.newAccessToken
      });
    }
    
    res.json(recommendations.body);
  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get weekly analytics
app.get('/weekly-analytics', async (req, res) => {
  const { user_id } = req.query;
  
  try {
    // Get listening history for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('listening_history')
      .select('*')
      .gte('played_at', oneWeekAgo.toISOString());
    
    if (error) {
      console.error('Error fetching weekly data:', error);
      return res.status(500).json({ error: 'Failed to fetch weekly data' });
    }
    
    // Simple analytics
    const totalTracks = data.length;
    
    // Count plays by artist
    const artistCounts = {};
    data.forEach(item => {
      if (artistCounts[item.artist_name]) {
        artistCounts[item.artist_name]++;
      } else {
        artistCounts[item.artist_name] = 1;
      }
    });
    
    // Sort artists by play count
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    // Count plays by track
    const trackCounts = {};
    data.forEach(item => {
      const trackKey = `${item.track_name} - ${item.artist_name}`;
      if (trackCounts[trackKey]) {
        trackCounts[trackKey].count++;
      } else {
        trackCounts[trackKey] = { 
          count: 1, 
          track_id: item.track_id,
          track_name: item.track_name,
          artist_name: item.artist_name,
          album_image: item.album_image
        };
      }
    });
    
    // Sort tracks by play count
    const topTracks = Object.values(trackCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate total listening time
    const totalListeningTimeMs = data.reduce((sum, item) => sum + item.duration_ms, 0);
    const totalListeningTimeMinutes = Math.round(totalListeningTimeMs / 60000);
    
    // Return analytics
    res.json({
      totalTracks,
      topArtists,
      topTracks,
      totalListeningTimeMinutes
    });
  } catch (err) {
    console.error('Error generating weekly analytics:', err);
    res.status(500).json({ error: 'Failed to generate weekly analytics' });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
