const characters= ["X", "O"]
const board= document.querySelector(".board")
const characterTile= document.querySelector(".characters")

const boardArray= []

const length= 3
let selectedTile= null

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
        boardArray.push()

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
    }else{
        
    }
}

function insertChar(){
    this.innerText= selectedTile
}

function play(){
    for(let i=0; i<boardArray.length; i++){
        if(boardArray[i].innerText && !boardArray[i].classList.contains("immutable")){
            boardArray.classList.add("immutable")
        }
    }

    if(checkWin()){

    }else{
        
    }
}

function checkWin(){
    rowCheck()
    colCheck()
}

function colCheck(){
    for(let i=0; i<3; i++){
        //check if element is not empty and elements on the same column are equal
        if(boardArray[i].innerText && boardArray[i].innerText==boardArray[i+3].innerText==boardArray[i+6].innerText){
            return true
        }
    }
}

function colCheck(){
    for(let i=0; i<boardArray.length; i++){
        //check if element is not empty and elements on the same row are equal
        if(boardArray[i].innerText && i%3==0 && (boardArray[i].innerText==boardArray[i+1].innerText==boardArray[i+2].innerText)){
            return true
        }
    }
}