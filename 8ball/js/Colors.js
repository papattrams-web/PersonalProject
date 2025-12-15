const COLOR = {
    RED: 1,     // Solids
    YELLOW: 2,  // Stripes
    BLACK: 3,   // 8-Ball
    WHITE: 4    // Cue Ball
};

// Helper to match your integers to the inspiration's sprite system
function getBallSpriteByColor(colorId) {
    switch(colorId) {
        case COLOR.RED: return sprites.redBall;
        case COLOR.YELLOW: return sprites.yellowBall;
        case COLOR.BLACK: return sprites.blackBall;
        case COLOR.WHITE: return sprites.ball; // The white ball sprite
        default: return sprites.ball;
    }
}