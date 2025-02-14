import React from 'react'

const handleSpotifyLogin = () =>{
    window.location.href = 'http://localhost:8000/login'
}

const Login = () => {
  return (
    <div>
        <button onClick={handleSpotifyLogin}>
            Login With Spotify
        </button>
    </div>
  )
}

export default Login