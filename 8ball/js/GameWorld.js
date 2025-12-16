"use strict";

const BALL_SIZE = 38;
const TABLE_W = 1500;
const TABLE_H = 825;

function GameWorld(savedState, myPlayerIndex) {
    this.balls = [];
    this.whiteBall = null;
    this.rules = new GameRules();
    this.stick = null;
    this.feedbackMessage = null; 
    this.isPlacingWhiteBall = false;
    this.myPlayerIndex = (typeof myPlayerIndex !== 'undefined') ? myPlayerIndex : 0; 

    this.table = {
        TopY: 57, RightX: 1443, BottomY: 768, LeftX: 57
    };
    
    if (savedState && savedState.balls) {
        this.loadState(savedState);
    } else {
        this.initNewGame();
    }
}

GameWorld.prototype.initNewGame = function() {
    let startX = 1090;
    let startY = 413;
    let rowX = BALL_SIZE * Math.cos(Math.PI/6) + 2; 
    let rowY = BALL_SIZE/2 + 2;

    this.balls = [];
    this.whiteBall = new Ball(new Vector2(413, 413), COLOR.WHITE);
    this.balls.push(this.whiteBall);

    // Row 1
    this.balls.push(new Ball(new Vector2(startX, startY), COLOR.RED));
    // Row 2
    this.balls.push(new Ball(new Vector2(startX + rowX, startY - rowY), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX, startY + rowY), COLOR.RED));
    // Row 3 (8-Ball)
    this.balls.push(new Ball(new Vector2(startX + rowX*2, startY - rowY*2), COLOR.RED));
    this.balls.push(new Ball(new Vector2(startX + rowX*2, startY), COLOR.BLACK));
    this.balls.push(new Ball(new Vector2(startX + rowX*2, startY + rowY*2), COLOR.YELLOW));
    // Row 4
    this.balls.push(new Ball(new Vector2(startX + rowX*3, startY - rowY*3), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX*3, startY - rowY), COLOR.RED));
    this.balls.push(new Ball(new Vector2(startX + rowX*3, startY + rowY), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX*3, startY + rowY*3), COLOR.RED));
    // Row 5
    this.balls.push(new Ball(new Vector2(startX + rowX*4, startY - rowY*4), COLOR.RED));
    this.balls.push(new Ball(new Vector2(startX + rowX*4, startY - rowY*2), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX*4, startY), COLOR.RED));
    this.balls.push(new Ball(new Vector2(startX + rowX*4, startY + rowY*2), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX*4, startY + rowY*4), COLOR.YELLOW));

    this.stick = new Stick(this.whiteBall.position, this.shoot.bind(this), this.balls, true);
};

GameWorld.prototype.handleInput = function(delta) {
    if (this.rules.turn !== this.myPlayerIndex) return; 

    if (this.isPlacingWhiteBall) {
        this.whiteBall.position = Mouse.position.copy();
        // Clamp
        if(this.whiteBall.position.x < 60) this.whiteBall.position.x = 60;
        if(this.whiteBall.position.x > 1440) this.whiteBall.position.x = 1440;
        if(this.whiteBall.position.y < 60) this.whiteBall.position.y = 60;
        if(this.whiteBall.position.y > 765) this.whiteBall.position.y = 765;

        if(Mouse.left.pressed && !this.checkOverlap(this.whiteBall)) {
            this.isPlacingWhiteBall = false;
            this.stick.reposition(this.whiteBall.position);
        }
    } else {
        this.stick.update();
    }
};

GameWorld.prototype.update = function(delta) {
    for(let i=0; i<this.balls.length; i++) {
        for(let j=i+1; j<this.balls.length; j++) {
            if (this.isPlacingWhiteBall && (this.balls[i] === this.whiteBall || this.balls[j] === this.whiteBall)) continue; 
            this.handleCollision(this.balls[i], this.balls[j]);
        }
        this.balls[i].collideWithTable(this.table);
        this.balls[i].update(delta);

        if(this.isInsideHole(this.balls[i].position)) {
            this.rules.recordPocketed(this.balls[i].color);
            if(this.balls[i].color === COLOR.WHITE) {
                this.balls[i].velocity = new Vector2();
                this.balls[i].position = new Vector2(-1000, -1000);
            } else {
                this.balls.splice(i, 1);
                i--;
            }
        }
    }

    if(this.stick.shot && !this.ballsMoving()) {
        this.resolveTurn();
    }
};

GameWorld.prototype.resolveTurn = function() {
    this.stick.shot = false;
    let reds = this.balls.filter(b => b.color === COLOR.RED).length;
    let yellows = this.balls.filter(b => b.color === COLOR.YELLOW).length;
    let result = this.rules.processTurn(this.rules.turn, reds, yellows);

    if (result.gameOver) this.feedbackMessage = result.winner ? "VICTORY!" : "DEFEAT";
    else if (result.foul) this.feedbackMessage = result.message || "FOUL!";
    else if (!result.nextTurn) this.feedbackMessage = "Turn Ended";

    if (!result.gameOver) {
        if (result.foul) {
            if (this.whiteBall.position.x < 0) {
                this.whiteBall.position = new Vector2(413, 413);
                this.whiteBall.velocity = new Vector2();
            }
            this.isPlacingWhiteBall = true;
        }
        if (!result.nextTurn) {
            this.rules.turn = 1 - this.rules.turn;
            this.rules.resetTurnFlags();
        } else {
            this.rules.resetTurnFlags();
            this.stick.reposition(this.whiteBall.position);
        }
    }

    if (result.gameOver) setTimeout(() => { PoolGame.gameOver(result.winner); }, 3000);
    else if (!result.nextTurn) setTimeout(() => { PoolGame.sendTurn(this.serialize()); }, 2000);
    else if (this.feedbackMessage) setTimeout(() => { this.feedbackMessage = null; }, 1500);
};

