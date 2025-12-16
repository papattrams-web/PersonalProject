const gridDisplay = document.querySelector(".grid")
const scoreDisplay = document.getElementById("score")
const resultDisplay = document.getElementById("result")

const length = 4
const squares = []
let score = 0

// [NEW] Fairness Variables
let initialBoardState = []; 
let gameStarted = false;

// --- 1. INITIALIZATION & FAIRNESS ---
window.onload = function() {
    // Wait for Game Manager to check if we are P1 or P2
    window.GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            console.log("Local Mode or Error");
            createBoard(null);
            return;
        }

        // CHECK: Is there a board saved? (Are we P2?)
        if (response.board_state && response.board_state !== "null") {
            try {
                let savedData = JSON.parse(response.board_state);
                console.log("Loading P1's Start State...");
                createBoard(savedData);
            } catch (e) {
                createBoard(null);
            }
        } else {
            // We are P1: Generate fresh
            console.log("Generating New Game...");
            createBoard(null);
        }
    });
}

// Updated createBoard to handle Fairness
function createBoard(loadedState) {
    // 1. Create the grid squares (Visuals)
    for (let i = 0; i < (length * length); i++) {
        const square = document.createElement("div")
        square.innerHTML = 0
        gridDisplay.appendChild(square)
        squares.push(square)
    }

    // 2. Populate Tiles
    if (loadedState && loadedState.length > 0) {
        // PLAYER 2: Load the exact tiles P1 had
        for(let i=0; i<squares.length; i++) {
            squares[i].innerHTML = loadedState[i];
        }
    } else {
        // PLAYER 1: Generate Randomly
        generate();
        generate();
        
        // Capture this state to save later
        initialBoardState = squares.map(s => parseInt(s.innerHTML));
    }

    colorTiles();
    gameStarted = true;
}

// --- CORE GAME LOGIC (UNTOUCHED) ---
function generate() {
    const randomNum = Math.floor(Math.random() * squares.length)
    if (squares[randomNum].innerHTML == 0) {
        squares[randomNum].innerHTML = 2
        checkForLoss()
    } else generate()
}

function moveRight() {
    for (let i = 0; i < length * length; i++) {
        if (i % 4 === 0) {
            let sum1 = squares[i].innerHTML
            let sum2 = squares[i + 1].innerHTML
            let sum3 = squares[i + 2].innerHTML
            let sum4 = squares[i + 3].innerHTML

            let row = [parseInt(sum1), parseInt(sum2), parseInt(sum3), parseInt(sum4)]

            let filteredRow = row.filter(num => num)
            let missing = 4 - filteredRow.length
            let zeros = Array(missing).fill(0)
            let newRow = zeros.concat(filteredRow)

            squares[i].innerHTML = newRow[0]
            squares[i + 1].innerHTML = newRow[1]
            squares[i + 2].innerHTML = newRow[2]
            squares[i + 3].innerHTML = newRow[3]
        }
    }
}

function moveLeft() {
    for (let i = 0; i < length * length; i++) {
        if (i % 4 === 0) {
            let sum1 = squares[i].innerHTML
            let sum2 = squares[i + 1].innerHTML
            let sum3 = squares[i + 2].innerHTML
            let sum4 = squares[i + 3].innerHTML

            let row = [parseInt(sum1), parseInt(sum2), parseInt(sum3), parseInt(sum4)]

            let filteredRow = row.filter(num => num)
            let missing = 4 - filteredRow.length
            let zeros = Array(missing).fill(0)
            let newRow = filteredRow.concat(zeros)

            squares[i].innerHTML = newRow[0]
            squares[i + 1].innerHTML = newRow[1]
            squares[i + 2].innerHTML = newRow[2]
            squares[i + 3].innerHTML = newRow[3]
        }
    }
}

function moveUp() {
    for (let i = 0; i < length; i++) {
        if (i % 4 === i) {
            let sum1 = squares[i].innerHTML
            let sum2 = squares[i + length].innerHTML
            let sum3 = squares[i + (length * 2)].innerHTML
            let sum4 = squares[i + (length * 3)].innerHTML

            let column = [parseInt(sum1), parseInt(sum2), parseInt(sum3), parseInt(sum4)]

            let filteredColumn = column.filter(num => num)
            let missing = 4 - filteredColumn.length
            let zeros = Array(missing).fill(0)
            let newColumn = filteredColumn.concat(zeros)

            squares[i].innerHTML = newColumn[0]
            squares[i + length].innerHTML = newColumn[1]
            squares[i + (length * 2)].innerHTML = newColumn[2]
            squares[i + (length * 3)].innerHTML = newColumn[3]
        }
    }
}

