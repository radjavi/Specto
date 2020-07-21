let current_track_uri = ""

const initSpotifyPlayer = token => {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: 'Specto',
      getOAuthToken: cb => { cb(token); }
    });
  
    // Error handling
    player.on('initialization_error', ({ message }) => { console.error(message); });
    player.on('authentication_error', ({ message }) => { console.error(message); });
    player.on('account_error', ({ message }) => { console.error(message); });
    player.on('playback_error', ({ message }) => { console.error(message); });
  
    // Playback status updates
    player.on('player_state_changed', state => { 
      console.log(state); 
      updateUI(state);
    });
  
    // Ready
    player.on('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });
  
    // Not Ready
    player.on('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });
  
    // Connect to the player!
    player.connect();
  };
}

const updateUI = state => {
  if (!state) { 
    current_track_uri = "";
    $("#track_name").fadeOut(200);
    $("#track_artist").fadeOut(200);
    $("#track_img").fadeOut(200);
    return; 
  }

  if (state.track_window.current_track.uri != current_track_uri) {
    current_track_uri = state.track_window.current_track.uri

    $("#track_name").fadeOut(200, () => {
      $("#track_name").text(state.track_window.current_track.name)
      $("#track_name").fadeIn(200);
    })

    $("#track_artist").fadeOut(200, () => {
      $("#track_artist").text(state.track_window.current_track.artists[0].name)
      $("#track_artist").fadeIn(200);
    })
    
    $("#track_img").fadeOut(200, () => {
      $("#track_img").attr('src', state.track_window.current_track.album.images[0].url)
      $("#track_img").fadeIn(1000);
    })
  }
}