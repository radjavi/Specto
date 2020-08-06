require('dotenv').config()
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session)
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
    cookie: { maxAge: 3600 * 1e3 },
    store: new MemoryStore({
      checkPeriod: 3600 * 1e3 // Prune expired entries every hour
    }),
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