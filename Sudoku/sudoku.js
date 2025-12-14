

const boardDisplay= document.querySelector("#board")
const digitsDisplay= document.querySelector("#digits")
const scoreDisplay= document.getElementById("score")
const resultDisplay= document.getElementById("result")

let solvedBoard= []

const length= 9

const squares= []

let score = 0

let numSelected= null

function startGame(){
    createBoard()
    populateDigits()
}

startGame()

//Creating board
function createBoard(){
    for(let i=0; i<(length*length); i++){
        const square= document.createElement("div")

        square.addEventListener("click", selectTile)

        square.classList.add("tile")
        square.classList.add("box"+ boxNum(i).toString())
        
        //Testing Box Num functionality
        // square.innerHTML= boxNum(i)

        //Testing id naming system
        //console.log(boxNum(i).toString()+ "-" + Math.floor(i/length).toString() + "-" + (i%length).toString())

        square.innerText= null


        boardDisplay.appendChild(square)
        squares.push(square)
    }

    //Debugging
    // console.log(squares)
    // console.log(squares.length)
    // console.log(squares[20].innerText)
    
    createPuzzle()
    console.log(squares)
    
}

function boxNum(number){
    if(Math.floor(number/9)<3 && number%9<3 ) return 1
    else if(Math.floor(number/9)<3 && number%9<6 ) return 2
    else if(Math.floor(number/9)<3 && number%9<9 ) return 3
    else if(Math.floor(number/9)<6 && number%9<3 ) return 4
    else if(Math.floor(number/9)<6 && number%9<6 ) return 5
    else if(Math.floor(number/9)<6 && number%9<9 ) return 6
    else if(Math.floor(number/9)<9 && number%9<3 ) return 7
    else if(Math.floor(number/9)<9 && number%9<6 ) return 8
    else if(Math.floor(number/9)<9 && number%9<9 ) return 9
 
}

function populateDigits(){
    for(let i=0; i<length; i++){
        const square= document.createElement("div")
        square.addEventListener("click", selectNumber)
        
        square.classList.add("tile")
        
        square.innerText= i+1
        // square.innerText= parseInt(i+1)
        digitsDisplay.appendChild(square)
    }
}

function populateBoard() {
    const sudokuValues = [1,2,3,4,5,6,7,8,9];

    function fillSquare(index = 0) {
        if (index >= squares.length) return true; // all squares filled

        const square = squares[index];

        if (square.innerText) {
            // already filled (immutable starting tiles)
            return fillSquare(index + 1);
        }

        // find numbers already in row, column, box
        const exists = [];
        for (let i = 0; i < squares.length; i++) {
            if (squares[i].innerText && (boxNum(i) == boxNum(index) || Math.floor(i/length) == Math.floor(index/length) || (i % length) == (index % length))) {
                exists.push(parseInt(squares[i].innerText));
            }
        }

        // possible numbers to try
        const possibleDigits = sudokuValues.filter(x => !exists.includes(x));

        // shuffle numbers to randomize placement
        for (let num of shuffle(possibleDigits)) {
            square.innerText = num;
            square.classList.add("immutable");

            if (fillSquare(index + 1)) return true; // success

            // backtrack
            square.innerText = "";
            square.classList.remove("immutable");
        }

        return false; // no number fits, trigger backtracking
    }

    fillSquare(); // start recursion
}

// helper function to shuffle array
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createPuzzle(hints = 36) {
    // Step 1: generate a complete board
    populateBoard();

    //Save the board for comparison
    solvedBoard= squares

    // Step 2: remove numbers until only `hints` remain
    let cellsToRemove = squares.length - hints;

    while (cellsToRemove > 0) {
        let randomIndex = Math.floor(Math.random() * squares.length);

        // skip if it's already empty
        if (!squares[randomIndex].innerText) continue;

        // remove value
        squares[randomIndex].innerText = "";
        squares[randomIndex].classList.remove("immutable"); // player can now fill it

        cellsToRemove--;
    }
}

function finishGame(){
    
}

//My original version
// function populateBoard(){
//     let squaresFilled= 0
//     let sudokuValues= [1,2,3,4,5,6,7,8,9]

//     while(squaresFilled<36){
//         //Pick a random square to fill
//         let randomNumber= Math.floor((squares.length)*(Math.random()))
        
//         //Check if the square is empty and proceed if it is
//         if(!squares[randomNumber].innerText){
//             // let tileDetails= squares[randomNumber].id.split("-")

//             //Check for existing numbers in the column, row and 3x3 box the tile is in
//             let exists= []

//             for(let i=0; i<squares.length; i++){
//                 if(squares[i].innerText && (boxNum(i)==boxNum(randomNumber) ||  Math.floor(i/length)==Math.floor(randomNumber/length) || (i%length)==(randomNumber%length)) ){
//                     exists.push(parseInt(squares[i].innerText))
//                 }
//             }
            
//             //Randomly fill the empty space with a possible number
//             let possibleDigits= sudokuValues.filter(x=>!exists.includes(x))

//             if(possibleDigits.length>0){
//                 squares[randomNumber].innerText= possibleDigits[Math.floor(Math.random() * possibleDigits.length)]
//                 squares[randomNumber].classList.add("immutable")
//                 squaresFilled++
//             }
//         }
//     }
// }



function selectNumber(){
    if(numSelected!=null) {
        numSelected.classList.remove("number-selected")
    }
    numSelected= this
    numSelected.classList.toggle("number-selected")
}

function selectTile(){
    if(this.classList.contains("immutable")) return
    if(numSelected){
        this.innerText= numSelected.innerText
    }
}
