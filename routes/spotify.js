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
      req.session.access_token = data.body["access_token"];
      spotifyApi.setAccessToken(data.body["access_token"]);
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

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

module.exports = router