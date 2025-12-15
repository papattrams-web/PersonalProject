const board = document.querySelector(".board");
const playBtn = document.querySelector("#play");
const statusMsg = document.querySelector("#status-msg");

let boardArray = [];
let myRole = null; // 'P1' or 'P2'
let currentPhase = 'wait'; // 'guess', 'hide', 'wait'
let selectedTileIndex = null;
const TOTAL_ROUNDS = 6; // 3 rounds each

// Default State
let gameState = {
    hiddenIndex: null, // The index where the opponent hid their piece
    scores: { p1: 0, p2: 0 },
    roundsPlayed: 0
};

// --- 1. INITIALIZATION ---
GameManager.init('tictactoe', 'win'); // Init global manager

// Load the match state from DB
GameManager.loadMatchState(function(response) {
    // Error Handling
    if (!response || response.error) {
        statusMsg.innerText = "Error: Match not found.";
        return;
    }

    // 1. Determine Roles
    if (MY_USER_ID == response.player1_id) myRole = 'P1';
    else if (MY_USER_ID == response.player2_id) myRole = 'P2';
    else {
        statusMsg.innerText = "Spectator Mode";
        createBoard();
        return;
    }

    // 2. Parse Board State
    if (response.board_state && response.board_state !== "null") {
        try {
            gameState = JSON.parse(response.board_state);
        } catch (e) { console.error("State parse error", e); }
    }

    // 3. Determine Turn & Phase
    // The DB status tells us whose turn it is
    let dbStatus = response.status; 
    let isMyTurn = false;

    if (dbStatus === 'active' && myRole === 'P1' && gameState.roundsPlayed === 0) isMyTurn = true; // Start of game
    if (dbStatus === 'waiting_p1' && myRole === 'P1') isMyTurn = true;
    if (dbStatus === 'waiting_p2' && myRole === 'P2') isMyTurn = true;

    if (isMyTurn) {
        // LOGIC: If there is a hidden index, I must guess first.
        // If there is NO hidden index, I must hide.
        if (gameState.hiddenIndex !== null) {
            enterPhase('guess');
        } else {
            enterPhase('hide');
        }
    } else {
        enterPhase('wait');
    }

    createBoard();
});

// --- 2. PHASE MANAGEMENT ---
function enterPhase(phase) {
    currentPhase = phase;
    selectedTileIndex = null;
    playBtn.style.display = 'none';

    if (phase === 'hide') {
        statusMsg.innerText = "YOUR TURN: Select a tile to HIDE your character!";
        statusMsg.style.color = "#00d2ff"; // Cyan
    } 
    else if (phase === 'guess') {
        statusMsg.innerText = "GUESS! Where did your opponent hide?";
        statusMsg.style.color = "#e74c3c"; // Red
    } 
    else if (phase === 'wait') {
        statusMsg.innerText = "Waiting for opponent to move...";
        statusMsg.style.color = "#ccc";
    }
    
    // Refresh board visuals
    if(board.children.length > 0) updateBoardVisuals();
}

// --- 3. BOARD RENDER ---
function createBoard() {
    board.innerHTML = '';
    boardArray = [];

    for (let i = 0; i < 9; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.index = i;
        
        tile.addEventListener("click", () => onTileClick(tile, i));
        board.appendChild(tile);
        boardArray.push(tile);
    }
}

function updateBoardVisuals() {
    boardArray.forEach(t => {
        t.innerText = "";
        t.style.background = "rgba(255, 255, 255, 0.05)";
        t.style.cursor = (currentPhase === 'wait') ? "default" : "pointer";
    });
}

// --- 4. GAMEPLAY INTERACTIONS ---
function onTileClick(tile, index) {
    if (currentPhase === 'wait') return;

    // Visual Selection
    updateBoardVisuals(); // Clear others
    tile.style.background = "rgba(0, 210, 255, 0.2)";
    tile.innerText = (currentPhase === 'hide') ? "X" : "?";

    selectedTileIndex = index;
    
    // Show Button
    playBtn.style.display = 'inline-block';
    playBtn.innerText = (currentPhase === 'hide') ? "CONFIRM HIDE" : "CONFIRM GUESS";
}

playBtn.addEventListener("click", function() {
    if (selectedTileIndex === null) return;

    if (currentPhase === 'guess') {
        resolveGuess();
    } else if (currentPhase === 'hide') {
        submitTurn();
    }
});

// --- 5. LOGIC: GUESSING ---
function resolveGuess() {
    let correctIndex = gameState.hiddenIndex;
    let isCorrect = (selectedTileIndex === correctIndex);

    // Update Score
    if (isCorrect) {
        if (myRole === 'P1') gameState.scores.p1++;
        else gameState.scores.p2++;
        alert("CORRECT! You found them!");
    } else {
        alert(`WRONG! They were at tile ${correctIndex + 1}.`);
    }

    // Increment Round
    gameState.roundsPlayed++;
    gameState.hiddenIndex = null; // Clear the hidden spot for the next turn

    // Check Game Over
    if (gameState.roundsPlayed >= TOTAL_ROUNDS) {
        endGame();
        return;
    }

    // Now switch to HIDE phase immediately
    alert("Now it's YOUR turn to hide!");
    enterPhase('hide');
}

// --- 6. LOGIC: SUBMITTING TURN ---
function submitTurn() {
    // We are in 'hide' phase, so we save the hidden index
    gameState.hiddenIndex = selectedTileIndex;
    
    // Send to Database
    const jsonState = JSON.stringify(gameState);

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game: 'tictactoe',
            type: 'turn_update',
            match_id: MATCH_ID,
            score: 0, // Score is tracked inside jsonState
            board_state: jsonState
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            window.location.href = "../lobby.php?msg=turn_sent";
        } else {
            alert("Error saving turn.");
        }
    });
}

// --- 7. GAME OVER ---
// --- 7. GAME OVER ---
function endGame() {
    let p1 = gameState.scores.p1;
    let p2 = gameState.scores.p2;
    
    // 1. Calculate the result for the database
    // score: 1 (Win), -1 (Loss), 0 (Draw)
    let myResult = 0;

    if (myRole === 'P1') {
        if (p1 > p2) myResult = 1;       // I won
        else if (p2 > p1) myResult = -1; // I lost
    } else {
        if (p2 > p1) myResult = 1;       // I won
        else if (p1 > p2) myResult = -1; // I lost
    }
    
    let msg = `GAME OVER!\nScore: P1(${p1}) - P2(${p2})`;
    if (myResult === 1) msg += "\nVICTORY!";
    else if (myResult === -1) msg += "\nDEFEAT!";
    else msg += "\nDRAW!";
    
    alert(msg);

    // 2. Send 'win' type to force status='completed' in DB
    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game: 'tictactoe',
            type: 'win', // <--- CHANGED from 'turn_update'
            match_id: MATCH_ID,
            score: myResult
        })
    }).then(() => {
        // Redirect to history to see the final result
        window.location.href = "../history_page.php"; 
    });
}
