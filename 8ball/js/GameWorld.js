// GameWorld.js

const DELTA = 1/177;

function GameWorld(savedState = null){ // <--- Change 1: Accept argument

    // --- 1. DEFINE POCKETS ---
    this.pockets = [
        new Vector2(57, 57), new Vector2(750, 57), new Vector2(1442, 57),
        new Vector2(57, 760), new Vector2(750, 760), new Vector2(1442, 760)
    ];

    // --- Change 2: Load Balls from Save OR Default ---
    if(savedState && savedState.balls) {
        // Load balls from DB
        this.balls = savedState.balls.map(b => new Ball(new Vector2(b.x, b.y), b.color));
    } else {
        // Default Triangle Setup
        this.balls= [
            [new Vector2(1022,413), COLOR.YELLOW],
            [new Vector2(1056,393), COLOR.YELLOW],
            [new Vector2(1056,433), COLOR.RED],
            [new Vector2(1090,374), COLOR.RED],
            [new Vector2(1090,413), COLOR.BLACK],
            [new Vector2(1090,452), COLOR.YELLOW],
            [new Vector2(1126,354), COLOR.YELLOW],
            [new Vector2(1126,393), COLOR.RED],
            [new Vector2(1126,433), COLOR.YELLOW],
            [new Vector2(1126,472), COLOR.RED],
            [new Vector2(1162,335), COLOR.RED],
            [new Vector2(1162,374), COLOR.RED],
            [new Vector2(1162,413), COLOR.YELLOW],
            [new Vector2(1162,452), COLOR.RED],
            [new Vector2(1162,491), COLOR.YELLOW],
            [new Vector2(413,413), COLOR.WHITE]
        ].map(params=> new Ball(params[0], params[1]));
    }

    this.whiteBall = this.balls.find(b => b.color === COLOR.WHITE);
    // Safety check if white ball was potted in previous turn but not reset
    if(!this.whiteBall) {
        this.whiteBall = new Ball(new Vector2(413,413), COLOR.WHITE);
        this.balls.push(this.whiteBall);
    }

    // --- Change 3: Load Turn State OR Default ---
    if(savedState && savedState.turnState) {
        this.turnState = savedState.turnState;
    } else {
        this.turnState = {
            currentPlayerIndex: 0,
            playerColors: [null, null],
            firstHitColor: null,
            ballsPottedThisTurn: [],
            foul: false
        };
    }

    // ... Rest of the constructor (table, stick, difficulty) remains the same ...
    this.difficultyModeEasy = true; 
    
    this.stick= new Stick(
        this.whiteBall.position.copy(), // Stick starts at white ball
        this.whiteBall.shoot.bind(this.whiteBall), 
        this.balls, 
        this.difficultyModeEasy
    );

    this.table= { TopY:57, RightX: 1442, BottomY: 760, LeftX: 57 };
}

GameWorld.prototype.handleCollisions= function(){
    for(let i=0; i<this.balls.length; i++){
        this.balls[i].collideWith(this.table);

        for(let j= i+1; j<this.balls.length; j++){
            const firstBall= this.balls[i];
            const secondBall= this.balls[j];
            
            // Check for collision
            const dist = firstBall.position.dist(secondBall.position);
            if(dist < BALL_DIAMETER){
                firstBall.collideWithBall(secondBall);

                // --- RULE CHECK: FIRST CONTACT ---
                // If the white ball hits another ball, record the color of that ball (if it's the first hit)
                if(this.turnState.firstHitColor === null){
                    if(firstBall === this.whiteBall){
                        this.turnState.firstHitColor = secondBall.color; // Found via sprite, but ideally Ball should store color property directly
                    } else if(secondBall === this.whiteBall){
                        this.turnState.firstHitColor = firstBall.color;
                    }
                }
            }
        }
    }
};

