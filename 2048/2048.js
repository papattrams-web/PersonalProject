const gridDisplay = document.querySelector(".grid")
const scoreDisplay = document.getElementById("score")
const resultDisplay = document.getElementById("result")

const length = 4
const squares = []
let score = 0

//Creating board
function createBoard() {
    for (let i = 0; i < (length * length); i++) {
        const square = document.createElement("div")
        square.innerHTML = 0
        gridDisplay.appendChild(square)
        squares.push(square)
    }
    generate()
    generate()
}

createBoard()
colorTiles()

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
            
            // --- ADDED: Submit Score on Win ---
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
            
            // --- ADDED: Submit Score on Loss ---
            setTimeout(() => {
                window.GameManager.submitScore(score);
            }, 3000);
        }
    }
}

function control(e) {
    // --- ADDED: Global Pause Check ---
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