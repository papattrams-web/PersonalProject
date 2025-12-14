

const gridDisplay= document.querySelector(".grid")
const scoreDisplay= document.getElementById("score")
const resultDisplay= document.getElementById("result")

const length= 4

const squares= []

let score = 0

//Creating board
function createBoard(){
    for(let i=0; i<(length*length); i++){
        const square= document.createElement("div")
        
        square.innerHTML= 0
        
        gridDisplay.appendChild(square)
        squares.push(square)
    }

    generate()
    generate()
}

createBoard()
colorTiles()

function generate(){
    const randomNum= Math.floor(Math.random()*squares.length)

    if(squares[randomNum].innerHTML==0){
        squares[randomNum].innerHTML=2

        checkForLoss()
    }else generate()                
}

function moveRight(){
    for(let i=0; i<length*length; i++){
        if(i%4===0){
            let sum1= squares[i].innerHTML
            let sum2= squares[i+1].innerHTML
            let sum3= squares[i+2].innerHTML
            let sum4= squares[i+3].innerHTML

            let row= [parseInt(sum1),parseInt(sum2),parseInt(sum3),parseInt(sum4)] 
            
            let filteredRow= row.filter(num=>num)
            let missing= 4 - filteredRow.length
            let zeros= Array(missing).fill(0)
            let newRow= zeros.concat(filteredRow)

            console.log(newRow)

            squares[i].innerHTML=newRow[0]
            squares[i+1].innerHTML=newRow[1]
            squares[i+2].innerHTML=newRow[2]
            squares[i+3].innerHTML=newRow[3]

        }

    }
}


function moveLeft(){
    for(let i=0; i<length*length; i++){
        if(i%4===0){
            let sum1= squares[i].innerHTML
            let sum2= squares[i+1].innerHTML
            let sum3= squares[i+2].innerHTML
            let sum4= squares[i+3].innerHTML

            let row= [parseInt(sum1),parseInt(sum2),parseInt(sum3),parseInt(sum4)] 
            
            let filteredRow= row.filter(num=>num)
            let missing= 4 - filteredRow.length
            let zeros= Array(missing).fill(0)
            let newRow= filteredRow.concat(zeros)

            console.log(newRow)

            squares[i].innerHTML=newRow[0]
            squares[i+1].innerHTML=newRow[1]
            squares[i+2].innerHTML=newRow[2]
            squares[i+3].innerHTML=newRow[3]

        }

    }
}

function moveUp(){
    for(let i=0; i<length; i++){
        if(i%4===i){
            let sum1= squares[i].innerHTML
            let sum2= squares[i+length].innerHTML
            let sum3= squares[i+(length*2)].innerHTML
            let sum4= squares[i+(length*3)].innerHTML

            let column= [parseInt(sum1),parseInt(sum2),parseInt(sum3),parseInt(sum4)] 
            
            let filteredColumn= column.filter(num=>num)
            let missing= 4 - filteredColumn.length
            let zeros= Array(missing).fill(0)
            let newColumn= filteredColumn.concat(zeros)

            console.log(newColumn)

            squares[i].innerHTML=newColumn[0]
            squares[i+length].innerHTML=newColumn[1]
            squares[i+(length*2)].innerHTML=newColumn[2]
            squares[i+(length*3)].innerHTML=newColumn[3]

        }

    }
}

function moveDown(){
    for(let i=0; i<length; i++){
        if(i%4===i){
            let sum1= squares[i].innerHTML
            let sum2= squares[i+length].innerHTML
            let sum3= squares[i+(length*2)].innerHTML
            let sum4= squares[i+(length*3)].innerHTML

            let column= [parseInt(sum1),parseInt(sum2),parseInt(sum3),parseInt(sum4)] 
            
            let filteredColumn= column.filter(num=>num)
            let missing= 4 - filteredColumn.length
            let zeros= Array(missing).fill(0)
            let newColumn= zeros.concat(filteredColumn)

            console.log(newColumn)

            squares[i].innerHTML=newColumn[0]
            squares[i+length].innerHTML=newColumn[1]
            squares[i+(length*2)].innerHTML=newColumn[2]
            squares[i+(length*3)].innerHTML=newColumn[3]

        }

    }
}