GameWorld.prototype.update= function(){
    this.handleCollisions();
    this.stick.update();
    
    // Update all balls
    for(let i=0; i<this.balls.length; i++) {
        this.balls[i].update(DELTA);
    }

    // --- CHECK POCKETS ---
    for(let i = this.balls.length - 1; i >= 0; i--){
        let ball = this.balls[i];
        for(let p = 0; p < this.pockets.length; p++){
            // If ball is close enough to pocket center (radius of 46 roughly)
            if(ball.position.dist(this.pockets[p]) < 46){ 
                
                if(ball === this.whiteBall){
                    // SCRATCH: White ball went in
                    this.turnState.foul = true;
                    this.whiteBall.velocity = new Vector2();
                    this.whiteBall.position = new Vector2(413, 413); // Reset position
                    this.whiteBall.moving = false;
                } else {
                    // Normal ball went in
                    this.turnState.ballsPottedThisTurn.push(ball.color); // Store color
                    this.balls.splice(i, 1); // Remove from game
                }
                break; 
            }
        }
    }

    // --- END OF TURN LOGIC ---
    if(!this.ballsMoving() && this.stick.shot){
        this.resolveTurn(); // Decide who plays next
        this.stick.reposition(this.whiteBall.position);
    }
};

GameWorld.prototype.resolveTurn = function(){
    const currentState = this.turnState;
    const currentPlayer = currentState.currentPlayerIndex;
    const assignedColor = currentState.playerColors[currentPlayer];

    let turnContinues = false;

    // 1. Did we hit our own color first? (Or any color if unassigned)
    let legalHit = true;
    if(assignedColor !== null){
        if(currentState.firstHitColor !== assignedColor){
            legalHit = false; // Foul: Hit opponent's ball or black first
        }
    }

    // 2. Process balls potted
    if(currentState.ballsPottedThisTurn.length > 0 && !currentState.foul){
        const firstPottedColor = currentState.ballsPottedThisTurn[0];
        
        // If colors aren't assigned yet, assign them now
        if(currentState.playerColors[0] === null && firstPottedColor !== COLOR.WHITE && firstPottedColor !== COLOR.BLACK){
             this.assignColors(currentPlayer, firstPottedColor);
             turnContinues = true;
        } 
        // Logic if colors ARE assigned
        else {
             // Did current player sink their own ball?
             const myColor = currentState.playerColors[currentPlayer];
             const sunkMyBall = currentState.ballsPottedThisTurn.includes(myColor);
             
             if(sunkMyBall && legalHit){
                 turnContinues = true;
             }
        }
    }

    // Switch turn if no valid reason to continue, or if a foul occurred
    if(!turnContinues || currentState.foul || !legalHit){
        this.turnState.currentPlayerIndex = 1 - this.turnState.currentPlayerIndex; // Switch 0 -> 1 or 1 -> 0
        console.log("Turn Switch! Now Player " + (this.turnState.currentPlayerIndex + 1));
    }

    // Reset Turn State
    this.turnState.firstHitColor = null;
    this.turnState.ballsPottedThisTurn = [];
    this.turnState.foul = false;

    // --- NEW CODE: Save State to DB ---
    // We send the entire board state to the GameManager
    if(typeof GameManager !== 'undefined'){
        const state = this.exportState();
        GameManager.saveTurn(state);
    }
};

GameWorld.prototype.assignColors = function(playerIndex, color){
    this.turnState.playerColors[playerIndex] = color;
    // Assign opposite color to other player (Assuming RED/YELLOW)
    const otherColor = (color === COLOR.RED) ? COLOR.YELLOW : COLOR.RED;
    this.turnState.playerColors[1 - playerIndex] = otherColor;
    console.log("Colors Assigned: P1=" + this.turnState.playerColors[0] + " P2=" + this.turnState.playerColors[1]);
};

GameWorld.prototype.draw= function(){
    Canvas.drawImage(sprites.background,{x:0,y:0});
    for(let i=0; i<this.balls.length; i++) this.balls[i].draw();
    this.stick.draw();
};

GameWorld.prototype.ballsMoving= function(){
    for(let i=0; i<this.balls.length; i++){
        if(this.balls[i].moving) return true;
    }
    return false;
};

GameWorld.prototype.exportState = function(){
    return {
        balls: this.balls.map(ball => ball.serialize()),
        turnState: this.turnState
    };
};