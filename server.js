require('dotenv').config()
const express = require('express');
const session = require('express-session');
const app = express();

const PORT = process.env.PORT || 3000

app.set("view engine", "pug");
app.use(express.static('public'))
app.set("trust proxy", 1);
app.use(
  session({
    resave: true,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    maxAge: 60000 * 1
  })
);

// Routes
const index = require('./routes/index');
const spotify = require('./routes/spotify');

app.use('/', index)
app.use('/spotify', spotify)

app.listen(PORT, () => {
  console.log(`Specto running at http://localhost:${PORT}`)
})