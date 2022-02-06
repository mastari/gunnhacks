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
const { createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent, resetRound, bet, smallBlind, bigBlind } = require("./poker");

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

const PORT = process.env.PORT ?? 3000
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});
