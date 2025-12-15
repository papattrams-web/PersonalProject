import Deck from "../Cards/deck.js";

const scoreEl = document.getElementById('mem-score');
const cardSpace = document.querySelector(".card-space");

let score = 0;
let cardsArray = [];
let flippedCards = [];
let boardStateForSave = []; // Stores the shuffle order for P2
let gameStarted = false;    // Wait for DB or Start

// --- 1. INITIALIZATION ---
// Since this is a module, we access the global GameManager via window
window.onload = function() {
    
    // Use GameManager to check if we are P1 or P2
    window.GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            console.error("Error loading match.");
            // Fallback for local testing
            populateCardsNew(); 
            startGameFlow();
            return;
        }

        // Check if a board already exists (P2 Logic)
        if (response.board_state && response.board_state !== "null") {
            console.log("Loading P1's Shuffle...");
            try {
                let savedData = JSON.parse(response.board_state);
                reconstructBoard(savedData);
            } catch(e) {
                console.error("Error parsing board:", e);
                populateCardsNew();
            }
        } 
        else {
            // No board exists (P1 Logic)
            console.log("Generating New Shuffle...");
            populateCardsNew();
        }

        startGameFlow();
    });
};

function startGameFlow() {
    // 1. Show all cards (Preview)
    cardsArray.forEach(card => card.classList.add("flipped"));
    
    // 2. Hide them after 1.5 seconds (Reduced from 5s for better pacing)
    setTimeout(() => {
        flipAll(); 
        gameStarted = true; // Allow clicking now
    }, 1500); 
}

// --- 2. P1 GENERATION (Using Deck Class) ---
function populateCardsNew() {
    const deck = new Deck();
    deck.shuffle();

    // Take top 8 cards to make pairs
    const slicedDeck = new Deck(deck.cards.slice(0,8));
    
    // Double them to make 16 cards (8 pairs)
    const playingDeck = new Deck(slicedDeck.cards.concat(slicedDeck.cards));
    playingDeck.shuffle();

    // Render & Capture State
    boardStateForSave = [];
    
    for(let i=0; i<playingDeck.cards.length; i++) {
        let cardObj = playingDeck.cards[i];
        let cardHTML = cardObj.getHTML(); // Get the div from your Deck class

        setupCardElement(cardHTML);
        
        // Save the essential data for P2 (Value and Suit/Color classes)
        // We assume getHTML returns a div with a 'data-value' attribute and classes like 'card red'
        boardStateForSave.push({
            value: cardHTML.dataset.value,
            classes: cardHTML.className,
            content: cardHTML.innerHTML // Capture internal suits/numbers if they exist
        });

        cardSpace.appendChild(cardHTML);
        cardsArray.push(cardHTML);
    }
}

// --- 3. P2 RECONSTRUCTION (Manual DOM) ---
function reconstructBoard(savedData) {
    boardStateForSave = null; // P2 doesn't need to save it again
    
    savedData.forEach(data => {
        const cardDiv = document.createElement('div');
        cardDiv.className = data.classes; // 'card red', etc.
        cardDiv.dataset.value = data.value;
        cardDiv.innerHTML = data.content; // Inner text/suits
        
        setupCardElement(cardDiv);
        
        cardSpace.appendChild(cardDiv);
        cardsArray.push(cardDiv);
    });
}

// Helper to attach listeners
function setupCardElement(cardDiv) {
    cardDiv.addEventListener("click", flipCard);
}

// --- 4. GAME LOGIC ---
function flipCard() {
    // Block input if game hasn't started or paused
    if (!gameStarted) return;
    if (!window.GameManager.gameActive) return; // Respect Global Pause

    // Standard Logic
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
        // MATCH!
        flippedCards = [];
        score++;
        scoreEl.innerText = score;

        // CHECK WIN CONDITION (8 Pairs = 16 Cards)
        if (score === 8) {
            setTimeout(() => {
                alert("ALL PAIRS FOUND!");
                // Submit immediately (don't wait for timer)
                window.GameManager.submitScore(score); 
            }, 500);
        }

    } else {
        // NO MATCH
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
            flippedCards = [];
        }, 1000);
    }
}

function flipAll() {
    cardsArray.forEach(card => {
        card.classList.remove("flipped");
    });
}

// --- 5. OVERRIDE SUBMISSION ---
// We attach the board state to the score submission if we are P1
window.GameManager.submitScore = function(scoreVal) {
    const matchId = this.getMatchId();
    
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    // If we have a board state to save (P1), attach it
    if (boardStateForSave && boardStateForSave.length > 0) {
        payload.board_state = JSON.stringify(boardStateForSave);
    }

    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        window.location.href = '../homepage.php';
    });
};