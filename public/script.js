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
let actionButton = document.getElementById("actionButton");
let actionBox = document.getElementById("actionBox");
actionButton.addEventListener("click", () => {
  let action = actionBox.value;
  clientAction = action;
  socket.emit("action", action);
})


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
  console.clear();
  console.log(data)
})
