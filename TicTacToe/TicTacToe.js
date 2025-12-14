const board= document.querySelector(".board")
const play= document.querySelector("#play")
const characterTile= document.querySelector(".characters")

const characters= []
const boardArray= []

let inserted= null
let selectedTile= null
let winner= null

const length= 3

function startGame(){
    play.removeEventListener("click", startGame)
    play.addEventListener("click", clickPlay)
    play.innerText= "Play"

    board.innerHTML = ''
    boardArray.length = 0
    characterTile.innerHTML = ''

    createBoard()
    populateChar()

    inserted = null
    selectedTile = null
    winner = null

    // currentPlayer = null 
    // opponent = null
    // gameActive = true
    
    // play.innerText= "SELECT PLAYER" // CHANGE: Button text updated to guide user
    // play.removeEventListener("click", playAgain) // Ensure old listener is removed
    // play.addEventListener("click", clickPlay)
}

startGame()

function createBoard(){
    for(let i=0; i<Math.pow(length, 2); i++){
        const tile= document.createElement("div")

        tile.classList.add("tile")
        tile.addEventListener("click", insertChar)

        board.appendChild(tile)
        boardArray.push(tile)

    }
}

function populateChar(){
    characters.length= 0
    characters.push("X")
    characters.push("O")

    for(let i=0; i<characters.length; i++){
        const tile= document.createElement("div")

        tile.innerText= characters[i]

        tile.classList.add("characters")
        tile.classList.add("tile")
        tile.addEventListener("click", selected)

        characterTile.appendChild(tile)

    }
}

function selected(){
    if(selectedTile!=null){
        selectedTile.classList.remove("selected")
    }
    
    selectedTile= this
    selectedTile.classList.add("selected")
}

function insertChar(){
    if(!selectedTile||this.classList.contains("immutable"))return
    
    if(inserted!=null){
        inserted.innerText= null
        this.innerText= selectedTile.innerText
    }
    
    this.innerText= selectedTile.innerText
    inserted= this
}

function clickPlay(){
    for(let i=0; i<boardArray.length; i++){
        if(boardArray[i].innerText && !boardArray[i].classList.contains("immutable")){
            boardArray[i].classList.add("immutable")
            inserted= null
        }
    }

    checkWin()
}

play.addEventListener("click", clickPlay)

function checkWin(){
    if(rowCheck() || colCheck()||diagonalCheck()){
        board.classList.add("immutable")
        
        // --- NEW CODE START ---
        // Record the win to the database immediately
        if(typeof GameManager !== 'undefined') {
            GameManager.recordWin(); 
        }
        // --- NEW CODE END ---

        alert(`WINNER: ${winner}`)

        play.innerText= "Play Again"
        play.addEventListener("click", startGame)
    }
}

function colCheck(){
    for(let i=0; i<3; i++){
        //check if element is not empty and elements on the same column are equal
        if(boardArray[i].innerText && boardArray[i].innerText && boardArray[i].innerText==boardArray[i+3].innerText && boardArray[i].innerText==boardArray[i+6].innerText){
            if(boardArray[i]==="X"){
                winner= "Y"
            }else{
                winner= "X"
            }

            return true
        }
    }

    return false
}

function rowCheck(){
    for(let i=0; i<boardArray.length-2; i+=3){
        //check if element is not empty and elements on the same row are equal
        if(boardArray[i].innerText && boardArray[i].innerText==boardArray[i+1].innerText && boardArray[i].innerText==boardArray[i+2].innerText){
            
            if(boardArray[i]==="X"){
                winner= "O"
            }else{
                winner= "X"
            }
 
            return true
        }
    }

    return false
}

function diagonalCheck(){
    if (boardArray[0].innerText && boardArray[0].innerText==boardArray[4].innerText && boardArray[0].innerText==boardArray[8].innerText || boardArray[2].innerText && boardArray[2].innerText==boardArray[4].innerText && boardArray[2].innerText==boardArray[6].innerText){
        if(winner= boardArray[0].innerText==="X"){
                winner= "O"
            }else{
                winner= "X"
            }

        return true
    }
    return false
}