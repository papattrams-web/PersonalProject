// board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

// Assets
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage;

// Game State
let tileMap = []; // Now dynamic
const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false; // Wait for DB load

// HTML Score Sync
const scoreEl = document.getElementById("score-container");

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    loadImages();
    
    // --- 1. WAIT FOR MATCH STATE ---
    GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            console.error("Error loading match.");
            // Fallback: Generate local
            tileMap = generateRandomMap();
            startGame();
            return;
        }

        // Check if board exists
        if (response.board_state && response.board_state !== "null") {
            console.log("Loading Saved Map...");
            try {
                let data = JSON.parse(response.board_state);
                tileMap = data.map;
            } catch(e) {
                tileMap = generateRandomMap();
            }
        } else {
            console.log("Generating New Map...");
            tileMap = generateRandomMap();
        }

        startGame();
    });
};

function startGame() {
    loadMap();
    for (let ghost of ghosts.values()) {
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
    gameStarted = true;
    requestAnimationFrame(update);
    document.addEventListener("keyup", movePacman);
}

// --- 2. MAP GENERATION LOGIC ---
// --- 2. IMPROVED MAP GENERATION LOGIC ---
function generateRandomMap() {
    // 1. Initialize full grid with Walls ('X')
    let map = [];
    for (let r = 0; r < rowCount; r++) {
        let row = [];
        for (let c = 0; c < columnCount; c++) {
            row.push('X');
        }
        map.push(row);
    }

    // 2. Recursive Backtracker to carve a guaranteed path
    // We only carve on odd indices to leave room for walls
    function carve(r, c) {
        map[r][c] = ' '; // Carve current spot
        
        // Randomize directions: Up, Down, Left, Right (skip 2 cells)
        const directions = [
            [-2, 0], [2, 0], [0, -2], [0, 2]
        ].sort(() => Math.random() - 0.5);

        for (let [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            // Check bounds (leave 1 tile border)
            if (nr > 0 && nr < rowCount - 1 && nc > 0 && nc < columnCount - 1 && map[nr][nc] === 'X') {
                map[r + dr / 2][c + dc / 2] = ' '; // Carve connection
                carve(nr, nc); // Recurse
            }
        }
    }

    // Start carving from (1,1)
    carve(1, 1);

    // 3. Clear the Ghost House (Center) manually
    // Rows 9-11, Cols 8-10
    for (let r = 9; r <= 11; r++) {
        for (let c = 8; c <= 10; c++) {
            map[r][c] = ' ';
        }
    }
    // Set Spawn Points
    map[9][9] = 'b';  // Blue Ghost
    map[9][8] = 'p';  // Pink
    map[9][10] = 'o'; // Orange
    map[8][9] = 'r';  // Red (Outside house)

    // 4. Clear Pac-Man Spawn (Bottom Center)
    for(let r=15; r<=16; r++) {
        for(let c=8; c<=10; c++) {
             map[r][c] = ' ';
        }
    }
    map[15][9] = 'P'; // Pac-Man

    // 5. Open extra paths randomly (to reduce dead ends)
    // The maze is "perfect" (one path), so we remove random walls to make loops.
    for(let r=2; r<rowCount-2; r++) {
        for(let c=2; c<columnCount-2; c++) {
            if(map[r][c] === 'X' && Math.random() > 0.8) {
                // Ensure we don't destroy the outer border
                map[r][c] = ' '; 
            }
        }
    }
    
    // 6. Enforce Symmetry (Optional, but looks better)
    // Copy Left side to Right side
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < Math.floor(columnCount / 2); c++) {
            let mirrorC = columnCount - 1 - c;
            map[r][mirrorC] = map[r][c];
        }
    }

    // 7. Convert array back to strings
    return map.map(row => row.join(''));
}

// --- 3. OVERRIDE SUBMISSION (To Save Map) ---
GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    // If I generated the map (tileMap exists), send it
    if (tileMap && tileMap.length > 0) {
        payload.board_state = JSON.stringify({ map: tileMap });
    }

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        window.location.href = '../homepage.php';
    });
};

// ... [Existing loadImages() - No Change] ...
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
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (tileMapChar == 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar == 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar == 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar == 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileMapChar == ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }
}

function update() {
    if (!GameManager.gameActive) { requestAnimationFrame(update); return; }
    if (!gameStarted) return;
    if (gameOver) return;
    move();
    draw();
    requestAnimationFrame(update);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw Objects
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for (let ghost of ghosts.values()) context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    for (let wall of walls.values()) context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    
    context.fillStyle = "white";
    for (let food of foods.values()) context.fillRect(food.x, food.y, food.width, food.height);

    // Draw Score (Canvas)
    context.fillStyle = "#ffee00";
    context.font = "20px 'Courier New', sans-serif";
    context.fillText("LIVES: " + lives + "   SCORE: " + score, 10, 25);
}

function move() {
    // 1. Move Pacman
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    // 2. Move Ghosts
    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives <= 0) {
                gameOver = true;
                // --- TRIGGER END GAME ---
                alert("GAME OVER! Score: " + score);
                GameManager.submitScore(score); 
                return;
            }
            resetPositions();
        }
        
        // Simple Ghost AI (Random Turn on Collision)
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
            }
        }
    }

    // 3. Check Food
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            // --- SYNC SCORE WITH HTML ---
            scoreEl.innerText = score; 
            break;
        }
    }
    foods.delete(foodEaten);

    // Level Clear?
    if (foods.size == 0) {
        // Just reload same map for endless loop, or generate new
        resetPositions(); 
    }
}

function movePacman(e) {
    if (gameOver) return;

    if (e.code == "ArrowUp" || e.code == "KeyW") pacman.updateDirection('U');
    else if (e.code == "ArrowDown" || e.code == "KeyS") pacman.updateDirection('D');
    else if (e.code == "ArrowLeft" || e.code == "KeyA") pacman.updateDirection('L');
    else if (e.code == "ArrowRight" || e.code == "KeyD") pacman.updateDirection('R');

    if (pacman.direction == 'U') pacman.image = pacmanUpImage;
    else if (pacman.direction == 'D') pacman.image = pacmanDownImage;
    else if (pacman.direction == 'L') pacman.image = pacmanLeftImage;
    else if (pacman.direction == 'R') pacman.image = pacmanRightImage;
}

function collision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    for (let ghost of ghosts.values()) {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.startX = x; this.startY = y;
        this.direction = 'R'; this.velocityX = 0; this.velocityY = 0;
    }
    updateDirection(direction) {
        this.direction = direction;
        if (this.direction == 'U') { this.velocityX = 0; this.velocityY = -tileSize/4; }
        else if (this.direction == 'D') { this.velocityX = 0; this.velocityY = tileSize/4; }
        else if (this.direction == 'L') { this.velocityX = -tileSize/4; this.velocityY = 0; }
        else if (this.direction == 'R') { this.velocityX = tileSize/4; this.velocityY = 0; }
    }
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
    }
}