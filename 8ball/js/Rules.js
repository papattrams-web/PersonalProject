function GameRules() {
    // 0 = Player 1, 1 = Player 2
    this.turn = 0; 
    
    // 'open' (no colors assigned), 'playing', 'gameover'
    this.state = 'open'; 
    
    // Who owns what? (null, COLOR.RED, or COLOR.YELLOW)
    this.p1Color = null; 
    this.p2Color = null;
    
    // Turn flags - these reset every shot
    this.foul = false;
    this.scored = false; 
    this.won = false;
    this.firstCollision = null; // What did we hit first?
    this.ballsPocketed = [];    // What went in the hole?
}

GameRules.prototype.resetTurnFlags = function() {
    this.foul = false;
    this.scored = false;
    this.firstCollision = null;
    this.ballsPocketed = [];
};

// Called by Physics engine when collision happens
GameRules.prototype.recordFirstCollision = function(color) {
    if (this.firstCollision === null) {
        this.firstCollision = color;
    }
};

// Called by Physics engine when ball enters hole
GameRules.prototype.recordPocketed = function(color) {
    this.ballsPocketed.push(color);
};

// THE CORE LOGIC: Decides what happens next
GameRules.prototype.processTurn = function(activePlayerId, remainingRed, remainingYellow) {
    let message = "";
    let turnContinues = false;

    // 1. Check Scratch (White Ball Pocketed)
    if (this.ballsPocketed.includes(COLOR.WHITE)) {
        this.foul = true;
        message = "Scratch! Ball in hand.";
    }

    // 2. Check Valid Hit (Must hit own color first)
    if (!this.foul) {
        if (this.firstCollision === null) {
            this.foul = true;
            message = "You missed the balls!";
        } else if (this.state === 'playing') {
            // Determine active color
            let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
            let myBallsRemaining = (myColor === COLOR.RED) ? remainingRed : remainingYellow;
            
            // If I have balls left, I MUST hit my color. 
            // If I have 0 balls left, I MUST hit the 8-Ball (Black).
            let target = (myBallsRemaining > 0) ? myColor : COLOR.BLACK;

            if (this.firstCollision !== target) {
                this.foul = true;
                message = "Bad contact! Ball in hand.";
            }
        }
    }

    // 3. Assign Colors (If table was open and a valid ball was sunk)
    if (this.state === 'open' && !this.foul && this.ballsPocketed.length > 0) {
        // Find the first Red or Yellow
        let validBall = this.ballsPocketed.find(c => c === COLOR.RED || c === COLOR.YELLOW);
        
        if (validBall) {
            this.state = 'playing';
            if (activePlayerId === 0) {
                this.p1Color = validBall;
                this.p2Color = (validBall === COLOR.RED) ? COLOR.YELLOW : COLOR.RED;
            } else {
                this.p2Color = validBall;
                this.p1Color = (validBall === COLOR.RED) ? COLOR.YELLOW : COLOR.RED;
            }
            this.scored = true;
            message = "Colors Assigned: " + (validBall === COLOR.RED ? "RED" : "YELLOW");
        }
    }

    // 4. Check for Win/Loss (The 8-Ball)
    if (this.ballsPocketed.includes(COLOR.BLACK)) {
        let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
        let myBallsRemaining = (myColor === COLOR.RED) ? remainingRed : remainingYellow;

        // LOSE conditions
        if (this.foul) {
            message = "Foul on 8-Ball. YOU LOSE.";
            return { gameOver: true, winner: false }; 
        }
        if (myBallsRemaining > 0) {
            message = "Early 8-Ball. YOU LOSE.";
            return { gameOver: true, winner: false };
        }

        // WIN condition
        message = "VICTORY!";
        return { gameOver: true, winner: true };
    }

    // 5. Determine Turn Continuation
    if (this.state === 'playing' && !this.foul) {
        let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
        if (this.ballsPocketed.includes(myColor)) {
            this.scored = true;
        }
    }

    // You keep turn if: No Foul AND You Scored
    if (!this.foul && this.scored) {
        turnContinues = true;
    } else {
        turnContinues = false; // Turn passes to opponent
    }

    return { 
        nextTurn: turnContinues, 
        foul: this.foul, 
        message: message, 
        gameOver: false 
    };
};