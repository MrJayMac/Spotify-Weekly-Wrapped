# Spotify Weekly Wrapped

A personalized weekly music analytics platform that provides users with insights about their Spotify listening habits on a weekly basis, similar to Spotify's annual Wrapped but updated weekly.

## Features

- **User Authentication**: Secure login with Spotify account
- **Weekly Listening Stats**: View your top tracks, artists, and genres of the week
- **AI-Powered Insights**: Get personalized observations about your listening patterns
- **Mood Analysis**: See how your music choices reflect your mood throughout the week
- **Smart Recommendations**: Discover new music based on your weekly (not overall) listening habits
- **Interactive Visualizations**: Explore your data through beautiful charts and graphs
- **Automated Playlist Generation**: AI-curated playlists based on your weekly themes

## Tech Stack

### Frontend
- React.js
- Chart.js for data visualization
- React Router for navigation

### Backend
- Node.js with Express
- Python for data processing and AI features
- Spotify Web API for music data

### Database
- Supabase (PostgreSQL)

### AI & Data Analytics
- Python data processing with pandas and numpy
- Machine learning with scikit-learn for recommendations and pattern recognition
- Natural language generation for personalized insights

## Project Structure

```
spotify-weekly-wrapped/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS files
│   │   └── App.js           # Main application component
├── backend/                 # Node.js backend server
│   ├── server.js            # Express server setup
│   ├── analytics.py         # Python data processing and AI
│   └── setup-database.js    # Database setup script
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- Spotify Developer Account with registered application
- Supabase account

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8000
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/spotify-weekly-wrapped.git
cd spotify-weekly-wrapped
```

2. Install backend dependencies

```bash
cd backend
npm install
pip install -r requirements.txt
```

3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

4. Set up the database

```bash
cd ../backend
node setup-database.js
```

5. Start the backend server

```bash
node server.js
```

6. Start the frontend development server

```bash
cd ../frontend
npm start
```

7. Open your browser and navigate to `http://localhost:3000`

## AI Implementation Details

### Recommendation Engine
The recommendation system uses a combination of collaborative filtering and content-based filtering to suggest new tracks based specifically on the user's weekly listening patterns, not their overall history.

### Pattern Recognition
Machine learning algorithms analyze audio features, play counts, and listening times to identify patterns in the user's weekly music consumption.

### Mood Analysis
Tracks are clustered based on audio features like valence, energy, and tempo to determine the emotional journey of the user's week through music.

### Natural Language Insights
Template-based generation combined with data analysis creates personalized text insights about the user's listening habits.

## Future Enhancements

- Integration with Last.fm API for additional music data
- Advanced A/B testing framework for feature optimization
- Mobile app version
- Social sharing capabilities
- Extended historical data analysis

## License

MIT