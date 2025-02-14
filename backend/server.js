const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const dotenv = require('dotenv');
const pool = require('./db')

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 8000;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

app.get('/login', (req, res) => {
    const authUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: 'user-read-recently-played user-top-read',
            redirect_uri: SPOTIFY_REDIRECT_URI,
        });

    console.log("Redirecting user to:", authUrl);
    res.redirect(authUrl);
});


app.get('/callback', async (req, res) => {
    const code = req.query.code || null;

    if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
                },
            }
        );

        const access_token = tokenResponse.data.access_token;

        const userProfile = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id: spotify_id, display_name } = userProfile.data;

        const query = `
            INSERT INTO users (spotify_id, display_name, access_token)
            VALUES ($1, $2, $3)
            ON CONFLICT (spotify_id) 
            DO UPDATE SET display_name = $2, access_token = $3 RETURNING *;
        `;

        const values = [spotify_id, display_name, access_token];
        await pool.query(query, values);

        res.redirect(`http://localhost:3000/dashboard?access_token=${access_token}`);
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});




app.get('/user/:spotify_id', async (req, res) => {
    const { spotify_id } = req.params;

    try {
        const result = await pool.query('SELECT display_name FROM users WHERE spotify_id = $1', [spotify_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ display_name: result.rows[0].display_name });
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/recent-tracks/:spotify_id', async (req, res) => {
    const { spotify_id } = req.params;

    try {
        const result = await pool.query('SELECT access_token FROM users WHERE spotify_id = $1', [spotify_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const access_token = result.rows[0].access_token;

        const spotifyResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        res.json(spotifyResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent tracks' });
    }
});


app.get('/recent-summary/:spotify_id', async (req, res) => {
    const { spotify_id } = req.params;

    try {
        const result = await pool.query('SELECT access_token FROM users WHERE spotify_id = $1', [spotify_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const access_token = result.rows[0].access_token;

        const spotifyResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const tracks = spotifyResponse.data.items;

        if (!tracks || tracks.length === 0) {
            return res.json({ message: "No recent tracks found" });
        }

        // Process and summarize data
        const trackCount = {};
        const artistCount = {};
        let totalSongs = 0;

        tracks.forEach(trackItem => {
            const track = trackItem.track;
            const artistName = track.artists.map(artist => artist.name).join(', ');

            // Count how many times each song was played
            trackCount[track.name] = (trackCount[track.name] || 0) + 1;

            // Count how many times each artist was played
            artistCount[artistName] = (artistCount[artistName] || 0) + 1;

            totalSongs++;
        });

        // Get top 5 songs
        const topSongs = Object.entries(trackCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([song, count]) => ({ song, count }));

        // Get top 5 artists
        const topArtists = Object.entries(artistCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([artist, count]) => ({ artist, count }));

        res.json({
            totalSongs,
            topSongs,
            topArtists
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent summary' });
    }
});



app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
