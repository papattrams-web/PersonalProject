//Importing instead of using a new class
import Deck from "../Cards/deck.js"

const cardSpace= document.querySelector(".card-space")
let cardsArray= []
let flippedCards=[]

function startGame() {
    populateCards();
    // Start with all cards VISIBLE for 5 seconds
    cardsArray.forEach(card => card.classList.add("flipped"));
    
    setTimeout(() => {
        flipAll(); // Now this correctly hides them
    }, 5000);
}

startGame()

function populateCards(){
    const deck= new Deck()
    deck.shuffle()

    const slicedDeck= new Deck(deck.cards.slice(0,8))

    const playingDeck= new Deck(slicedDeck.cards.concat(slicedDeck.cards))
    playingDeck.shuffle()

    console.log(deck)
    console.log(slicedDeck)
    console.log(playingDeck)

    for(let i=0; i<playingDeck.cards.length; i++){
        let currentCard= playingDeck.cards[i].getHTML()

        currentCard.addEventListener("click", flipCard)

        cardSpace.appendChild(currentCard)
        cardsArray.push(currentCard)

    }
}

function flipCard() {
    // 1. Guard: Don't allow flipping more than 2 cards at once
    // 2. Guard: Don't allow clicking a card that's already flipped
    if (flippedCards.length === 2 || this.classList.contains("flipped")) return;

    this.classList.add("flipped");
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.value === card2.dataset.value) {
        // Match found: Keep them flipped and clear the tracker
        flippedCards = [];
    } else {
        // No match: Flip them back after a delay
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
            flippedCards = [];
        }, 1000); // Increased delay so players can actually see the mismatch
    }
}

function flipAll() {
    // Fixed syntax error: added missing closing parenthesis for forEach
    cardsArray.forEach(card => {
        card.classList.remove("flipped"); // "Hide" them after the initial preview
    });
}

