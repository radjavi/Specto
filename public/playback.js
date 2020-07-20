window.onSpotifyWebPlaybackSDKReady = () => {
  const token = 'BQBRbeuDRjLt3fQIcn2ER6jimUHsyEWpLgmQjr21CvmIi66GK-k3dOxXQYG5MC95qs6tRcEQXRQAIBwJ7PX4ZTZ9-5AQUhEyNRyBEDjVEEngO-HoSYQAsevFm8PyK822hx7WfvkGeGFRbAAi_VAN6KhGx0jbxKgIZpdq';
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
  player.addListener('player_state_changed', state => { console.log(state); });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};