const characters= ["X", "O"]
const board= document.querySelector(".board")

const play= document.querySelector("#play")
play.addEventListener("click", clickPlay)

const characterTile= document.querySelector(".characters")

const boardArray= []

const length= 3


let selectedTile= null

let winner= null

function startGame(){
    createBoard()
    populateChar()
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
    if(selectedTile==null){
        selectedTile= this
        selectedTile.classList.toggle("selected")
    }else{

        selectedTile.classList.remove("selected")
        selectedTile= null
    }
}

function insertChar(){
    if(!selectedTile)return
    this.innerText= selectedTile.innerText
}

function clickPlay(){
    for(let i=0; i<boardArray.length; i++){
        if(boardArray[i].innerText && !boardArray[i].classList.contains("immutable")){
            boardArray[i].classList.add("immutable")
        }
    }

    checkWin()
}

function checkWin(){
    if(rowCheck() || colCheck()||diagonalCheck()){
        alert(`WINNER: ${winner}`)
        board.classList.add("immutable")
    }
}

function colCheck(){
    for(let i=0; i<3; i++){
        //check if element is not empty and elements on the same column are equal
        if(boardArray[i].innerText && boardArray[i].innerText==boardArray[i+3].innerText && boardArray[i].innerText==boardArray[i+6].innerText){
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
    for(let i=0; i<boardArray.length-2; i++){
        //check if element is not empty and elements on the same row are equal
        if(boardArray[i].innerText && i%3==0 && (boardArray[i].innerText==boardArray[i+1].innerText && boardArray[i].innerText==boardArray[i+2].innerText)){
            
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

function diagonalCheck(){
    return boardArray[0]==boardArray[4] && boardArray[0]==boardArray[8] || boardArray[2]==boardArray[4] && boardArray[2]==boardArray[6]
}