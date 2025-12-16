import Deck, { Card } from "./deck.js"

const compCardSlot = document.querySelector(".computer-card-slot")
const playerCardSlot = document.querySelector(".player-card-slot")
const computerDeckElement = document.querySelector(".computer-deck")
const playerDeckElement = document.querySelector(".player-deck")
const text = document.querySelector(".text")
const playerHandContainer = document.getElementById("player-hand")
const timerElement = document.getElementById("game-timer")

let playerDeck, computerDeck, playerHand
let deckStateForSave = null; 
let stop = false;
let gameTimerInterval = null;
let timeRemaining = 90; // 1.5 Minutes

// --- 1. INITIALIZATION ---
window.onload = function() {
    window.GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            initGameLocal(); 
            return;
        }

        if (response.board_state && response.board_state !== "null") {
            try {
                let savedData = JSON.parse(response.board_state);
                console.log("Loading P1 Shuffle...");
                initGameFromSave(savedData); 
            } catch(e) { initGameLocal(); }
        } else {
            console.log("Generating New Shuffle...");
            initGameLocal(); 
        }
    });
};

function initGameLocal() {
    const deck = new Deck();
    deck.shuffle();
    deckStateForSave = deck.cards.map(c => ({ suit: c.suit, value: c.value }));
    startTacticalWar(deck);
}

function initGameFromSave(cardData) {
    const reconstructedCards = cardData.map(data => new Card(data.suit, data.value));
    const deck = new Deck(reconstructedCards);
    startTacticalWar(deck);
}

function startTacticalWar(deck) {
    const deckMidpoint = Math.ceil(deck.NoOfCards / 2)
    playerDeck = new Deck(deck.cards.slice(0, deckMidpoint))
    computerDeck = new Deck(deck.cards.slice(deckMidpoint, deck.NoOfCards))
    
    playerHand = [];
    stop = false;

    refillHand();
    startRound();
    startTimer();
}

// --- 2. TIMER LOGIC ---
function startTimer() {
    clearInterval(gameTimerInterval);
    timeRemaining = 90; 
    updateTimerDisplay();

    gameTimerInterval = setInterval(() => {
        if (stop || !window.GameManager.gameActive) return;

        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(gameTimerInterval);
            stop = true;
            decideTimeWinner();
        }
    }, 1000);
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeRemaining / 60);
    let seconds = timeRemaining % 60;
    timerElement.innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeRemaining <= 10) timerElement.style.color = "#e74c3c";
    else timerElement.style.color = "#f1c40f";
}

// [FIXED] Score based on Card Count, not Win/Loss boolean
function decideTimeWinner() {
    // Score = Cards in Deck + Cards in Hand
    let finalScore = playerDeck.NoOfCards + playerHand.length;
    
    text.style.fontSize = "2rem"; 
    text.innerText = `TIME UP!`;
    
    // Pass the actual count (e.g., 32 cards) to endGame
    endGame(finalScore);
}

// --- 3. GAMEPLAY LOGIC ---
function refillHand() {
    while(playerHand.length < 3 && playerDeck.NoOfCards > 0) {
        playerHand.push(playerDeck.pop());
    }
    renderHand();
}

function startRound() {
    compCardSlot.innerHTML = "";
    playerCardSlot.innerHTML = "";
    
    if(!stop) {
        text.innerText = "VS";
        text.style.color = "#f1c40f";
    }

    // Immediate End (Run out of cards)
    if (computerDeck.NoOfCards === 0) {
        // You have all 52 cards (max score)
        endGame(52); 
        return;
    }
    if (playerDeck.NoOfCards === 0 && playerHand.length === 0) {
        // You have 0 cards
        endGame(0);
        return;
    }

    const compCard = computerDeck.cards[0]; 
    compCardSlot.appendChild(compCard.getHTML());
    updateDeckCounts();
}

window.playCard = function(handIndex) {
    if (stop || !window.GameManager.gameActive) return;

    const playerCard = playerHand.splice(handIndex, 1)[0]; 
    const computerCard = computerDeck.pop(); 

    playerCardSlot.innerHTML = "";
    playerCardSlot.appendChild(playerCard.getHTML());
    
    if (isRoundWinner(playerCard, computerCard)) {
        playerDeck.push(playerCard);
        playerDeck.push(computerCard);
    } else {
        computerDeck.push(playerCard);
        computerDeck.push(computerCard);
    }

    renderHand(); 
    updateDeckCounts();

    setTimeout(() => {
        refillHand();
        startRound();
    }, 200); 
}

function renderHand() {
    playerHandContainer.innerHTML = "";
    playerHand.forEach((card, index) => {
        const cardDiv = card.getHTML();
        cardDiv.onclick = () => window.playCard(index); 
        playerHandContainer.appendChild(cardDiv);
    });
}

function updateDeckCounts() {
    computerDeckElement.innerText = computerDeck.NoOfCards;
    playerDeckElement.innerText = playerDeck.NoOfCards;
}

const CARD_VALUE_MAP = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
}

function isRoundWinner(cardOne, cardTwo) {
    return CARD_VALUE_MAP[cardOne.value] > CARD_VALUE_MAP[cardTwo.value];
}

// [FIXED] Now accepts the specific Card Count
function endGame(finalCardCount) {
    stop = true;
    clearInterval(gameTimerInterval);

    // Neutral Message
    text.innerText = `FINISHED! Cards: ${finalCardCount}`;
    text.style.color = "#f1c40f"; // Gold color
    
    setTimeout(() => {
        window.GameManager.submitScore(finalCardCount);
    }, 3000); 
}

// --- 4. SUBMISSION ---
window.GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal, // This is now the Card Count (e.g., 28)
        type: 'win',
        match_id: matchId
    };

    if (deckStateForSave && deckStateForSave.length > 0) {
        payload.board_state = JSON.stringify(deckStateForSave);
    }

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.tournament_id) {
            window.location.href = '../tournament/view.php?id=' + data.tournament_id;
        } else {
            window.location.href = '../history_page.php';
        }
    });
};