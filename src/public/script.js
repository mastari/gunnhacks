
var deck;
var bettingRound;
var players = [];
var balances;
var pot;
var clientAction;
var buttons;
var communityCards = [];
var hand = [];

var userId = getCookie("userId");
var roomId = getCookie("roomId")
var socket = io.connect("/play", {
  query: {roomId, userId }
});
players.push(userId);


const actions = ["fold", "call", "raise", "check", "bet"];

// Setup
function setup() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  let canvas = createCanvas(w, h);

  buttons = []
  for (let i in actions) {
    let action = actions[i];
    let actionCallback = () => socket.emit("action", action);
    buttons.push(new Button(
      i * 60, 50, 50, 50, action, actionCallback
    ));
  }
}

// Main loop
function draw() {
  clear();

  for (let b of buttons) {
    b.tick();
    b.render();
  }

  text("Community Cards", 100, 180)
  for (let i in communityCards) {
    let c = communityCards[i];
    drawCard({number: c.num, revealed: true, suit: c.suit}, 100*i, 200)
  }

  text("Your hand", 250, 350)
  for (let i in hand) {
    let c = hand[i];
    drawCard({number: c.num, revealed: true, suit: c.suit}, 100*i, 300)
  }

  textAlign(LEFT)
  text("Players", 200, 480)
  for (let i in players) {
    let p = players[i];
    text(p, 200, 500 + 20*i);
  }
}

// Websocket events
socket.on("deal", data => {
  let { clientHand } = data;
  console.clear();
  console.log(clientHand);
  hand = clientHand;
})

socket.on("action", data => {
  let {action, bets, currentUser} = data;
  console.log(action)
  console.log(bets)
  console.log(currentUser)
})

socket.on("relogin", () => {
  location.href = "";
  console.log("RELOG!", userId)
})

socket.on("matchmaking", () => {
  location.href = "/match"
})

socket.on("updateInfo", ({users, communityCards: cc}) => {
  console.log("update info")
  communityCards = cc;
  players = users;
  console.log(communityCards)
})

socket.on("newUser", ({userId}) => {
  players.push(userId);
})

// Get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
