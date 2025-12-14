const BALL_DIAMETER= 38;
const BALL_RADIUS= BALL_DIAMETER/2;
const BALL_ORIGIN= new Vector2(25, 25);

function Ball(position, color){
    this.position= position;
    this.velocity= new Vector2();
    this.moving= false;
    this.color = color; // <--- STORE THIS
    this.sprite= getBallSpriteByColor(color);
}

Ball.prototype.update= function(delta){
    this.position.addTo(this.velocity.mult(delta))

    //friction
    this.velocity= this.velocity.mult(0.984)

    if(this.velocity.length()<5){
        this.velocity= new Vector2()
        this.moving= false
    }
}

Ball.prototype.draw= function(){
    Canvas.drawImage(this.sprite, this.position, BALL_ORIGIN)
}

Ball.prototype.shoot= function(power, rotation){

    this.velocity= new Vector2(power* Math.cos(rotation), power* Math.sin(rotation))
    this.moving= true
}

Ball.prototype.collideWithBall= function(ball){
    const n= this.position.subtract(ball.position)

    const dist= n.length()

    if(dist>BALL_DIAMETER){
        return
    }

    const mtd= n.mult((BALL_DIAMETER-dist)/dist)

    this.position= this.position.add(mtd.mult(1/2))
    ball.position= ball.position.subtract(mtd.mult(1/2))


    //unit normal
    const un= n.mult(1/n.length())
    //unit tangent
    const ut= new Vector2(-un.y, un.x)

    const v1n= un.dot(this.velocity)
    const v1t= ut.dot(this.velocity)
     
    const v2n= un.dot(ball.velocity)
    const v2t= ut.dot(ball.velocity)

    let v1nTag= v2n
    let v2nTag= v1n

    v1nTag= un.mult(v1nTag)
    const v1tTag= ut.mult(v1t)
    
    v2nTag= un.mult(v2nTag)
    const v2tTag= ut.mult(v2t)

    this.velocity= v1nTag.add(v1tTag)
    ball.velocity= v2nTag.add(v2tTag)

    this.moving= true
    ball.moving= true
}

Ball.prototype.collideWithTable= function(table){
    if(!this.moving){
        return
    }

    let collided= false

    if(this.position.y<= table.TopY + BALL_RADIUS){
        this.velocity= new Vector2(this.velocity.x, -this.velocity.y)
        collided= true
    }
    
    if(this.position.x>= table.RightX - BALL_RADIUS){
        this.velocity= new Vector2(-this.velocity.x, this.velocity.y)
        collided= true
    }
    
    if(this.position.y>= table.BottomY - BALL_RADIUS){
        this.velocity= new Vector2(this.velocity.x, -this.velocity.y)
        collided= true
    }
    
    if(this.position.x<= table.LeftX + BALL_RADIUS){
        this.velocity= new Vector2(-this.velocity.x, this.velocity.y)
        collided= true
    }
    
    if(collided){
        this.velocity= this.velocity.mult(0.98)
    }
}

Ball.prototype.collideWith= function(object){
    if(object instanceof Ball){
        this.collideWithBall(object)
    }else{
        this.collideWithTable(object)
    }
}