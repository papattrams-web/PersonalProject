// pacman.js

// CONFIGURATION
const tileSize = 32;
const rowCount = 21;
const columnCount = 19;

// Board Setup
let board;
let context; 
let boardWidth = columnCount * tileSize;
let boardHeight = rowCount * tileSize;

// Assets
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage;

// Game State
let tileMap = []; 
const walls = []; // Changed to Array for easier iteration
const foods = [];
const ghosts = [];
let pacman = null;

let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false; 

// HTML Sync
const scoreEl = document.getElementById("score-container");

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth; // Set width explicitly
    board.height = boardHeight;
    context = board.getContext("2d");

    loadImages();

    // --- 1. LOAD MATCH STATE ---
    GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            console.log("Local Mode.");
            initGame(null);
            return;
        }

        if (response.board_state && response.board_state !== "null") {
            try {
                let data = JSON.parse(response.board_state);
                initGame(data.map);
            } catch(e) {
                initGame(null);
            }
        } else {
            initGame(null);
        }
    });
};

function initGame(loadedMap) {
    if (loadedMap) {
        tileMap = loadedMap;
    } else {
        tileMap = generateRandomMap();
    }
    
    loadMap();
    gameStarted = true;
    requestAnimationFrame(update);
    document.addEventListener("keydown", movePacmanInput); // Use KeyDown, not KeyUp for responsiveness
}

// ... [Keep your generateRandomMap function EXACTLY as it is] ...
function generateRandomMap() {
    // Paste your existing generateRandomMap code here...
    // (I omitted it to save space, but DO NOT DELETE IT)
    let map = Array(rowCount).fill().map(() => Array(columnCount).fill('X'));
    function carve(r, c) {
        map[r][c] = ' '; 
        const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]].sort(() => Math.random() - 0.5);
        for (let [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            if (nr > 0 && nr < rowCount - 1 && nc > 0 && nc < columnCount - 1 && map[nr][nc] === 'X') {
                map[r + dr / 2][c + dc / 2] = ' '; 
                carve(nr, nc);
            }
        }
    }
    carve(1, 1);
    for (let r = 9; r <= 11; r++) for (let c = 8; c <= 10; c++) map[r][c] = ' ';
    map[9][9] = 'b'; map[9][8] = 'p'; map[9][10] = 'o'; map[8][9] = 'r';
    map[15][9] = 'P'; map[15][8] = ' '; map[15][10] = ' ';
    for(let r=2; r<rowCount-2; r++) {
        for(let c=2; c<columnCount-2; c++) {
            if(map[r][c] === 'X' && Math.random() > 0.9) map[r][c] = ' '; 
        }
    }
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < Math.floor(columnCount / 2); c++) {
            map[r][columnCount - 1 - c] = map[r][c];
        }
    }
    return map.map(row => row.join(''));
}

// ... [Keep Game Manager Override] ...
GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    let payload = { game: this.config.gameSlug, score: scoreVal, type: this.config.gameType, match_id: matchId };
    if (tileMap && tileMap.length > 0) payload.board_state = JSON.stringify({ map: tileMap });

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        if (data.tournament_id) window.location.href = '../tournament/view.php?id=' + data.tournament_id;
        else window.location.href = '../history_page.php';
    });
};

function loadImages() {
    wallImage = new Image(); wallImage.src = "./images/wall.png";
    blueGhostImage = new Image(); blueGhostImage.src = "./images/blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./images/orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./images/pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./images/redGhost.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./images/pacmanUp.png";
    pacmanDownImage = new Image(); pacmanDownImage.src = "./images/pacmanDown.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./images/pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./images/pacmanRight.png";
}

function loadMap() {
    walls.length = 0; foods.length = 0; ghosts.length = 0;

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            let char = tileMap[r][c];
            let x = c * tileSize;
            let y = r * tileSize;

            if (char === 'X') {
                walls.push(new Block(wallImage, x, y, tileSize, tileSize, 'wall'));
            } else if (['b','p','o','r'].includes(char)) {
                let img = char === 'b' ? blueGhostImage : char === 'p' ? pinkGhostImage : char === 'o' ? orangeGhostImage : redGhostImage;
                let g = new Block(img, x, y, tileSize, tileSize, 'ghost');
                g.velocityX = tileSize/8; // Initial movement
                ghosts.push(g);
            } else if (char === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize, 'pacman');
            } else if (char === ' ') {
                foods.push(new Block(null, x + 14, y + 14, 4, 4, 'food'));
            }
        }
    }
}

