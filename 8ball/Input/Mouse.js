"use strict";

function MouseHandler() {
    this.left = new ButtonState();
    this.middle = new ButtonState();
    this.right = new ButtonState();
    this.position = new Vector2();
    
    document.onmousemove = this.handleMouseMove.bind(this);
    document.onmousedown = this.handleMouseDown.bind(this);
    document.onmouseup = this.handleMouseUp.bind(this);
}

MouseHandler.prototype.handleMouseMove = function(e) {
    let x = e.pageX;
    let y = e.pageY;
    
    // Adjust for canvas position if needed
    // But usually simple PageX/Y works if canvas is full screen
    this.position = new Vector2(x, y);
};

MouseHandler.prototype.handleMouseDown = function(e) {
    if (e.which === 1) {
        this.left.down = true;
        this.left.pressed = true;
    } else if (e.which === 2) {
        this.middle.down = true;
        this.middle.pressed = true;
    } else if (e.which === 3) {
        this.right.down = true;
        this.right.pressed = true;
    }
};

MouseHandler.prototype.handleMouseUp = function(e) {
    if (e.which === 1) {
        this.left.down = false;
    } else if (e.which === 2) {
        this.middle.down = false;
    } else if (e.which === 3) {
        this.right.down = false;
    }
};

MouseHandler.prototype.reset = function() {
    this.left.pressed = false;
    this.middle.pressed = false;
    this.right.pressed = false;
};

let Mouse = new MouseHandler();