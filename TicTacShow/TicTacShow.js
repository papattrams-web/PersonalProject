const boardEl = document.getElementById("board");
const confirmBtn = document.getElementById("confirm-btn"); // Matches the new PHP ID
const statusMsg = document.getElementById("status-msg");
const instructionBox = document.getElementById("instruction-box");
const toolSelector = document.getElementById("tool-selector");
const btnX = document.getElementById("btn-x");
const btnO = document.getElementById("btn-o");
const scoreP1El = document.getElementById("score-p1");
const scoreP2El = document.getElementById("score-p2");

let tiles = [];
let myRole = null; // 'p1' or 'p2'
let activeTool = null; // 'X' or 'O'

// Current Turn Selection
let mySelection = { 
    hideIndex: null, 
    guessIndex: null 
};

// GLOBAL STATE
let gameState = {
    round: 1,
    scores: { p1: 0, p2: 0 },
    p1_move: null, 
    p2_move: null
};

// --- 1. INITIALIZATION ---
// Ensure GameManager is loaded before this script runs
if (typeof GameManager !== 'undefined') {
    GameManager.init('tictactoe', 'win'); 

    GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            if(instructionBox) instructionBox.innerText = "Error: Match not found.";
            return;
        }

        // Role Assignment
        if (MY_USER_ID == response.player1_id) myRole = 'p1';
        else if (MY_USER_ID == response.player2_id) myRole = 'p2';
        else { 
            if(instructionBox) instructionBox.innerText = "Spectator Mode"; 
            return; 
        }

        // Load Previous State
        if (response.board_state && response.board_state !== "null") {
            try { gameState = JSON.parse(response.board_state); } 
            catch (e) { console.error("State Error", e); }
        }

        updateScoreboard();
        createBoard();
        checkTurn();
    });
} else {
    console.error("GameManager not found!");
}

// --- 2. LOGIC & UI ---
function checkTurn() {
    let myMoveField = myRole + "_move";
    
    // Have I moved yet?
    if (gameState[myMoveField] !== null) {
        // I moved, waiting for opponent
        instructionBox.innerHTML = "Move Submitted!<br>Waiting for opponent to play...";
        instructionBox.style.borderLeftColor = "#f1c40f";
        toolSelector.style.display = "none";
        confirmBtn.style.display = "none";
        
        renderLockedBoard(gameState[myMoveField]);
        
        // Simple Poll to check for opponent move
        setTimeout(() => location.reload(), 5000); 
    } 
    else {
        // My turn to move
        let myChar = (myRole === 'p1') ? 'X' : 'O';
        let oppChar = (myRole === 'p1') ? 'O' : 'X';
        
        instructionBox.innerHTML = `Place <b style="color:#00d2ff">${myChar}</b> to HIDE.<br>Place <b style="color:#e74c3c">${oppChar}</b> to GUESS opponent's hiding spot.`;
        instructionBox.style.borderLeftColor = "#00d2ff";
        
        toolSelector.style.display = "flex";
        confirmBtn.style.display = "inline-block";
        confirmBtn.disabled = false;
        confirmBtn.innerText = "CONFIRM MOVE";
        
        // Auto-select my character tool first
        selectTool(myChar); 
        enableInput();
    }
}

function selectTool(tool) {
    activeTool = tool;
    if(btnX) btnX.classList.remove("active");
    if(btnO) btnO.classList.remove("active");
    
    if (tool === 'X' && btnX) btnX.classList.add("active");
    if (tool === 'O' && btnO) btnO.classList.add("active");
}

// --- 3. INPUT HANDLING ---
function createBoard() {
    boardEl.innerHTML = '';
    tiles = [];
    for (let i = 0; i < 9; i++) {
        let t = document.createElement("div");
        t.className = "tile";
        t.dataset.index = i;
        boardEl.appendChild(t);
        tiles.push(t);
    }
}

function enableInput() {
    tiles.forEach((tile, index) => {
        tile.onclick = () => handleTileClick(index);
    });
    
    // FIX: Ensure button exists before adding listener
    if(confirmBtn) {
        confirmBtn.onclick = submitMove;
    }
}

function handleTileClick(index) {
    let myChar = (myRole === 'p1') ? 'X' : 'O';
    
    if (activeTool === myChar) {
        // Hiding Logic
        if (mySelection.hideIndex === index) {
            mySelection.hideIndex = null; 
        } else {
            if (mySelection.guessIndex === index) mySelection.guessIndex = null;
            mySelection.hideIndex = index;
        }
    } else {
        // Guessing Logic
        if (mySelection.guessIndex === index) {
            mySelection.guessIndex = null; 
        } else {
            if (mySelection.hideIndex === index) mySelection.hideIndex = null;
            mySelection.guessIndex = index;
        }
    }
    renderSelection();
}

