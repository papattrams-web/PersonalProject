import Deck, { Card } from "./deck.js"

const compCardSlot = document.querySelector(".computer-card-slot")
const playerCardSlot = document.querySelector(".player-card-slot")
const computerDeckElement = document.querySelector(".computer-deck")
const text = document.querySelector(".text")
const playerHandContainer = document.getElementById("player-hand")

let playerDeck, computerDeck, playerHand
let deckStateForSave = null; 
let stop = false;

// --- 1. INITIALIZATION ---
window.onload = function() {
    window.GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            initGameLocal(); // P1 Fallback
            return;
        }

        if (response.board_state && response.board_state !== "null") {
            try {
                let savedData = JSON.parse(response.board_state);
                initGameFromSave(savedData); // P2 Load
            } catch(e) { initGameLocal(); }
        } else {
            initGameLocal(); // P1 Generate
        }
    });
};

// --- 2. SETUP LOGIC ---
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

    // Draw initial 3 cards
    refillHand();
    
    // Start the first round (Show Computer Card)
    startRound();
}

// --- 3. GAMEPLAY LOGIC ---

function refillHand() {
    // Fill hand until it has 3 cards (or deck is empty)
    while(playerHand.length < 3 && playerDeck.NoOfCards > 0) {
        playerHand.push(playerDeck.pop());
    }
    renderHand();
}

function startRound() {
    // 1. Clear slots
    compCardSlot.innerHTML = "";
    playerCardSlot.innerHTML = "";
    text.innerText = "Choose a card!";

    // 2. Computer plays immediately (Face Up)
    if (computerDeck.NoOfCards === 0) {
        endGame(true); // Player Wins if Comp runs out
        return;
    }
    
    // We just peek at the computer's top card for this round
    // In strict War we flip, but here let's actually POP it so it's "in play"
    // To make it simple: We will pop it only when the player moves, 
    // BUT we show it now so the player can strategize.
    
    const compCard = computerDeck.cards[0]; // Peek
    compCardSlot.appendChild(compCard.getHTML());
    
    updateDeckCounts();
}

function playCard(handIndex) {
    if (stop || !window.GameManager.gameActive) return;

    // 1. Get the cards
    const playerCard = playerHand.splice(handIndex, 1)[0]; // Remove from hand
    const computerCard = computerDeck.pop(); // Remove from comp deck

    // 2. Render Play
    playerCardSlot.innerHTML = "";
    playerCardSlot.appendChild(playerCard.getHTML());
    
    // 3. Determine Winner
    if (isRoundWinner(playerCard, computerCard)) {
        text.innerText = "WIN";
        text.style.color = "#2ecc71";
        // Winner gets cards added to bottom of deck
        playerDeck.push(playerCard);
        playerDeck.push(computerCard);
    } else {
        text.innerText = "LOSE";
        text.style.color = "#e74c3c";
        computerDeck.push(playerCard);
        computerDeck.push(computerCard);
    }

    // 4. Check Game Over
    if (playerDeck.NoOfCards === 0 && playerHand.length === 0) {
        endGame(false); // Player Lost everything
        return;
    }

    // 5. Prepare Next Round
    renderHand(); // Hand is now smaller
    updateDeckCounts();

    // Delay before next round setup
    setTimeout(() => {
        refillHand();
        startRound();
    }, 1200);
}

// --- 4. RENDERING & UTILS ---
function renderHand() {
    playerHandContainer.innerHTML = "";
    
    playerHand.forEach((card, index) => {
        const cardDiv = card.getHTML();
        // Add click listener to play this specific card
        cardDiv.onclick = () => playCard(index);
        playerHandContainer.appendChild(cardDiv);
    });
}

function updateDeckCounts() {
    computerDeckElement.innerText = computerDeck.NoOfCards;
    // Player Count = Deck + Hand
    // We don't have a visible player deck pile anymore (it's in the hand), 
    // but we can show the number remaining in the draw pile
    // document.querySelector(".player-deck").innerText = playerDeck.NoOfCards;
}

const CARD_VALUE_MAP = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
}

function isRoundWinner(cardOne, cardTwo) {
    // In ties, Computer wins (House Edge / Simplicity)
    return CARD_VALUE_MAP[cardOne.value] > CARD_VALUE_MAP[cardTwo.value];
}

function endGame(playerWon) {
    stop = true;
    text.innerText = playerWon ? "VICTORY!" : "DEFEAT!";
    let score = playerWon ? 1 : -1;
    
    setTimeout(() => {
        window.GameManager.submitScore(score);
    }, 2000);
}

// --- 5. OVERRIDE SUBMISSION ---
window.GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    let payload = {
        game: this.config.gameSlug, score: scoreVal, type: 'win', match_id: matchId
    };

    if (deckStateForSave) {
        payload.board_state = JSON.stringify(deckStateForSave);
    }

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        window.location.href = '../history_page.php';
    });
};