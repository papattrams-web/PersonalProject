const boardDisplay = document.querySelector("#board");
const digitsDisplay = document.querySelector("#digits");
const scoreDisplay = document.getElementById("actual-score");

let squares = [];       // HTML Elements
let solvedGrid = [];    // The Answer Key [1-9]
let initialGrid = [];   // The Starting State [0-9] (0 = empty)
let numSelected = null;
let score = 0;

// --- 1. GAME START LOGIC ---
// --- 1. GAME START LOGIC ---
GameManager.loadMatchState(function(response) {
    if (!response || response.error) {
        console.error("Error loading match.");
        createPuzzleAndRender(); // Fallback
        return;
    }

    // CHECK: Is there a saved board from the opponent?
    // We check for both null (object) and "null" (string from DB)
    if (response.board_state && response.board_state !== "null") {
        console.log("Loading Saved Board...");
        try {
            let savedData = JSON.parse(response.board_state);
            loadPuzzle(savedData);
        } catch (e) {
            console.error("Error parsing board state:", e);
            createPuzzleAndRender(); // Fallback if data is corrupt
        }
    } 
    else {
        // No board exists yet (I am the first to play)
        console.log("Generating New Board...");
        createPuzzleAndRender();
    }
});

// --- 2. BOARD GENERATION (Memory First) ---
function createPuzzleAndRender() {
    // 1. Generate Solved Grid in Memory (Fast)
    solvedGrid = generateSolvedGridInMem();
    
    // 2. Create Holes (The Puzzle)
    // Deep copy the solved grid to start
    initialGrid = [...solvedGrid];
    
    let hints = 35; // How many numbers to KEEP
    let holes = 81 - hints;
    
    while (holes > 0) {
        let idx = Math.floor(Math.random() * 81);
        if (initialGrid[idx] !== 0) {
            initialGrid[idx] = 0; // 0 represents empty
            holes--;
        }
    }

    // 3. Render to HTML
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

    // Visual Update
    this.innerText = numSelected.innerText;

    // Logic Update & Scoring
    updateScore();
}

function updateScore() {
    let currentScore = 0;
    
    for(let i=0; i<81; i++) {
        // Only count tiles that were initially empty (player moves)
        if (initialGrid[i] === 0) {
            let playerVal = parseInt(squares[i].innerText);
            
            // Check if input matches the pre-generated solution
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

// --- 5. FAST GENERATOR (Backtracking) ---
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
            
            if (Math.floor(i/9) === r && v === val) return false; // Row
            if (i%9 === c && v === val) return false; // Col
            if (boxNum(i) === b && v === val) return false; // Box
        }
        return true;
    }

    function fill(idx) {
        if (idx >= 81) return true;
        
        values.sort(() => Math.random() - 0.5); // Shuffle
        
        for (let v of values) {
            if (isValid(idx, v)) {
                grid[idx] = v;
                if (fill(idx + 1)) return true;
                grid[idx] = 0; // Backtrack
            }
        }
        return false;
    }
    
    fill(0);
    return grid;
}

// --- 6. OVERRIDE SUBMISSION ---
// We need to send the board layout if we are Player 1
GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    // If we have board data (P1 generated it), attach it
    // We check if we actually have data to send
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
        if(data.status === 'success') {
            window.location.href = '../homepage.php';
        } else {
            console.error("Score Error:", data);
            alert("Error saving score: " + data.message);
        }
    });
};