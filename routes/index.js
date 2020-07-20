var express = require('express')
var router = express.Router()

router.get('/', (req, res) => {
  const access_token = req.session.access_token;
  if (access_token) {
    res.render('player', { access_token })
  } else {
    res.render('login')
  }
})

module.exports = router