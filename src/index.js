// Setup config, access with process.env.<variable>
import { config } from "dotenv"
config()

import { auth } from 'express-openid-connect'
import express from 'express';
import mongoose from "mongoose";
import path from "path"

import { identify_batch } from "./batch_algorithm.js";

const app = express();
const port = 3000;


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

let __dirname = path.resolve() + "/src/";


app.get('/', (req, res) => {
  res.sendFile(req.oidc.isAuthenticated() ? path.join(__dirname, '/public/play.html') : path.join(__dirname, '/public/welcome.html'));
  //! Homepage here: Click to login, # stating how many matches are currently in session
})

app.get('/match', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "please join a match" : "please login");
})

app.get('/batch', async (req, res) => {
  let result = await identify_batch([])
  res.send(result.winners);
})

app.use(express.static(__dirname + "/public"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
