import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("access_token");
    const [displayName, setDisplayName] = useState('');
    const [recentSummary, setRecentSummary] = useState(null);

    useEffect(() => {
        if (!accessToken) return;

        axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(response => {
            const spotifyId = response.data.id;

            axios.get(`http://localhost:8000/user/${spotifyId}`)
                .then(res => setDisplayName(res.data.display_name));
                
            axios.get(`http://localhost:8000/recent-summary/${spotifyId}`)
                .then(res => setRecentSummary(res.data));
        })
        .catch(error => {
            console.error('Error fetching user:', error);
        });
    }, [accessToken]);

    return (
        <div>
            <h1>Welcome back, {displayName}!</h1>

            {recentSummary ? (
                <div>
                    <h2>Recent Summary</h2>

                    <h3>Top 5 Songs:</h3>
                    <ul>
                        {recentSummary.topSongs.map((song, index) => (
                            <li key={index}>{song.track_name} - {song.artist_name} ({song.play_count} plays)</li>
                        ))}
                    </ul>

                    <h3>Top 5 Artists:</h3>
                    <ul>
                        {recentSummary.topArtists.map((artist, index) => (
                            <li key={index}>{artist.artist_name} ({artist.play_count} plays)</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>Loading recent summary...</p>
            )}
        </div>
    );
};

export default Dashboard;
