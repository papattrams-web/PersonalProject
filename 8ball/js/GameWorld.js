"use strict";

const BALL_SIZE = 38;
const TABLE_W = 1500;
const TABLE_H = 825;

function GameWorld(savedState) {
    // Initialize empty arrays
    this.balls = [];
    this.whiteBall = null;
    this.stick = null;
    
    this.table = {
        TopY: 57,
        RightX: 1443, // 1500 - 57
        BottomY: 768, // 825 - 57
        LeftX: 57
    };

    // Load Rules Engine
    this.rules = new GameRules();
    
    // Setup flag for "Ball in Hand" placement
    this.isPlacingWhiteBall = false;

    // Load State from Database OR Start New Game
    if (savedState && savedState.balls) {
        this.loadState(savedState);
    } else {
        this.initNewGame();
    }
}

// 1. Setup a fresh Triangle Rack
GameWorld.prototype.initNewGame = function() {
    let startX = 1090;
    let startY = 413;
    
    // Math to pack circles tightly
    let rowX = BALL_SIZE * Math.cos(Math.PI/6) + 2; 
    let rowY = BALL_SIZE/2 + 2;

    this.balls = [];
    
    // Cue Ball
    this.whiteBall = new Ball(new Vector2(413, 413), COLOR.WHITE);
    this.balls.push(this.whiteBall);

    // Row 1
    this.balls.push(new Ball(new Vector2(startX, startY), COLOR.RED));

    // Row 2
    this.balls.push(new Ball(new Vector2(startX + rowX, startY - rowY), COLOR.YELLOW));
    this.balls.push(new Ball(new Vector2(startX + rowX, startY + rowY), COLOR.RED));

    // Row 3 (8-Ball in middle)
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
    // If placing white ball (after a scratch)
    if (this.isPlacingWhiteBall) {
        this.whiteBall.position = Mouse.position.copy();
        
        // Clamp inside table
        if(this.whiteBall.position.x < 60) this.whiteBall.position.x = 60;
        if(this.whiteBall.position.x > 1440) this.whiteBall.position.x = 1440;
        if(this.whiteBall.position.y < 60) this.whiteBall.position.y = 60;
        if(this.whiteBall.position.y > 765) this.whiteBall.position.y = 765;

        // Click to place
        if(Mouse.left.pressed && !this.checkOverlap(this.whiteBall)) {
            this.isPlacingWhiteBall = false;
            this.stick.reposition(this.whiteBall.position);
        }
    } else {
        // Standard stick input
        this.stick.update();
    }
};

GameWorld.prototype.update = function(delta) {
    // Physics Loop
    for(let i=0; i<this.balls.length; i++) {
        for(let j=i+1; j<this.balls.length; j++) {
            this.handleCollision(this.balls[i], this.balls[j]);
        }

        this.balls[i].collideWithTable(this.table);

        this.balls[i].update(delta);

        // Check Pockets
        if(this.isInsideHole(this.balls[i].position)) {
            this.rules.recordPocketed(this.balls[i].color);
            
            if(this.balls[i].color === COLOR.WHITE) {
                // Don't delete white ball, just hide it
                this.balls[i].velocity = new Vector2();
                this.balls[i].position = new Vector2(-1000, -1000);
            } else {
                // Remove other balls
                this.balls.splice(i, 1);
                i--;
            }
        }
    }

    // End of Turn Check: Stick shot AND everything stopped moving
    if(this.stick.shot && !this.ballsMoving()) {
        this.resolveTurn();
    }
};

GameWorld.prototype.resolveTurn = function() {
    this.stick.shot = false;

    // Count remaining balls for logic
    let reds = this.balls.filter(b => b.color === COLOR.RED).length;
    let yellows = this.balls.filter(b => b.color === COLOR.YELLOW).length;

    // Ask Rules Engine what happened
    let result = this.rules.processTurn(this.rules.turn, reds, yellows);

    if(result.gameOver) {
        // Trigger Game Over in Game.js
        PoolGame.gameOver(result.winner); 
    } else {
        // Handle Foul (Respawn White Ball Logic)
        if(result.foul) {
            // If white ball is off screen, bring it back to center for placement
            if(this.whiteBall.position.x < 0) {
                this.whiteBall.position = new Vector2(413, 413);
                this.whiteBall.velocity = new Vector2();
            }
            // Next player gets to place it
            this.isPlacingWhiteBall = true;
        }

        if(result.nextTurn) {
            // I play again
            this.rules.resetTurnFlags();
            this.stick.reposition(this.whiteBall.position);
            // Optional: alert(result.message);
        } else {
            // Switch Turn
            this.rules.turn = 1 - this.rules.turn; // Toggle 0/1
            this.rules.resetTurnFlags();
            
            // Save Data and Send to Server
            PoolGame.sendTurn(this.serialize());
        }
    }
};

// Physics Helpers
GameWorld.prototype.handleCollision = function(ball1, ball2) {
    // Record First Hit for Rules
    if(ball1.color === COLOR.WHITE) this.rules.recordFirstCollision(ball2.color);
    if(ball2.color === COLOR.WHITE) this.rules.recordFirstCollision(ball1.color);

    ball1.collideWith(ball2); // Existing physics in Ball.js
};

GameWorld.prototype.shoot = function(power, rotation) {
    this.whiteBall.shoot(power, rotation);
    this.rules.resetTurnFlags();
};

GameWorld.prototype.ballsMoving = function() {
    return this.balls.some(b => b.moving);
};

// --- FIX: Manual Distance Calculation ---
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
    // Adjusted coordinates for 1500x825 table
    const pockets = [
        new Vector2(62, 62),     // Top Left
        new Vector2(1435, 62),   // Top Right
        new Vector2(62, 762),    // Bottom Left
        new Vector2(1435, 762),  // Bottom Right
        new Vector2(750, 32),    // Top Middle
        new Vector2(750, 794)    // Bottom Middle
    ];
    
    // Increased radius slightly for better "feel" (46 -> 55)
    let holeRadius = 55; 
    
    return pockets.some(p => this.getDistance(pos, p) < holeRadius);
};

GameWorld.prototype.draw = function() {
    Canvas.drawImage(sprites.background, {x:0, y:0});
    this.balls.forEach(b => b.draw());
    // Only draw stick if it is aiming and not placing ball
    if(!this.isPlacingWhiteBall && !this.ballsMoving()) this.stick.draw();
    
    if(this.isPlacingWhiteBall) Canvas.drawText("Place Cue Ball", new Vector2(750, 200), "#fff");
};

// Save State to JSON
GameWorld.prototype.serialize = function() {
    return {
        rules: this.rules, // Saves turn, colors, state
        balls: this.balls.map(b => b.serialize()), // Saves x,y,color
        isPlacingWhiteBall: this.isPlacingWhiteBall
    };
};

// Load State from JSON
GameWorld.prototype.loadState = function(state) {
    // Load Rules
    this.rules = new GameRules();
    Object.assign(this.rules, state.rules);

    // Recreate Balls
    this.balls = state.balls.map(data => {
        let b = new Ball(new Vector2(data.x, data.y), data.color);
        return b;
    });

    // Re-link references
    this.whiteBall = this.balls.find(b => b.color === COLOR.WHITE);
    this.isPlacingWhiteBall = state.isPlacingWhiteBall;
    
    // Setup Stick
    this.stick = new Stick(this.whiteBall.position, this.shoot.bind(this), this.balls, true);
};