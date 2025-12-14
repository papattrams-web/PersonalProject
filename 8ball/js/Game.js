function Game(){
}

Game.prototype.init = function(){
    this.gameWorld = new GameWorld();

}

Game.prototype.start = function(){
    PoolGame.init();
    PoolGame.mainloop();

}

Game.prototype.mainloop = function(){
    Canvas.clear();
    PoolGame.gameWorld.update();
    PoolGame.gameWorld.draw();
    Mouse.reset()

    requestAnimationFrame(PoolGame.mainloop);

}

let PoolGame = new Game();