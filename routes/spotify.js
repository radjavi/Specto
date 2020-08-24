const express = require('express')
const crypto = require("crypto");
const SpotifyWebApi = require('spotify-web-api-node');
let router = express.Router()

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});
const scopes = [["streaming", "user-read-email", "user-read-private"]];
const showDialog = false;

router.get('/authorize', (req, res) => {
  let state = crypto.randomBytes(12).toString("hex");
  req.session.state = state;
  let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog);
  res.redirect(authorizeURL);
})

router.get('/callback', (req, res) => {
  if (req.session.state !== req.query.state) {
    res.sendStatus(401);
  }
  let authorizationCode = req.query.code;
  spotifyApi.authorizationCodeGrant(authorizationCode).then(
    data => {
      req.session.access_token_expires = Date.now() + data.body["expires_in"] * 1e3;
      req.session.access_token = data.body["access_token"];
      req.session.refresh_token = data.body["refresh_token"];
      res.redirect("/");
    },
    error => {
      console.error(
        "Something went wrong when retrieving the access token!",
        error.message
      );
    }
  );
})

router.get('/track/features/:id', (req, res) => {
  if (!req.session.access_token) {
    res.sendStatus(401);
    return;
  }
  let loggedInSpotifyApi = new SpotifyWebApi({ accessToken: req.session.access_token });
  loggedInSpotifyApi.getAudioFeaturesForTrack(req.params.id)
    .then(data => {
      res.json(data);
    }, err => {
      console.error(err);
      res.status(500).send(err);
    });
})

router.get('/track/analysis/:id', (req, res) => {
  if (!req.session.access_token) {
    res.sendStatus(401);
    return;
  }
  let loggedInSpotifyApi = new SpotifyWebApi({ accessToken: req.session.access_token });
  loggedInSpotifyApi.getAudioAnalysisForTrack(req.params.id)
    .then(data => {
      res.json(data);
    }, err => {
      console.error(err);
      res.status(500).send(err);
    });
})

router.get('/fresh-access-token', (req, res) => {
  if (req.session.refresh_token && Date.now() >= req.session.access_token_expires - 15 * 60 * 1e3) {
    let refreshableSpotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: req.session.refresh_token,
    });
    refreshableSpotifyApi.refreshAccessToken()
      .then(data => {
        req.session.access_token_expires = Date.now() + data.body["expires_in"] * 1e3;
        req.session.access_token = data.body["access_token"];
        //console.log("Refreshed access token");
        res.send(data.body["access_token"]);
      })
      .catch(err => {
        //console.log("Could not refresh token:", err);
        res.status(500).send(err);
      })
  } else if (req.session.access_token) {
    res.send(req.session.access_token);
  } else {
    res.sendStatus(401);
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

module.exports = router