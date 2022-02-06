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
const { createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent } = require("./poker");

app.get('/', (req, res) => {
  res.sendFile("index.html");
});

const games = {};

// Poker page
io.of("/").on("connection", (socket) => {
  let roomId = socket.handshake.query.roomId;
  socket.join(roomId);
  console.log("roomId", roomId)

  // Setup game
  var game;
  if (!(roomId in games)) {
    games[roomId] = createGame()
  }
  game = games[roomId];

  let clientHand = dealNCards(game.deck, 2);
  socket.emit("deal", {clientHand});
  let userId = socket.id;

  game.balances[userId] = 1000;
  game.bets[userId] = 0;
  game.hands[userId] = clientHand;
  game.users.push(userId);

  socket.on("action", (action) => {
    if (game.wentUsers.includes(userId)) return;
    game.wentUsers.push(userId);
    game.actionNum++;

    if (action == "fold") {
      game.foldedUsers.push(userId)
    } else if (action == "call") {
      let amt = game.currentBet - game.bets[userId];
      game.balances[userId] -= amt;
      game.bets[userId] += amt;
      game.pot += amt;
    } else if (action == "raise") {
      game.currentBet += 100;
      game.balances[userId] -= game.currentBet;
      game.bets[userId] = game.currentBet;
      game.pot += game.currentBet;
      game.lastRaise = {
        userId, actionNum: game.actionNum
      };
    }

    printGame(game);

    if (everyoneWent(game)) {
      game.wentUsers = [];
    }

    if (isRoundOver(game, userId)) {
      game.communityCards.push(game.deck.pop());
      game.currentBet = 0;
      game.wentUsers = [];
      game.bettingRound++;
      game.actionNum = 0;

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
