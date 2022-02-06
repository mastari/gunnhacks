
class Button {
  constructor(x, y, w, h, text, fn) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fn = fn;
    this.text = text;
    this.clicked = false;
  }

  mouseCollision() {
    return mouseX >= this.x && mouseX <= this.x + this.w && mouseY >= this.y && mouseY <= this.y + this.h
  }

  tick() {
    if (!this.mouseCollision()) return
    if (mouseIsPressed && !this.clicked) {
      this.clicked = true;
      // callback
      this.fn();
      console.log("calling function!")
    } else if (!mouseIsPressed && this.clicked) {
      this.clicked = false;
    }
  }

  render() {
    fill(125, 124, 0);
    rect(this.x, this.y, this.w, this.h);
    fill(0, 0, 0);
    textAlign(CENTER, CENTER);
    // Capitalize the first letter
    let str = this.text[0].toUpperCase() + this.text.slice(1);
    text(str, this.x+this.w/2, this.y+this.h/2);
  }
}

var cardWidth = 50;
var cardHeight = 70;

function getSuit(card) {
    return {
        0: "D",
        1: "C",
        2: "H",
        3: "S"
    }[card.suit]
}

function drawCard(card, x, y) {
    if (card.revealed || keyIsDown(32) && card.number) {
        fill('azure')
        rect(x, y, cardWidth, cardHeight);

        fill('black')
        if (["D", "H"].includes(getSuit(card))) {
            fill("red")
        }
        textSize(16);
        textAlign(LEFT, BASELINE);
        text(enLang(card), x + 2, y + 15)
        textAlign(RIGHT, BASELINE);
        text(enLang(card), x + 48, y + 68)

        let suit = getSuit(card);
        noStroke()
        if (suit == "D") {
            fill("red")
            push();
            translate(x + 25, y + 20);
            rotate(PI / 4)
            rect(0, 0, 20, 20)
            pop();
        } else if (suit == "C") {
            fill("black")
            push()
            translate(x + 25, y + 20);
            rect(-3, 8, 6, 20)
            ellipse(0, 5, 15, 15);
            ellipse(-8, 15, 15, 15);
            ellipse(8, 15, 15, 15);
            pop();
        } else if (suit == "H") {
            fill("red")
            push();
            translate(x + 25, y + 25);
            ellipse(-8, 7, 20, 20);
            ellipse(8, 7, 20, 20);
            rotate(PI / 4)
            rect(1, 1, 20, 20)
            pop()
        } else if (suit == "S") {
            fill("black")
            push();
            translate(x + 25, y + 15);
            ellipse(-8, 20, 18, 18);
            ellipse(8, 20, 18, 18);
            rect(-3, 20, 6, 15)
            rotate(PI / 4)
            rect(0, 0, 20, 20)
            pop()
        }
        stroke("black")
    } else {
        fill('lightblue')
        rect(x, y, 50, 70);
    }
}
function enLang(card) {
    return {
        1: "A",
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        11: "J",
        12: "Q",
        13: "K"
    }[card.number+1];
}
