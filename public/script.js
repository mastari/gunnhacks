var deck;
var bettingRound;
var players;
var balances;
var pot;
var clientAction;

var socket = io.connect("/", {
  query: "roomId=123"
});

// Action
function setupAction(action) {
  let actionButton = document.getElementById(action);
  actionButton.addEventListener("click", () => {
    socket.emit("action", action);
  })
}

let actions = ["fold", "call", "raise", "check", "bet"];
actions.forEach(setupAction);


// Setup
function setup() {
  let canvas = createCanvas(500, 500);

}

// Main loop
function draw() {
  clear();

  fill("black")
  rect(100, 100, 100, 100);
}

socket.on("deal", data => {
  let { clientHand, userId } = data;
  console.clear();
  console.log(userId)
  console.log(clientHand);
})