GameWorld.prototype.handleCollision = function(ball1, ball2) {
    if(ball1.color === COLOR.WHITE) this.rules.recordFirstCollision(ball2.color);
    if(ball2.color === COLOR.WHITE) this.rules.recordFirstCollision(ball1.color);
    ball1.collideWith(ball2);
};

GameWorld.prototype.shoot = function(power, rotation) {
    this.whiteBall.shoot(power, rotation);
    this.rules.resetTurnFlags();
};

GameWorld.prototype.ballsMoving = function() {
    return this.balls.some(b => b.moving);
};

GameWorld.prototype.getDistance = function(v1, v2) {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;
    return Math.sqrt(dx*dx + dy*dy);
};

GameWorld.prototype.checkOverlap = function(ball) {
    return this.balls.some(b => {
        if (b === ball) return false;
        return this.getDistance(b.position, ball.position) < BALL_SIZE;
    });
};

GameWorld.prototype.isInsideHole = function(pos) {
    const pockets = [
        new Vector2(62, 62), new Vector2(1435, 62), new Vector2(62, 762),
        new Vector2(1435, 762), new Vector2(750, 32), new Vector2(750, 794)
    ];
    return pockets.some(p => this.getDistance(pos, p) < 55);
};

// --- MODIFIED DRAW FUNCTION (HUD Added) ---
GameWorld.prototype.draw = function() {
    Canvas.drawImage(sprites.background, {x:0, y:0});
    this.balls.forEach(b => b.draw());
    if(!this.isPlacingWhiteBall && !this.ballsMoving()) this.stick.draw();
    if(this.isPlacingWhiteBall) Canvas.drawText("Place Cue Ball", new Vector2(750, 200), "#fff");

    // --- NEW: HUD VISUAL INDICATOR ---
    // Only show if it's my turn
    if (this.rules.turn === this.myPlayerIndex) {
        let myColor = (this.myPlayerIndex === 0) ? this.rules.p1Color : this.rules.p2Color;
        let hudText = "Target: ";
        let colorHex = "#fff";

        const ctx = Canvas._canvasContext;
        ctx.save();
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "left";
        
        // Draw "Target:" Text
        ctx.fillStyle = "white";
        ctx.fillText("TARGET:", 50, 40);

        if (this.rules.state === 'open') {
            ctx.fillStyle = "#f1c40f"; // Gold
            ctx.fillText("OPEN TABLE", 200, 40);
        } 
        else if (myColor) {
            let reds = this.balls.filter(b => b.color === COLOR.RED).length;
            let yellows = this.balls.filter(b => b.color === COLOR.YELLOW).length;
            
            let ballsLeft = 0;
            if (myColor === COLOR.RED) {
                ctx.fillStyle = "#e74c3c"; // Red
                ctx.fillText("RED", 200, 40);
                ballsLeft = reds;
            } else if (myColor === COLOR.YELLOW) {
                ctx.fillStyle = "#f1c40f"; // Yellow
                ctx.fillText("YELLOW", 200, 40);
                ballsLeft = yellows;
            }

            // Draw visual circle
            ctx.beginPath();
            ctx.arc(350, 30, 15, 0, Math.PI*2);
            ctx.fill();
            
            // 8-Ball Warning
            if (ballsLeft === 0) {
                ctx.fillStyle = "#fff";
                ctx.fillText("SHOOT 8-BALL!", 400, 40);
            }
        }
        ctx.restore();
    }
    // --- END HUD ---

    // Draw Feedback Message Overlay
    if (this.feedbackMessage) {
        const ctx = Canvas._canvasContext;
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, 1500, 825);
        ctx.restore();
        Canvas.drawText(this.feedbackMessage, new Vector2(750, 412), "#fff", "center", "80px Arial");
    }
};

GameWorld.prototype.serialize = function() {
    return {
        rules: this.rules,
        balls: this.balls.map(b => b.serialize()),
        isPlacingWhiteBall: this.isPlacingWhiteBall
    };
};

GameWorld.prototype.loadState = function(state) {
    this.rules = new GameRules();
    Object.assign(this.rules, state.rules);
    this.balls = state.balls.map(data => new Ball(new Vector2(data.x, data.y), data.color));
    this.whiteBall = this.balls.find(b => b.color === COLOR.WHITE);
    this.isPlacingWhiteBall = state.isPlacingWhiteBall;
    this.stick = new Stick(this.whiteBall.position, this.shoot.bind(this), this.balls, true);
};