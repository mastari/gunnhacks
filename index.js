// Setup config, access with process.env.<variable>
require("dotenv").config();

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));
app.use(express.static("views"));

// Poker
const { createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent, resetRound, bet } = require("./poker");

app.get('/', (req, res) => {
  res.sendFile("index.html");
});

const games = {};

// Poker page
io.of("/").on("connection", (socket) => {
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
  socket.emit("deal", {clientHand});

  game.balances[userId] = 1000;
  game.bets[userId] = 0;
  game.hands[userId] = clientHand;
  game.users.push(userId);

  socket.on("action", (action) => {

    if (userId != game.currentUser) {
      console.log("Not your turn!", userId)
      return
    };

    if (game.wentUsers.includes(userId) || game.foldedUsers.includes(userId)) return;
    game.wentUsers.push(userId);
    game.actionNum++;

    if (!(userId in game.bets)) game.bets[userId] = 0

    if (action == "fold") {
      game.foldedUsers.push(userId)
    } else if (action == "call") {
      let amt = game.currentBet - game.bets[userId];
      console.log(amt)
      bet(game, userId, amt);
    } else if (action == "raise") {
      bet(game, userId, 100)
      game.lastRaise = {
        userId, actionNum: game.actionNum
      };
    } else if (action == "check") {
      // Do nothing
    } else if (action == "bet") {
      // bet x amount
      // TODO: make this custom
      let amt = 100;
      bet(game, userId, amt);
    }

    printGame(game);
    game.currentUser = game.users[game.users.indexOf(game.currentUser)+1]

    if (everyoneWent(game)) {
      game.wentUsers = [];
      game.currentUser = game.startingUser;
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
      }
    }
  })
});

const PORT = process.env.PORT ?? 3000
server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});
