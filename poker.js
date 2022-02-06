const smallBlind = 10;
const bigBlind = smallBlind * 2;

function createGame(firstUser) {
  var deck = createDeck();
  shuffleDeck(deck);

  // Setup center cards
  let communityCards = [];
  communityCards.push(deck.pop());
  communityCards.push(deck.pop());
  communityCards.push(deck.pop());

  // Money
  let bets = {};
  let pot = 0;
  let balances = {}
  let currentBet = 0;

  // Actions
  let foldedUsers = [];
  let wentUsers = [];
  let users = [];
  let hands = {};
  let bettingRound = 0;
  let lastRaise = {userId: "", actionNum: 0};
  let actionNum = 0;
  let smallBlindUser = firstUser;

  // Must set these
  let bigBlindUser = "";
  let currentUser = smallBlindUser;

  return {deck, communityCards, pot, bets, balances, foldedUsers, currentBet, wentUsers, users, hands, bettingRound, lastRaise, actionNum, currentUser, smallBlindUser, bigBlindUser};
}

function createDeck() {
  let deck = [];
  for (let num = 0; num < 13; num++) {
    for (let suit = 0; suit < 4; suit++) {
      deck.push({
        num, suit
      });
    }
  }
  return deck;
}

// Shuffle in place
function shuffleDeck(deck) {
  let ci = deck.length;
  let ri;

  while (ci != 0) {
    ri = Math.floor(Math.random() * ci);
    ci--;

    [deck[ci], deck[ri]] = [deck[ri], deck[ci]];
  }
}

function dealNCards(deck, n) {
  let cards = [];
  for (let i = 0; i < n; i++) {
    cards.push(deck.pop());
  }
  return cards;
}

function printGame(game) {
  let {deck, hands, smallBlindUser, communityCards, ...stuff} = game;
  console.log(stuff)
}

// Check if all users have gone
function isRoundOver(game, currentUser) {
  return game.lastRaise.userId == currentUser && game.lastRaise.actionNum != game.actionNum;
}

function everyoneWent(game) {
  return game.users.every(u => game.wentUsers.includes(u));
}

// Assume amt >= currentBet
function bet(game, userId, amt) {
  game.balances[userId] -= amt;
  game.bets[userId] += amt;
  game.currentBet = game.bets[userId];
  game.pot += amt;
}

function resetGame(game) {
  game.deck = createDeck();
  shuffleDeck(game.deck);

  game.bets = {};
  game.pot = 0;
  game.foldedUsers = [];
  game.currentBet = 0;
  game.wentUsers = [];
  game.bettingRound = 0;

  // Choose new small blind
  let idx = game.users.indexOf(game.smallBlindUser)+1;
  if (idx >= game.users.length) idx = 0;

  game.smallBlindUser = game.users[idx];
  game.currentUser = game.smallBlindUser;

  game.hands = {};
  for (let user of game.users) {
    game.hands[user] = dealNCards(game.deck, 2);
  }
  game.communityCards = dealNCards(game.deck, 3);
}

function resetRound(game) {
  game.currentBet = 0;
  game.wentUsers = [];
  game.actionNum = 0;
  game.bettingRound++;
  game.bets = {};

  //TODO: choose small blind user for next turn
  game.currentUser = game.smallBlindUser;
  if (game.bettingRound > 1) {
    game.communityCards.push(game.deck.pop());
  }
}

module.exports = {createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent, resetRound, bet, smallBlind, bigBlind};