function combineRow(){
    for (let i = 0; i < 16; i++){
        // Check if we are NOT at the last column of a row (indices 3, 7, 11, 15)
        if (i % 4 !== 3) { 
            // Check if the current square's value equals the next square's value
            if(squares[i].innerHTML === squares[i+1].innerHTML){
                let combinedTotal =  parseInt(squares[i].innerHTML) + parseInt(squares[i+1].innerHTML)
                
                // Only merge if the tile is not 0 (an empty space)
                if (parseInt(squares[i].innerHTML) !== 0) {
                    squares[i].innerHTML = combinedTotal
                    squares[i+1].innerHTML = 0
                    
                    score += combinedTotal
                    scoreDisplay.innerHTML = score
                }
            }
        }
    }
    checkForWin()
}

function combineColumn(){
    for (let i = 0; i < 12; i++){
        // Check if the current square's value equals the square below it
        if(squares[i].innerHTML === squares[i+length].innerHTML){
            let combinedTotal =  parseInt(squares[i].innerHTML) + parseInt(squares[i+length].innerHTML)
            
            // Only merge if the tile is not 0
            if (parseInt(squares[i].innerHTML) !== 0) {
                squares[i].innerHTML = combinedTotal
                squares[i+length].innerHTML = 0
                
                score += combinedTotal
                scoreDisplay.innerHTML = score
            }
        }
    }
    checkForWin()
}

function checkForWin(){
    for(let i= 0; i<squares.length; i++){
        if(squares[i].innerHTML===2048){
            resultDisplay.innerHTML= "You Won!"
            removeEventListener("keydown", control)
        }
    }
}

function checkForLoss(){
    let isBoardFull = true
    let isMovePossible = false

    // Check if the board is full (Condition 1)
    for(let i = 0; i < squares.length; i++){
        if(squares[i].innerHTML == 0){ // Comparing to string "0" is fine here
            isBoardFull = false
            break
        }
    }

    // If the board is full, check if any adjacent tiles can be combined (Condition 2)
    if (isBoardFull) {
        // Check adjacent rows for a match
        for (let i = 0; i < 16; i++) {
            if (i % 4 !== 3 && squares[i].innerHTML === squares[i+1].innerHTML && parseInt(squares[i].innerHTML) !== 0) {
                isMovePossible = true
                break
            }
        }
        
        // Check adjacent columns for a match
        if (!isMovePossible) {
            for (let i = 0; i < 12; i++) {
                if (squares[i].innerHTML === squares[i+length].innerHTML && parseInt(squares[i].innerHTML) !== 0) {
                    isMovePossible = true
                    break
                }
            }
        }

        if(!isMovePossible){
            resultDisplay.innerHTML = "Damn, You Lost"
            document.removeEventListener("keydown", control)
            setTimeout(clear, 3000)
        }
    }
}

function clear(){
    clearInterval(timer)
}

function control(e){
    if(e.key==="ArrowLeft"){
        keyLeft()
    }else if(e.key==="ArrowRight"){
        keyRight()
    }else if(e.key==="ArrowUp"){
        keyUp()
    }else if(e.key==="ArrowDown"){
        keyDown()
    }
}

document.addEventListener("keydown", control)

function keyLeft(){
    const beforeState = squares.map(s => s.innerHTML).join('') // Save the state before the move
    
    moveLeft()
    combineRow()
    moveLeft() // Slide the newly merged tiles to the end
    
    const afterState = squares.map(s => s.innerHTML).join('') // Check the state after the move

    if (beforeState !== afterState) {
        generate()
        colorTiles()
    }
}

function keyRight(){
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

function keyUp(){
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

function keyDown(){
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

function colorTiles(){
    for(let i=0; i<squares.length; i++){
        if(squares[i].innerHTML==0)squares[i].style.backgroundColor = "whitesmoke"
        else if(squares[i].innerHTML==2)squares[i].style.backgroundColor = "indigo"
        else if(squares[i].innerHTML==4)squares[i].style.backgroundColor = "blue"
        else if(squares[i].innerHTML==8)squares[i].style.backgroundColor = "green"
        else if(squares[i].innerHTML==16)squares[i].style.backgroundColor = "yellow"
        else if(squares[i].innerHTML==32)squares[i].style.backgroundColor = "orange"
        else if(squares[i].innerHTML==64)squares[i].style.backgroundColor = "purple"
        else if(squares[i].innerHTML==128)squares[i].style.backgroundColor = "grey"
        else if(squares[i].innerHTML==256)squares[i].style.backgroundColor = "teal"
        else if(squares[i].innerHTML==512)squares[i].style.backgroundColor = "pink"
        else if(squares[i].innerHTML==1024)squares[i].style.backgroundColor = "black"
        else if(squares[i].innerHTML==2048)squares[i].style.backgroundColor = "red"
    }
}