function renderSelection() {
    tiles.forEach(t => {
        t.innerText = "";
        t.classList.remove("mark-x", "mark-o");
    });

    if (mySelection.hideIndex !== null) {
        let char = (myRole === 'p1') ? 'X' : 'O';
        let cls = (myRole === 'p1') ? 'mark-x' : 'mark-o';
        tiles[mySelection.hideIndex].innerText = char;
        tiles[mySelection.hideIndex].classList.add(cls);
    }

    if (mySelection.guessIndex !== null) {
        let char = (myRole === 'p1') ? 'O' : 'X';
        let cls = (myRole === 'p1') ? 'mark-o' : 'mark-x';
        tiles[mySelection.guessIndex].innerText = char;
        tiles[mySelection.guessIndex].classList.add(cls);
    }
}

function renderLockedBoard(move) {
    let myChar = (myRole === 'p1') ? 'X' : 'O';
    let oppChar = (myRole === 'p1') ? 'O' : 'X';

    if (move.hideIndex !== null) {
        tiles[move.hideIndex].innerText = myChar;
        tiles[move.hideIndex].classList.add(myChar === 'X' ? 'mark-x' : 'mark-o');
    }
    if (move.guessIndex !== null) {
        tiles[move.guessIndex].innerText = oppChar;
        tiles[move.guessIndex].classList.add(oppChar === 'X' ? 'mark-x' : 'mark-o');
    }
}

// --- 4. SUBMISSION ---
function submitMove() {
    if (mySelection.hideIndex === null || mySelection.guessIndex === null) {
        alert("Incomplete! Place ONE 'X' and ONE 'O' on the board.");
        return;
    }

    confirmBtn.innerText = "Submitting...";
    confirmBtn.disabled = true;

    // Update Local State
    gameState[myRole + "_move"] = mySelection;

    // Check if opponent moved
    let oppRole = (myRole === 'p1') ? 'p2' : 'p1';
    
    if (gameState[oppRole + "_move"] !== null) {
        resolveRoundAndSave(); // I am second
    } else {
        saveState(); // I am first
    }
}

// --- 5. RESOLUTION ---
function resolveRoundAndSave() {
    let p1 = gameState.p1_move;
    let p2 = gameState.p2_move;
    
    // Logic: P1 wins round if P1.guess == P2.hide
    let p1Win = (p1.guessIndex === p2.hideIndex);
    let p2Win = (p2.guessIndex === p1.hideIndex);
    
    let msg = "";
    if (p1Win && !p2Win) {
        gameState.scores.p1++;
        msg = "P1 guessed correctly! (Point P1)";
    } else if (p2Win && !p1Win) {
        gameState.scores.p2++;
        msg = "P2 guessed correctly! (Point P2)";
    } else if (p1Win && p2Win) {
        msg = "Both guessed correctly! (Draw Round)";
    } else {
        msg = "Both missed! (Draw Round)";
    }
    
    alert("Round Result:\n" + msg);
    
    if (gameState.scores.p1 >= 2 || gameState.scores.p2 >= 2) {
        endGameMatch();
        return; 
    }
    
    // Next Round
    gameState.round++;
    gameState.p1_move = null;
    gameState.p2_move = null;
    saveState();
}

function saveState() {
    const matchId = GameManager.getMatchId();
    
    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game: 'tictactoe',
            type: 'turn_update',
            match_id: matchId,
            score: 0,
            board_state: JSON.stringify(gameState)
        })
    })
    .then(res => res.json())
    .then(data => {
        // If tournament, go to bracket. Otherwise, go to history.
        if(data.tournament_id) {
            window.location.href = "../tournament/view.php?id=" + data.tournament_id;
        } else {
            window.location.href = "../history_page.php";
        }
    })
    .catch(e => {
        console.error(e);
        alert("Error saving state");
    });
}

function endGameMatch() {
    let s1 = gameState.scores.p1;
    let s2 = gameState.scores.p2;
    let myResult = 0; 
    if (myRole === 'p1') myResult = (s1 > s2) ? 1 : -1;
    else myResult = (s2 > s1) ? 1 : -1;
    
    GameManager.submitScore(myResult);
}

function updateScoreboard() {
    if(scoreP1El) scoreP1El.innerText = `P1 (X): ${gameState.scores.p1}`;
    if(scoreP2El) scoreP2El.innerText = `P2 (O): ${gameState.scores.p2}`;
}