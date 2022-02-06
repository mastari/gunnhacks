
function createGame() {
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

  return {deck, communityCards, pot, bets, balances, foldedUsers, currentBet, wentUsers, users, hands, bettingRound, lastRaise, actionNum};
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
  let {deck, ...stuff} = game;
  console.log(stuff)
}

// Check if all users have gone
function isRoundOver(game, currentUser) {
  return game.lastRaise.userId == currentUser && game.lastRaise.actionNum != game.actionNum;
}

function everyoneWent(game) {
  return game.users.every(u => game.wentUsers.includes(u));
}

function resetGame(game) {
  game.bets = {};
  game.pot = 0;
  game.communityCards = [];
  game.foldedUsers = [];
  game.currentBet = 0;
  game.wentUsers = [];
  game.bettingRound = 0;

  game.hands = {};
  for (let user of game.users) {
    game.hands[user] = dealNCards(game.deck, 2);
  }
}

module.exports = {createGame, dealNCards, printGame, isRoundOver, resetGame, everyoneWent};