function moveDown() {
    for (let i = 0; i < length; i++) {
        if (i % 4 === i) {
            let sum1 = squares[i].innerHTML
            let sum2 = squares[i + length].innerHTML
            let sum3 = squares[i + (length * 2)].innerHTML
            let sum4 = squares[i + (length * 3)].innerHTML

            let column = [parseInt(sum1), parseInt(sum2), parseInt(sum3), parseInt(sum4)]

            let filteredColumn = column.filter(num => num)
            let missing = 4 - filteredColumn.length
            let zeros = Array(missing).fill(0)
            let newColumn = zeros.concat(filteredColumn)

            squares[i].innerHTML = newColumn[0]
            squares[i + length].innerHTML = newColumn[1]
            squares[i + (length * 2)].innerHTML = newColumn[2]
            squares[i + (length * 3)].innerHTML = newColumn[3]
        }
    }
}

function combineRow() {
    for (let i = 0; i < 16; i++) {
        if (i % 4 !== 3) {
            if (squares[i].innerHTML === squares[i + 1].innerHTML) {
                let combinedTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i + 1].innerHTML)

                if (parseInt(squares[i].innerHTML) !== 0) {
                    squares[i].innerHTML = combinedTotal
                    squares[i + 1].innerHTML = 0

                    score += combinedTotal
                    scoreDisplay.innerHTML = score
                }
            }
        }
    }
    checkForWin()
}

function combineColumn() {
    for (let i = 0; i < 12; i++) {
        if (squares[i].innerHTML === squares[i + length].innerHTML) {
            let combinedTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i + length].innerHTML)

            if (parseInt(squares[i].innerHTML) !== 0) {
                squares[i].innerHTML = combinedTotal
                squares[i + length].innerHTML = 0

                score += combinedTotal
                scoreDisplay.innerHTML = score
            }
        }
    }
    checkForWin()
}

function checkForWin() {
    for (let i = 0; i < squares.length; i++) {
        if (squares[i].innerHTML == 2048) {
            resultDisplay.innerHTML = "You Won!"
            document.removeEventListener("keydown", control)
            setTimeout(() => {
                window.GameManager.submitScore(score);
            }, 2000);
        }
    }
}

function checkForLoss() {
    let isBoardFull = true
    let isMovePossible = false

    for (let i = 0; i < squares.length; i++) {
        if (squares[i].innerHTML == 0) {
            isBoardFull = false
            break
        }
    }

    if (isBoardFull) {
        for (let i = 0; i < 16; i++) {
            if (i % 4 !== 3 && squares[i].innerHTML === squares[i + 1].innerHTML && parseInt(squares[i].innerHTML) !== 0) {
                isMovePossible = true
                break
            }
        }

        if (!isMovePossible) {
            for (let i = 0; i < 12; i++) {
                if (squares[i].innerHTML === squares[i + length].innerHTML && parseInt(squares[i].innerHTML) !== 0) {
                    isMovePossible = true
                    break
                }
            }
        }

        if (!isMovePossible) {
            resultDisplay.innerHTML = "Damn, You Lost"
            document.removeEventListener("keydown", control)
            setTimeout(() => {
                window.GameManager.submitScore(score);
            }, 3000);
        }
    }
}

function control(e) {
    if (!gameStarted) return;
    if (!window.GameManager.gameActive) return;

    if (e.key === "ArrowLeft") {
        keyLeft()
    } else if (e.key === "ArrowRight") {
        keyRight()
    } else if (e.key === "ArrowUp") {
        keyUp()
    } else if (e.key === "ArrowDown") {
        keyDown()
    }
}

document.addEventListener("keydown", control)

function keyLeft() {
    const beforeState = squares.map(s => s.innerHTML).join('')
    moveLeft()
    combineRow()
    moveLeft()
    const afterState = squares.map(s => s.innerHTML).join('')
    if (beforeState !== afterState) {
        generate()
        colorTiles()
    }
}

