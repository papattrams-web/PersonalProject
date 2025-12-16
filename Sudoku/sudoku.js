const boardDisplay = document.querySelector("#board");
const digitsDisplay = document.querySelector("#digits");
const scoreDisplay = document.getElementById("actual-score");

let squares = [];       
let solvedGrid = [];    
let initialGrid = [];   
let numSelected = null;
let score = 0;
let errors = 0; // [NEW] Track errors

// --- 1. GAME START LOGIC ---
GameManager.loadMatchState(function(response) {
    if (!response || response.error) {
        console.error("Error loading match.");
        createPuzzleAndRender(); 
        return;
    }

    if (response.board_state && response.board_state !== "null") {
        console.log("Loading Saved Board...");
        try {
            let savedData = JSON.parse(response.board_state);
            loadPuzzle(savedData);
        } catch (e) {
            console.error("Error parsing board state:", e);
            createPuzzleAndRender(); 
        }
    } 
    else {
        console.log("Generating New Board...");
        createPuzzleAndRender();
    }
});

// --- 2. BOARD GENERATION ---
function createPuzzleAndRender() {
    solvedGrid = generateSolvedGridInMem();
    initialGrid = [...solvedGrid];
    
    let hints = 35; 
    let holes = 81 - hints;
    
    while (holes > 0) {
        let idx = Math.floor(Math.random() * 81);
        if (initialGrid[idx] !== 0) {
            initialGrid[idx] = 0; 
            holes--;
        }
    }
    renderBoard();
}

function loadPuzzle(data) {
    solvedGrid = data.solution;
    initialGrid = data.initial;
    renderBoard();
}

function renderBoard() {
    boardDisplay.innerHTML = "";
    squares = [];
    
    for (let i = 0; i < 81; i++) {
        const square = document.createElement("div");
        square.addEventListener("click", selectTile);
        square.classList.add("tile");
        square.classList.add("box" + boxNum(i));
        
        // [NEW] Add ID so we can check solution in selectTile
        square.id = i; 
        
        let val = initialGrid[i];
        if (val !== 0) {
            square.innerText = val;
            square.classList.add("immutable");
        } else {
            square.innerText = "";
        }

        boardDisplay.appendChild(square);
        squares.push(square);
    }
    populateDigits();
}

// --- 3. SCORING & INTERACTION ---
function selectNumber() {
    if (numSelected != null) {
        numSelected.classList.remove("number-selected");
    }
    numSelected = this;
    numSelected.classList.add("number-selected");
}

function selectTile() {
    if (this.classList.contains("immutable")) return;
    if (!numSelected) return;

    // [NEW] EXTREME MODE LOGIC
    let idx = parseInt(this.id);
    let selectedVal = parseInt(numSelected.innerText);

    // Check against the solution
    if (solvedGrid[idx] === selectedVal) {
        // CORRECT: Place the number
        this.innerText = selectedVal;
        
        // Check if this was the last move (Win)
        // (Optional: You can add win logic here)
        
        updateScore();
    } else {
        // WRONG: Silent Error
        errors++;
        console.log("Errors: " + errors); // Only visible in console
        
        // DO NOT change color (Silent)
        
        // Check Game Over
        if (errors >= 3) {
            alert("GAME OVER! You made 3 errors.");
            // Submit current score and end game
            GameManager.submitScore(score);
        }
    }
}

function updateScore() {
    let currentScore = 0;
    for(let i=0; i<81; i++) {
        if (initialGrid[i] === 0) {
            let playerVal = parseInt(squares[i].innerText);
            if (!isNaN(playerVal) && playerVal === solvedGrid[i]) {
                currentScore++;
            }
        }
    }
    score = currentScore;
    scoreDisplay.innerText = score;
}

// --- 4. DATA HELPERS ---
function boxNum(i) {
    let r = Math.floor(i / 9);
    let c = i % 9;
    return (Math.floor(r / 3) * 3) + Math.floor(c / 3) + 1;
}

function populateDigits() {
    digitsDisplay.innerHTML = "";
    for (let i = 1; i <= 9; i++) {
        const square = document.createElement("div");
        square.addEventListener("click", selectNumber);
        square.classList.add("tile");
        square.innerText = i;
        digitsDisplay.appendChild(square);
    }
}

// --- 5. FAST GENERATOR ---
function generateSolvedGridInMem() {
    let grid = new Array(81).fill(0);
    let values = [1,2,3,4,5,6,7,8,9];
    
    function isValid(idx, val) {
        let r = Math.floor(idx/9);
        let c = idx%9;
        let b = boxNum(idx);
        
        for(let i=0; i<81; i++) {
            if (i === idx) continue;
            let v = grid[i];
            if (v === 0) continue;
            if (Math.floor(i/9) === r && v === val) return false; 
            if (i%9 === c && v === val) return false; 
            if (boxNum(i) === b && v === val) return false; 
        }
        return true;
    }

    function fill(idx) {
        if (idx >= 81) return true;
        values.sort(() => Math.random() - 0.5); 
        
        for (let v of values) {
            if (isValid(idx, v)) {
                grid[idx] = v;
                if (fill(idx + 1)) return true;
                grid[idx] = 0; 
            }
        }
        return false;
    }
    
    fill(0);
    return grid;
}

// --- 6. OVERRIDE SUBMISSION ---
GameManager.submitScore = function(scoreVal) {
    clearInterval(this.timer);
    this.gameActive = false;

    const matchId = this.getMatchId();
    
    let cover = document.getElementById('gm-game-over-modal');
    if (!cover) {
        cover = document.createElement('div');
        cover.id = 'gm-game-over-modal';
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;flex-direction:column;font-family:'Courier New', monospace;";
        
        cover.innerHTML = `
            <h1 style="font-size:3rem; margin-bottom:10px;">GAME OVER</h1>
            <h2 style="font-size:2rem; margin-bottom:30px; color:#f1c40f;">Score: ${scoreVal}</h2>
            <div id="gm-status-msg" style="color:#aaa; margin-bottom:20px; font-size:1.2rem;">Saving results...</div>
            <button id="gm-continue-btn" style="display:none; padding:15px 30px; font-size:1.2rem; background:#2ecc71; color:white; border:none; border-radius:5px; cursor:pointer;">CONTINUE</button>
        `;
        document.body.appendChild(cover);
        
        document.getElementById('gm-continue-btn').addEventListener('click', () => {
            if (this.redirectUrl) window.location.href = this.redirectUrl;
            else window.location.href = '../history_page.php';
        });
    }

    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    if (initialGrid.length > 0 && solvedGrid.length > 0) {
        payload.board_state = JSON.stringify({
            initial: initialGrid,
            solution: solvedGrid
        });
    }

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        const statusMsg = document.getElementById('gm-status-msg');
        const btn = document.getElementById('gm-continue-btn');
        
        if(statusMsg && btn) {
            statusMsg.innerText = "Saved Successfully!";
            statusMsg.style.color = "#2ecc71";
            btn.style.display = "block";
            
            if (data.tournament_id) {
                this.redirectUrl = '../tournament/view.php?id=' + data.tournament_id;
            } else {
                this.redirectUrl = '../history_page.php';
            }
        }
    })
    .catch(err => {
        const statusMsg = document.getElementById('gm-status-msg');
        if(statusMsg) {
            statusMsg.innerText = "Error Saving Score. Check Connection.";
            statusMsg.style.color = "#e74c3c";
        }
    });
};