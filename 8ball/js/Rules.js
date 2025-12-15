// Rules.js - Fixed for Red/Yellow Color Logic
function GameRules() {
    this.turn = 0; // 0 = Player 1, 1 = Player 2
    this.state = 'open'; // 'open', 'playing', 'gameover'
    this.p1Color = null; 
    this.p2Color = null;
    
    // Turn flags
    this.foul = false;
    this.scored = false; 
    this.won = false;
    this.firstCollision = null;
    this.ballsPocketed = [];    
}

GameRules.prototype.resetTurnFlags = function() {
    this.foul = false;
    this.scored = false;
    this.firstCollision = null;
    this.ballsPocketed = [];
};

GameRules.prototype.recordFirstCollision = function(color) {
    if (this.firstCollision === null) {
        this.firstCollision = color;
    }
};

GameRules.prototype.recordPocketed = function(color) {
    this.ballsPocketed.push(color);
};

GameRules.prototype.processTurn = function(activePlayerId, remainingRed, remainingYellow) {
    let message = "";
    let turnContinues = false;

    // 1. Check Scratch
    if (this.ballsPocketed.includes(COLOR.WHITE)) {
        this.foul = true;
        message = "Scratch! Ball in hand.";
    }

    // 2. Check Valid Hit
    if (!this.foul) {
        if (this.firstCollision === null) {
            this.foul = true;
            message = "You missed the balls!";
        } 
        else if (this.state === 'playing') {
            // Determine active color
            let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
            
            // Calculate my remaining balls
            let myBallsRemaining = 0;
            if (myColor === COLOR.RED) myBallsRemaining = remainingRed;
            else if (myColor === COLOR.YELLOW) myBallsRemaining = remainingYellow;
            
            // Target Logic: Hit my color, or Black if none left
            let target = (myBallsRemaining > 0) ? myColor : COLOR.BLACK;

            // FIX: Force Number comparison to prevent "1" !== 1 errors
            if (Number(this.firstCollision) !== Number(target)) {
                this.foul = true;
                
                // Clearer Error Messages matching the Visuals
                let colorName = (target === COLOR.RED) ? "RED" : (target === COLOR.YELLOW ? "YELLOW" : "8-BALL");
                message = "Bad contact! You must hit " + colorName;
            }
        }
    }

    // 3. Assign Colors (Only if 'open')
    if (this.state === 'open' && !this.foul && this.ballsPocketed.length > 0) {
        let validBall = this.ballsPocketed.find(c => c === COLOR.RED || c === COLOR.YELLOW);
        
        if (validBall) {
            this.state = 'playing';
            
            // Assign based on who sank the ball
            if (activePlayerId === 0) {
                this.p1Color = validBall;
                this.p2Color = (validBall === COLOR.RED) ? COLOR.YELLOW : COLOR.RED;
            } else {
                this.p2Color = validBall;
                this.p1Color = (validBall === COLOR.RED) ? COLOR.YELLOW : COLOR.RED;
            }
            this.scored = true;
            
            // FIX: Text now matches Visuals (Red/Yellow) instead of Solids/Stripes
            let assignedColor = (validBall === COLOR.RED) ? "RED" : "YELLOW";
            message = "You are " + assignedColor;
        }
    }

    // 4. Check 8-Ball Win/Loss
    if (this.ballsPocketed.includes(COLOR.BLACK)) {
        let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
        let myBallsRemaining = 0;
        if (myColor === COLOR.RED) myBallsRemaining = remainingRed;
        else if (myColor === COLOR.YELLOW) myBallsRemaining = remainingYellow;

        if (this.foul) return { gameOver: true, winner: false }; // Foul on 8-ball = LOSE
        if (myBallsRemaining > 0) return { gameOver: true, winner: false }; // Early 8-ball = LOSE
        
        return { gameOver: true, winner: true }; // Legal 8-ball = WIN
    }

    // 5. Continuation Rule
    if (this.state === 'playing' && !this.foul) {
        let myColor = (activePlayerId === 0) ? this.p1Color : this.p2Color;
        // Check if I sank ANY of my balls
        let sankMyColor = this.ballsPocketed.some(c => c === myColor);
        if (sankMyColor) {
            this.scored = true;
        }
    }

    if (!this.foul && this.scored) turnContinues = true;
    else turnContinues = false;

    return { nextTurn: turnContinues, foul: this.foul, message: message, gameOver: false };
};