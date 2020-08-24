class Track {
  constructor(id, position, duration, timestamp) {
    this.id = id;
    this.position = position;
    this.duration = duration;
    this.timestamp = timestamp;
    getTrackFeatures(id)
      .then(res => this.features = res)
      .catch(err => console.error(err));
    getTrackAnalysis(id)
      .then(res => {
        this.analysis = res;
        this.interpolation = {
          beat: createInterpolationFromAnalysis(res.beats),
          segment: createInterpolationFromAnalysis(res.segments),
        }
      })
      .catch(err => console.error(err));
  }
}

let player;
let current_state;
let current_track;

window.onSpotifyWebPlaybackSDKReady = () => {
  player = new Spotify.Player({
    name: 'Specto',
    getOAuthToken: cb => {
      getFreshAccessToken()
        .then(token => cb(token))
        .catch(err => console.error(err))
    }
  });

  // Error handling
  player.on('initialization_error', ({ message }) => { console.error(message); });
  player.on('authentication_error', ({ message }) => { console.error(message); });
  player.on('account_error', ({ message }) => { console.error(message); });
  player.on('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  player.on('player_state_changed', state => {
    //console.log(state);
    updateState(state);
  });

  // Ready
  player.on('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    setInfo("Open Spotify and play on device 'Specto'.");
  });

  // Not Ready
  player.on('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};

function updateState(state) {
  current_state = state;
  if (state) {
    if (!current_track || current_state.track_window.current_track.id !== current_track.id) {
      current_track = undefined;
      current_track = new Track(
        current_state.track_window.current_track.id,
        current_state.position,
        current_state.duration,
        current_state.timestamp
      );
      setViewFromState(current_state);
    } else {
      current_track.position = current_state.position;
      current_track.timestamp = current_state.timestamp;
    }
  } else {
    current_track = null;
    setInitialView();
  }
}

function updateStatePeriodic() {
  //console.log("updateStatePeriodic()");
  const period = 5000;
  if (current_state && !current_state.paused) {
    if (Date.now() - current_track.timestamp >= period) {
      //console.log("Updating state periodic");
      player.getCurrentState().then(state => updateState(state));
    }
  }
  setTimeout(updateStatePeriodic, 1000);
}
updateStatePeriodic();

function setInitialView() {
  $("#track_name").fadeOut(200, () => {
    $("#track_name").text("")
    $("#track_name").fadeIn(200);
  })
  $("#track_artist").fadeOut(200, () => {
    $("#track_artist").text("");
    $("#track_artist").fadeIn(200);
  });
}

function setViewFromState(state) {
  $("#track_name").fadeOut(200, () => {
    $("#track_name").text(state.track_window.current_track.name)
    $("#track_name").fadeIn(200);
  })

  $("#track_artist").fadeOut(200, () => {
    $("#track_artist").text(state.track_window.current_track.artists[0].name)
    $("#track_artist").fadeIn(200);
  })
}

function setInfo(info) {
  $("#track_name").fadeOut(200, () => {
    $("#track_name").text("")
    $("#track_name").fadeIn(200);
  })
  $("#track_artist").fadeOut(200, () => {
    $("#track_artist").text(info);
    $("#track_artist").fadeIn(200);
  });
}

function getTrackFeatures(id) {
  return new Promise((resolve, reject) => {
    $.get(`spotify/track/features/${id}`)
      .done(data => resolve(data.body))
      .fail(err => reject(err));
  });
}

function getTrackAnalysis(id) {
  return new Promise((resolve, reject) => {
    $.get(`spotify/track/analysis/${id}`)
      .done(data => resolve(data.body))
      .fail(err => reject(err));
  });
}

function getFreshAccessToken() {
  return new Promise((resolve, reject) => {
    $.get(`spotify/fresh-access-token`)
      .done(token => resolve(token))
      .fail(err => reject(err))
  });
}