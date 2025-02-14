const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const dotenv = require('dotenv');

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

        const response = await axios.post(
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

        const { access_token, refresh_token, expires_in } = response.data;
        console.log('Access Token:', access_token);

        res.redirect(`http://localhost:3000/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
});

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