function update() {
    if (gameOver || !gameStarted) return;
    
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw Walls
    for (let w of walls) context.drawImage(w.image, w.x, w.y, w.width, w.height);
    
    // Draw Food
    context.fillStyle = "white";
    for (let f of foods) context.fillRect(f.x, f.y, f.width, f.height);

    // Update & Draw Pacman
    moveEntity(pacman);
    checkWallCollisions(pacman);
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);

    // Update & Draw Ghosts
    for (let g of ghosts) {
        moveEntity(g);
        checkGhostWallCollisions(g);
        context.drawImage(g.image, g.x, g.y, g.width, g.height);

        if (collision(g, pacman)) {
            lives--;
            if (lives <= 0) {
                gameOver = true;
                alert("GAME OVER! Score: " + score);
                GameManager.submitScore(score);
            } else {
                resetPositions();
            }
        }
    }

    // Check Food Collision
    for (let i = 0; i < foods.length; i++) {
        if (collision(pacman, foods[i])) {
            foods.splice(i, 1);
            score += 10;
            scoreEl.innerText = score;
            i--;
        }
    }

    if (foods.length === 0) {
        alert("Level Cleared! Loop.");
        initGame(null); // Regen map
    }

    // UI
    context.fillStyle = "#ffee00";
    context.font = "20px 'Courier New', sans-serif";
    context.fillText("LIVES: " + lives + "   SCORE: " + score, 10, 25);

    requestAnimationFrame(update);
}

// --- NEW MOVEMENT LOGIC (SMOOTH TURNS) ---
class Block {
    constructor(image, x, y, w, h, type) {
        this.image = image;
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.startX = x; this.startY = y;
        this.type = type;
        this.velocityX = 0; this.velocityY = 0;
        this.nextDir = null; // Buffer for queued input
        this.direction = 'R';
    }
    reset() {
        this.x = this.startX; this.y = this.startY;
        this.velocityX = 0; this.velocityY = 0;
        this.nextDir = null;
    }
}

function moveEntity(obj) {
    // 1. Try to apply queued direction if aligned
    if (obj.type === 'pacman' && obj.nextDir) {
        // Only allow turn if center is roughly aligned with grid
        // This makes it feel "snappy"
        let centerX = obj.x + obj.width/2;
        let centerY = obj.y + obj.height/2;
        
        // Simple modulo check to see if we are in a tile center
        // (Allows a 8px error margin based on speed)
        if (Number.isInteger((obj.x) / tileSize * 8) && Number.isInteger((obj.y) / tileSize * 8)) {
             let oldVX = obj.velocityX;
             let oldVY = obj.velocityY;
             
             setDir(obj, obj.nextDir);
             
             // If turning makes us hit a wall immediately, cancel turn
             if (willHitWall(obj)) {
                 obj.velocityX = oldVX;
                 obj.velocityY = oldVY;
             } else {
                 obj.nextDir = null; // Turn consumed
             }
        }
    }

    obj.x += obj.velocityX;
    obj.y += obj.velocityY;
}

function setDir(obj, dir) {
    const speed = tileSize / 8; // 4px per frame
    obj.velocityX = 0; obj.velocityY = 0;
    if (dir === 'U') obj.velocityY = -speed;
    if (dir === 'D') obj.velocityY = speed;
    if (dir === 'L') obj.velocityX = -speed;
    if (dir === 'R') obj.velocityX = speed;
    obj.direction = dir;
}

function willHitWall(obj) {
    // Look ahead one step
    obj.x += obj.velocityX;
    obj.y += obj.velocityY;
    let hit = false;
    for (let w of walls) {
        if (collision(obj, w)) { hit = true; break; }
    }
    // Undo lookahead
    obj.x -= obj.velocityX;
    obj.y -= obj.velocityY;
    return hit;
}

function checkWallCollisions(obj) {
    for (let w of walls) {
        if (collision(obj, w)) {
            obj.x -= obj.velocityX;
            obj.y -= obj.velocityY;
            // Pacman stops on wall hit
            if(obj.type === 'pacman') {
                obj.velocityX = 0; 
                obj.velocityY = 0;
            }
            break;
        }
    }
}

function checkGhostWallCollisions(ghost) {
    for (let w of walls) {
        if (collision(ghost, w) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
            ghost.x -= ghost.velocityX;
            ghost.y -= ghost.velocityY;
            // Pick random new valid direction
            const dirs = ['U','D','L','R'];
            setDir(ghost, dirs[Math.floor(Math.random()*4)]);
        }
    }
}

function movePacmanInput(e) {
    if (gameOver) return;
    let dir = null;
    if (e.code == "ArrowUp" || e.code == "KeyW") dir = 'U';
    else if (e.code == "ArrowDown" || e.code == "KeyS") dir = 'D';
    else if (e.code == "ArrowLeft" || e.code == "KeyA") dir = 'L';
    else if (e.code == "ArrowRight" || e.code == "KeyD") dir = 'R';

    if (dir) {
        pacman.nextDir = dir;
        // Update image immediately for feedback
        if (dir == 'U') pacman.image = pacmanUpImage;
        else if (dir == 'D') pacman.image = pacmanDownImage;
        else if (dir == 'L') pacman.image = pacmanLeftImage;
        else if (dir == 'R') pacman.image = pacmanRightImage;
    }
}

function collision(a, b) {
    // Shrink collision box slightly to prevent getting stuck on corners
    const padding = 2; 
    return a.x < b.x + b.width - padding && 
           a.x + a.width > b.x + padding && 
           a.y < b.y + b.height - padding && 
           a.y + a.height > b.y + padding;
}

function resetPositions() {
    pacman.reset();
    pacman.image = pacmanRightImage;
    for (let g of ghosts) {
        g.reset();
        g.velocityX = tileSize/8;
    }
}