// Setup config, access with process.env.<variable>
require("dotenv").config();

const express = require('express');
const mongoose = require("mongoose");
const path = require("path")

const identify = require("./batch_algorithm")

const app = express();
const port = 3000;

const { auth } = require('express-openid-connect');

const auth0_config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.ARIS_SUPER_SAUCY_SECRET,
  baseURL: 'http://localhost:3000',
  clientID: 'rzdw84N2gPM1wIoh7X6dnt4DumVNjK55',
  issuerBaseURL: 'https://dev-7uqc1ijz.us.auth0.com',
};

//* auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(auth0_config));

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);


app.get('/', (req, res) => {
  res.sendFile(req.oidc.isAuthenticated() ? path.join(__dirname, '/public/play.html') : path.join(__dirname, '/public/welcome.html'));
  console.log(identify.identify_batch(['hey', 'hey']))
  //! Homepage here: Click to login, # stating how many matches are currently in session
})

app.get('/match', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "please join a match" : "please login");
})

app.get('/batch', (req, res) => {
  res.send(identify.identify_batch('af'));
})

app.use(express.static(__dirname + "/public"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
