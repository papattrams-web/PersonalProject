// Stick.js

const STICK_ORIGIN= new Vector2(970, 11);
const STICK_SHOT_ORIGIN= new Vector2(950, 11);
const MAX_POWER= 7500;

function Stick(position, onShoot, balls, isEasyMode){
    this.position = position;
    this.rotation= 0;
    this.origin= STICK_ORIGIN.copy();
    this.power= 0;
    this.onShoot= onShoot;
    this.shot= false;
    
    // New references for Aim Assist
    this.balls = balls; 
    this.isEasyMode = isEasyMode;
}

Stick.prototype.update = function(){
    if(Mouse.left.down) this.increasePower();
    else if(this.power>0){
        this.shoot();
    }
    this.updateRotation();
};

Stick.prototype.draw = function(){
    // Draw Aim Assist ONLY if power is being charged or just aiming (not during shot)
    if(this.isEasyMode && !this.shot){
        this.drawAimAssist();
    }
    Canvas.drawImage(sprites.stick, this.position, this.origin, this.rotation);
};

Stick.prototype.drawAimAssist = function(){
    // 1. Calculate direction vector from rotation
    const direction = new Vector2(Math.cos(this.rotation), Math.sin(this.rotation));
    
    // 2. Find closest ball in this direction
    let closestDist = 10000;
    let collisionPoint = null;
    let targetBall = null;

    // Raycast math: checking intersection between Line (WhiteBall + t*Direction) and Circles (Balls)
    for(let i=0; i<this.balls.length; i++){
        const ball = this.balls[i];
        if(ball.position === this.position) continue; // Skip white ball itself

        // Vector from WhiteBall to TargetBall
        const f = this.position.subtract(ball.position); 
        
        // Quadratic formula coefficients to solve for intersection
        const a = direction.dot(direction);
        const b = 2 * f.dot(direction);
        const c = f.dot(f) - (BALL_DIAMETER * BALL_DIAMETER); // Expanded radius (hit detection)

        let delta = b*b - 4*a*c;

        if(delta >= 0){
            // Collision exists. Find the closest point (t)
            const t = (-b - Math.sqrt(delta)) / (2*a);
            
            if(t > 0 && t < closestDist){
                closestDist = t;
                targetBall = ball;
                // Position where white ball center will be at moment of impact
                collisionPoint = this.position.add(direction.mult(t));
            }
        }
    }

    // 3. Draw the lines
    const ctx = Canvas._canvasContext; // Access context directly for line drawing
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    
    if(collisionPoint){
        // Line 1: White ball to Ghost Ball
        ctx.strokeStyle = "white";
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(collisionPoint.x, collisionPoint.y);
        ctx.stroke();

        // Line 2: Helper Vector (20% of outcome)
        // Calculate normal vector at collision
        const collisionNormal = collisionPoint.subtract(targetBall.position);
        const unitNormal = collisionNormal.mult(1/collisionNormal.length());
        
        // Invert for target ball direction (Target ball moves AWAY from impact)
        const targetDir = unitNormal.mult(-1); 
        const guideLength = 50; // Short guide line
        const guideEnd = targetBall.position.add(targetDir.mult(guideLength));

        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.setLineDash([]); // Solid line
        ctx.moveTo(targetBall.position.x, targetBall.position.y);
        ctx.lineTo(guideEnd.x, guideEnd.y);
        ctx.stroke();

        // Draw Ghost Ball (Circle)
        ctx.beginPath();
        ctx.arc(collisionPoint.x, collisionPoint.y, BALL_RADIUS, 0, Math.PI*2);
        ctx.strokeStyle = "white";
        ctx.stroke();

    } else {
        // No collision found, draw long line into distance
        const endPos = this.position.add(direction.mult(1000));
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.setLineDash([5, 5]);
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
    }
    
    ctx.restore();
};

Stick.prototype.updateRotation= function(){
    let opposite= Mouse.position.y - this.position.y;
    let adjacent= Mouse.position.x - this.position.x;
    this.rotation= Math.atan2(opposite, adjacent);
};

Stick.prototype.increasePower= function(){
    if(this.power>MAX_POWER) return;
    this.power +=120;
    this.origin.x +=5;
};

Stick.prototype.shoot= function(){
    this.onShoot(this.power, this.rotation);
    this.power= 0;
    this.origin= STICK_SHOT_ORIGIN.copy();
    this.shot= true;
};

Stick.prototype.reposition= function(position){
    this.position= position.copy();
    this.origin= STICK_ORIGIN.copy();
    this.shot= false;
};