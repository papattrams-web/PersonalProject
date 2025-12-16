const boardEl = document.getElementById("board");
const playBtn = document.getElementById("play");
const statusMsg = document.getElementById("status-msg");
const scoreP1El = document.getElementById("score-p1");
const scoreP2El = document.getElementById("score-p2");

let tiles = [];
let myRole = null; // 'p1' or 'p2'
let mySelection = { hide: null, guess: null };

// STATE SCHEMA
let gameState = {
    round: 1,
    scores: { p1: 0, p2: 0 },
    p1_move: null, // { hide: 2, guess: 5 }
    p2_move: null
};

// --- 1. INITIALIZATION ---
GameManager.init('tictactoe', 'win'); 

GameManager.loadMatchState(function(response) {
    if (!response || response.error) return;

    // Determine Role
    if (MY_USER_ID == response.player1_id) myRole = 'p1';
    else if (MY_USER_ID == response.player2_id) myRole = 'p2';
    else { statusMsg.innerText = "Spectator Mode"; return; }

    // Load State
    if (response.board_state && response.board_state !== "null") {
        try { gameState = JSON.parse(response.board_state); } 
        catch (e) { console.error(e); }
    }

    updateScoreboard();
    createBoard();
    checkTurn(response.status);
});

// --- 2. GAME LOGIC ---
function checkTurn(dbStatus) {
    // Has round finished? (Both moves present)
    if (gameState.p1_move && gameState.p2_move) {
        resolveRound(); // Calculate who won the round
        return;
    }

    // Is it my turn to input?
    let myMoveField = myRole + "_move";
    if (gameState[myMoveField] !== null) {
        // I already moved, waiting for opponent
        statusMsg.innerText = "Waiting for opponent...";
        playBtn.style.display = "none";
        renderLockedBoard(gameState[myMoveField]);
    } else {
        // I need to move
        // Note: In simultaneous play, "waiting_p1" just means DB is open. 
        // We allow move if my slot is null.
        statusMsg.innerText = "Select: 1 Hide (Green) & 1 Attack (Red)";
        playBtn.style.display = "inline-block";
        playBtn.innerText = "CONFIRM MOVE";
        enableInput();
    }
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
        tile.onclick = () => {
            // Logic: 
            // 1. If clicked 'hide', deselect it.
            // 2. If clicked 'guess', deselect it.
            // 3. If empty:
            //    - If no hide set, set hide.
            //    - If hide set but no guess, set guess.
            //    - If both set, replace guess.
            
            if (mySelection.hide === index) mySelection.hide = null;
            else if (mySelection.guess === index) mySelection.guess = null;
            else {
                if (mySelection.hide === null) mySelection.hide = index;
                else mySelection.guess = index;
            }
            renderSelection();
        };
    });
    
    playBtn.onclick = submitMove;
}

function renderSelection() {
    tiles.forEach(t => t.className = "tile"); // Reset
    if (mySelection.hide !== null) tiles[mySelection.hide].classList.add("my-hide");
    if (mySelection.guess !== null) tiles[mySelection.guess].classList.add("my-guess");
}

function renderLockedBoard(move) {
    tiles.forEach(t => {
        t.className = "tile";
        t.onclick = null; // Disable click
    });
    if (move.hide !== null) {
        tiles[move.hide].classList.add("my-hide");
        tiles[move.hide].innerText = "H";
    }
    if (move.guess !== null) {
        tiles[move.guess].classList.add("my-guess");
        tiles[move.guess].innerText = "A";
    }
}

// --- 4. SUBMISSION ---
function submitMove() {
    if (mySelection.hide === null || mySelection.guess === null) {
        alert("You must pick both a Hiding spot and an Attack spot!");
        return;
    }

    // Update Local State
    gameState[myRole + "_move"] = mySelection;

    // Send to DB
    // We send 'turn_update'. Logic:
    // If I am the second one to submit, I will technically just save.
    // BUT, the next reload (or immediate logic) needs to resolve.
    // To make it instant, let's resolve LOCALLY if we have both, then save the CLEANED state.
    
    // Check if opponent moved
    let oppRole = (myRole === 'p1') ? 'p2' : 'p1';
    
    // If opponent already moved (it's in gameState), we can resolve NOW.
    if (gameState[oppRole + "_move"]) {
        resolveAndSave(); // I am the second player
    } else {
        // I am the first player, just save my wait state
        saveState("Waiting for " + oppRole + "...");
    }
}

// --- 5. ROUND RESOLUTION ---
function resolveAndSave() {
    let p1 = gameState.p1_move;
    let p2 = gameState.p2_move;
    
    // Logic:
    // P1 Point: P1.guess == P2.hide
    // P2 Point: P2.guess == P1.hide
    
    let p1Hit = (p1.guess === p2.hide);
    let p2Hit = (p2.guess === p1.hide);
    
    let msg = "";
    
    if (p1Hit && !p2Hit) {
        gameState.scores.p1++;
        msg = "P1 Hit P2! (P1 Round Win)";
    } else if (p2Hit && !p1Hit) {
        gameState.scores.p2++;
        msg = "P2 Hit P1! (P2 Round Win)";
    } else if (p1Hit && p2Hit) {
        msg = "Double Hit! (Draw Round)";
    } else {
        msg = "Both Missed! (Draw Round)";
    }
    
    alert("Round Result:\n" + msg);
    
    // Check Win Condition (First to 2)
    if (gameState.scores.p1 >= 2 || gameState.scores.p2 >= 2) {
        endGameMatch();
        return;
    }
    
    // Reset for Next Round
    gameState.round++;
    gameState.p1_move = null;
    gameState.p2_move = null;
    
    saveState("Starting Round " + gameState.round);
}

function saveState(logMsg) {
    const jsonState = JSON.stringify(gameState);
    
    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game: 'tictactoe',
            type: 'turn_update', // Updates state
            match_id: GameManager.getMatchId(), // Use global getter
            score: 0,
            board_state: jsonState
        })
    })
    .then(res => res.json())
    .then(data => {
        // Reload to update UI
        window.location.reload();
    });
}

// --- 6. END GAME ---
function endGameMatch() {
    let s1 = gameState.scores.p1;
    let s2 = gameState.scores.p2;
    
    let myResult = 0; // 1=Win, -1=Loss
    if (myRole === 'p1') myResult = (s1 > s2) ? 1 : -1;
    else myResult = (s2 > s1) ? 1 : -1;
    
    alert(`GAME OVER! Final Score: ${s1} - ${s2}`);
    
    // Submit Final Result
    GameManager.submitScore(myResult);
}

function updateScoreboard() {
    scoreP1El.innerText = "P1: " + gameState.scores.p1;
    scoreP2El.innerText = "P2: " + gameState.scores.p2;
}