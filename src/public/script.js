var deck;
var bettingRound;
var players;
var balances;
var pot;
var clientAction;
var buttons;

var userId = getCookie("userId");
var socket = io.connect("/play", {
  query: {roomId: 123, userId }
});


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
}

// Websocket events
socket.on("deal", data => {
  let { clientHand } = data;
  console.clear();
  console.log(clientHand);
})

socket.on("action", data => {
  let {action, bets, currentUser} = data;
  console.log(action)
  console.log(bets)
  console.log(currentUser)
})

socket.on("relogin", () => {
  // location.href = "";
  console.log("RELOG!", userId)
})

// Get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
