// Setup config, access with process.env.<variable>
import dotenv from "dotenv"
dotenv.config();

import { auth } from 'express-openid-connect'
import express from 'express';
import mongoose from "mongoose";
import path from "path"
import http from "http";
import { Server } from "socket.io";

import { getWinners } from "./batch_algorithm.js";
import cookieParser from "cookie-parser";

import { createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent, resetRound, bet, smallBlind, bigBlind, getGamePlayers, removeUserFromGame } from "./poker.js";
import { User } from "./schema/user.js";
import { Game } from "./schema/game.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = path.resolve();

const auth0_config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASEURL,
  clientID: process.env.AUTH0_CLIENTID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASEURL,
  clientSecret: process.env.CLIENT_SECRET,
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile'
  }
};

//* auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(auth0_config));
app.use("/", express.static("src/public"));
app.use("/", express.static("src/views"));
app.use(cookieParser())

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

app.get('/', async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Make user
    let userId = req.oidc.user.sub;
    let user = await User.findOne({userId})
    console.log("user", user)
    if (!user) {
      let user = new User({username: req.oidc.user.name, userId, wins: []});
      await user.save();
    }

    res.redirect("/match")
  } else {
    res.sendFile(path.join(__dirname, "src", "views", "welcome.html"));
  }
  // Homepage here: Click to login, # stating how many matches are currently in session
})

app.get('/match', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Matchmaking
    if (currentMatchpool == "") {
      // Make new match
      let matchnum = Math.floor(Math.random() * 1000);
      let game = createGame(req.oidc.user.sub);
      games[matchnum] = game;
      currentMatchpool = matchnum

      res.redirect("/play/"+matchnum);
    } else {
      let currentGame = games[currentMatchpool];
      if (getGamePlayers(currentGame) >= 5) {
        res.redirect("/play/"+currentMatchpool)
        currentMatchpool = "";
      } else {
        res.redirect("/play/"+currentMatchpool)
      }
    }
  } else {
    // must log in
    res.redirect("/");
  }
})

app.get('/batch', async (req, res) => {
  let hands = {
    2345: [{ num: 11, suit: 0 }, { num: 12, suit: 0 }],
    6789: [{ num: 3, suit: 2 }, { num: 4, suit: 2 }]
  };
  let communityCards = [{ num: 5, suit: 3 }, { num: 6, suit: 3 }, { num: 7, suit: 3 }, { num: 3, suit: 3 }, { num: 11, suit: 3 }];
  let result = await getWinners(hands, communityCards);
  res.send(result);
})

const PORT = process.env.PORT ?? 3000
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

app.get('/play/:id', (req, res) => {
  // tell user who they are
  res.cookie("userId", req.oidc.user.sub);
  res.cookie("roomId", req.params.id);
  res.sendFile(path.join(__dirname, "src", "views", "game.html"));
});

// Poker matches
var currentMatchpool = "";
const games = {};

// Poker game ws
io.of("/play").on("connection", async (socket) => {
  let {roomId, userId} = socket.handshake.query;
  socket.join(roomId);
  // Cookie encodes userId, so decode it
  userId = decodeURI(userId);
  let smallId = userId.split("|")[1]

  console.log(`User joined ${roomId}: ${smallId}`)

  // Get user
  let user = await User.findOne({userId});
  if (!user) {
    // Can't play without being logged in!
    console.log("must log in!")
    socket.emit("relogin");
    return
  }

  // Game should already exist
  if (!(roomId in games)) {
    console.log("invalid match")
    socket.emit("matchmaking");
    return
  }
  var game = games[roomId];

  let clientHand = dealNCards(game.deck, 2);
  socket.emit("deal", {clientHand});

  game.users.push(userId);
  // Player rejoins: keep balance
  if (!game.allUsers.includes(userId)) {
    game.allUsers.push(userId)
    game.balances[userId] = 1000;
    game.bets[userId] = 0;
    game.hands[userId] = clientHand;
  } else {
    game.foldedUsers.push(userId);
  }

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

  socket.on("action", async (action) => {
    if (userId != game.currentUser) {
      console.log("Not your turn!", userId)
      return
    };

    if (game.wentUsers.includes(userId) || game.foldedUsers.includes(userId)) {
      console.log("Folded or went already!!!")
      return
    };

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

    // Set next current user
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
        let winners = await getWinners(game.hands, game.communityCards);
        console.log("winner!!!!", winners);
        console.log(game)

        if (winners.length == 1) {
          game.balances[winner] += game.pot;
        } else if (winners.length == 2) {
          // Split pot if multiple winners
          winners.forEach(winner => {
            game.balances[winner] += Math.floor(game.pot/winners.length);
          });
        }
        // TODO: Record winner
        recordWinners(winners)
        resetGame(game);
      }
    } else {
      game.actionNum++;
    }
  })

  // Remove data on disconnect
  socket.on("disconnect", () => {
    removeUserFromGame(game, userId);
    if (getGamePlayers(game) == 0) {
      delete games[roomId];
    }
    console.log(games)
  })
});

async function recordWinners(gameObj, winners) {
  //! Untested
  let winnerObjs = await User.find({
    'userId': {
      $in: winners
    }
  });
  console.log(winnerObjs)
  let winnerIds = winnerObjs.map(w => w._id);
  let game = new Game({gameObj, winners: winnerIds})
  await game.save();

  await User.updateMany({_id: {$in: winnerIds}}, {$push: {wins: game._id}});
}
