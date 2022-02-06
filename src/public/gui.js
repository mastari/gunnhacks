
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
