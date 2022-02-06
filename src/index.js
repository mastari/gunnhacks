// Setup config, access with process.env.<variable>
import { config } from "dotenv"
config()

import { auth } from 'express-openid-connect'
import express from 'express';
import mongoose from "mongoose";
import path from "path"
import http from "http";
import { Server } from "socket.io";

import { identify_batch } from "./batch_algorithm.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = path.resolve();

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
app.use("/", express.static("src/public"));
app.use("/", express.static("src/views"));

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // res.sendFile("play.html");
    res.redirect("/play")
  } else {
    res.sendFile(path.join(__dirname, "src", "views", "welcome.html"));
  }
  // Homepage here: Click to login, # stating how many matches are currently in session
})

app.get('/match', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "please join a match" : "please login");
})

app.get('/batch', async (req, res) => {
  let result = await identify_batch()
  res.send(result);
})

const PORT = process.env.PORT ?? 3000
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, "src", "views", "index.html"));
});


// Poker game
import { createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent, resetRound, bet, smallBlind, bigBlind } from "./poker.js";

const games = {};

// Poker page
io.of("/play").on("connection", (socket) => {
  let roomId = socket.handshake.query.roomId;
  socket.join(roomId);
  let userId = socket.id;
  console.log("roomId", roomId, userId)

  // Setup game
  var game;
  if (!(roomId in games)) {
    games[roomId] = createGame(userId)
  }
  game = games[roomId];

  let clientHand = dealNCards(game.deck, 2);
  socket.emit("deal", {clientHand, userId});

  game.balances[userId] = 1000;
  game.bets[userId] = 0;
  game.hands[userId] = clientHand;
  game.users.push(userId);

  // Set blind users
  if (game.smallBlindUser == userId) {
    bet(game, userId, smallBlind);
    game.actionNum++;
  } else if (game.bigBlindUser == "") {
    game.bigBlindUser = userId;
    bet(game, userId, bigBlind);
    game.actionNum++;
    // Small blind user starts if only 2 players
    game.currentUser = game.smallBlindUser;
    game.lastRaise = {userId, actionNum: game.actionNum};
  } else if (game.users.length == 3) {
    // Third player starts otherwise
    game.wentUsers.push(game.smallBlindUser);
    game.wentUsers.push(userId.bigBlindUser);
    game.currentUser = userId;
  }

  socket.on("action", (action) => {
    if (userId != game.currentUser) {
      console.log("Not your turn!", userId)
      return
    };

    if (game.wentUsers.includes(userId) || game.foldedUsers.includes(userId)) return;

    if (!(userId in game.bets)) game.bets[userId] = 0

    if (action == "fold") {
      // fold out of queue
      game.foldedUsers.push(userId)
    } else if (action == "call") {
      if (game.actionNum == 0) {
        console.log("ERROR: Can't call on first betting round after preflop!")
      }
      // Bet current bet
      let amt = game.currentBet - game.bets[userId];
      bet(game, userId, amt);
    } else if (action == "raise") {
      if (game.actionNum == 0) {
        console.log("ERROR: Can't call on first betting round after preflop!")
      }
      bet(game, userId, 100)
      game.lastRaise = {userId, actionNum: game.actionNum};
    } else if (action == "check") {
      // Do nothing
      if (game.actionNum != 0) {
        console.log("ERROR: Can only check on first betting round!!")
        return
      }
    } else if (action == "bet") {
      if (game.actionNum != 0) {
        console.log("ERROR: Can only bet on first betting round!!")
        return
      }
      // bet x amount
      // TODO: make this custom
      let amt = 100;
      bet(game, userId, amt);
      game.lastRaise = {userId, actionNum: game.actionNum};
    }


    game.wentUsers.push(userId);
    console.log(action)
    printGame(game);

    socket.to(roomId).emit("action", {action, bets: game.bets, currentUser: game.currentUser})

    // Set current user
    game.currentUser = game.users[game.users.indexOf(game.currentUser)+1]
    if (everyoneWent(game)) {
      game.wentUsers = [];
      game.currentUser = game.smallBlindUser;
    }

    if (isRoundOver(game, userId)) {
      resetRound(game);
      console.log("NEXT ROUND!!")

      if (game.bettingRound == 3) {
        // Winner takes all!
        // let winner = getWinner(game.hands, game.communityCards);
        let winner = Object.keys(game.hands)[0];
        game.balances[winner] += game.pot;
        console.log("winner!!!!", winner, game.balances[winner]);
        // TODO: Record winner
        resetGame(game);
        console.log(game)
      }
    } else {
      game.actionNum++;
    }
  })
});
