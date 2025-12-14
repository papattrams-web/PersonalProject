import Deck from "./deck.js"

const compCardSlot= document.querySelector(".computer-card-slot")
const playerCardSlot= document.querySelector(".player-card-slot")
const computerDeckElement= document.querySelector(".computer-deck")
const playerDeckElement= document.querySelector(".player-deck")
const text= document.querySelector(".text")

let playerDeck, computerDeck, inRound, stop

const CARD_VALUE_MAP= {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
}

document.addEventListener("click", ()=>{
    if(stop){
        startGame()
        return
    }
    
    if(inRound){
        cleanBeforeRound()
    }else{
        flipCards()
    }
})

startGame()

function startGame(){
    const deck= new Deck()
    deck.shuffle()

    const deckMidpoint= Math.ceil(deck.NoOfCards/2)

    playerDeck= new Deck(deck.cards.slice(0,deckMidpoint))
    computerDeck=new Deck(deck.cards.slice(deckMidpoint, deck.NoOfCards))
    inRound= false
    stop= false
    
    console.log(deck.cards)
    console.log(deck.cards[0].getHTML())
    console.log(playerDeck.cards)
    console.log(computerDeck.cards)
    
    // Line removed: compCardSlot.appendChild(deck.cards[0].getHTML()) 

    cleanBeforeRound()
}


function cleanBeforeRound(){
    inRound= false
    compCardSlot.innerHTML= ""
    playerCardSlot.innerHTML= ""
    text.innerText= ""

    updateDeckCount()
}

function flipCards(){
    inRound= true

    const playerCard= playerDeck.pop()
    const computerCard= computerDeck.pop()

    playerCardSlot.appendChild(playerCard.getHTML())
    compCardSlot.appendChild(computerCard.getHTML())

    updateDeckCount()

    if(isRoundWinner(playerCard, computerCard)){
        text.innerText= "Win"
        playerDeck.push(playerCard)
        playerDeck.push(computerCard)
    }else if(isRoundWinner(computerCard, playerCard)){
        text.innerText= "Lose"
        computerDeck.push(playerCard)
        computerDeck.push(computerCard)
    }else{
        text.innerText= "Draw"
        playerDeck.push(playerCard)
        computerDeck.push(computerCard)
    }

    if(isGameOver(playerDeck)){
        text.innerText="You LOSE!"
        stop= true
    } else if(isGameOver(computerDeck)){
        text.innerText="You WON!"
        stop= true
    }

}

function updateDeckCount(){
    computerDeckElement.innerText = computerDeck.NoOfCards

    playerDeckElement.innerText = playerDeck.NoOfCards
}

function isRoundWinner(cardOne, cardTwo){
    return CARD_VALUE_MAP[cardOne.value]>CARD_VALUE_MAP[cardTwo.value]
}

function isGameOver(deck){
    return deck.NoOfCards === 0
}