function keyRight() {
    const beforeState = squares.map(s => s.innerHTML).join('')
    moveRight()
    combineRow()
    moveRight()
    const afterState = squares.map(s => s.innerHTML).join('')
    if (beforeState !== afterState) {
        generate()
        colorTiles()
    }
}

function keyUp() {
    const beforeState = squares.map(s => s.innerHTML).join('')
    moveUp()
    combineColumn()
    moveUp()
    const afterState = squares.map(s => s.innerHTML).join('')
    if (beforeState !== afterState) {
        generate()
        colorTiles()
    }
}

function keyDown() {
    const beforeState = squares.map(s => s.innerHTML).join('')
    moveDown()
    combineColumn()
    moveDown()
    const afterState = squares.map(s => s.innerHTML).join('')
    if (beforeState !== afterState) {
        generate()
        colorTiles()
    }
}

function colorTiles() {
    for (let i = 0; i < squares.length; i++) {
        let num = parseInt(squares[i].innerHTML);
        
        squares[i].style.color = "white"; 
        squares[i].style.textShadow = "0px 1px 1px rgba(0,0,0,0.3)"; 

        if (num === 0) {
            squares[i].style.backgroundColor = "#cdc1b4"; 
            squares[i].style.color = "transparent";
            squares[i].style.textShadow = "none";
        } 
        else if (num === 2) squares[i].style.backgroundColor = "#6c5ce7";
        else if (num === 4) squares[i].style.backgroundColor = "#0984e3";
        else if (num === 8) squares[i].style.backgroundColor = "#00b894";
        else if (num === 16) {
            squares[i].style.backgroundColor = "#fdcb6e";
            squares[i].style.color = "#2d3436";
            squares[i].style.textShadow = "none";
        }
        else if (num === 32) squares[i].style.backgroundColor = "#e17055";
        else if (num === 64) squares[i].style.backgroundColor = "#d63031";
        else if (num === 128) squares[i].style.backgroundColor = "#636e72";
        else if (num === 256) squares[i].style.backgroundColor = "#00cec9";
        else if (num === 512) squares[i].style.backgroundColor = "#e84393";
        else if (num === 1024) squares[i].style.backgroundColor = "#2d3436";
        else if (num === 2048) {
            squares[i].style.backgroundColor = "#fab1a0";
            squares[i].style.boxShadow = "0 0 10px #fab1a0";
            squares[i].style.color = "#2d3436";
            squares[i].style.textShadow = "none";
        }
        else {
             squares[i].style.backgroundColor = "#3c3a32"; 
             squares[i].style.color = "#f9f6f2";
        }
    }
}

// --- 3. SUBMISSION OVERRIDE (MODAL & REDIRECT) ---
window.GameManager.submitScore = function(scoreVal) {
    this.gameActive = false;
    const matchId = this.getMatchId();
    
    // Create "Game Over" Popup
    let cover = document.getElementById('gm-game-over-modal');
    if (!cover) {
        cover = document.createElement('div');
        cover.id = 'gm-game-over-modal';
        // Matches the 2048 theme colors (Beige/Brown)
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(238, 228, 218, 0.9);z-index:99999;display:flex;align-items:center;justify-content:center;color:#776e65;flex-direction:column;font-family:sans-serif;";
        
        cover.innerHTML = `
            <h1 style="font-size:3rem; margin-bottom:10px;">GAME OVER</h1>
            <h2 style="font-size:2rem; margin-bottom:30px; color:#6c5ce7;">Score: ${scoreVal}</h2>
            <div id="gm-status-msg" style="color:#776e65; margin-bottom:20px; font-size:1.2rem;">Saving results...</div>
            <button id="gm-continue-btn" style="display:none; padding:15px 30px; font-size:1.5rem; background:#8f7a66; color:white; border:none; border-radius:3px; cursor:pointer;">CONTINUE</button>
        `;
        document.body.appendChild(cover);
        
        document.getElementById('gm-continue-btn').addEventListener('click', () => {
            if (this.redirectUrl) window.location.href = this.redirectUrl;
            else window.location.href = '../history_page.php';
        });
    }

    // Payload
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    // If P1 (Start State exists), save it for P2
    if (initialBoardState && initialBoardState.length > 0) {
        payload.board_state = JSON.stringify(initialBoardState);
    }

    // Send
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
            statusMsg.innerText = "Score Saved!";
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
        if(statusMsg) statusMsg.innerText = "Error Saving Score.";
    });
};