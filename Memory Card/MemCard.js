import Deck from "../Cards/deck.js";

const scoreEl = document.getElementById('mem-score');
const cardSpace = document.querySelector(".card-space");

let score = 0;
let cardsArray = [];
let flippedCards = [];
let boardStateForSave = []; 
let gameStarted = false;    
let shuffleTimer = null; // [NEW] Timer for chaos mode

// --- 1. INITIALIZATION ---
window.onload = function() {
    window.GameManager.loadMatchState(function(response) {
        if (!response || response.error) {
            console.error("Error loading match.");
            populateCardsNew(); 
            startGameFlow();
            return;
        }

        if (response.board_state && response.board_state !== "null") {
            try {
                let savedData = JSON.parse(response.board_state);
                reconstructBoard(savedData);
            } catch(e) {
                console.error("Error parsing board:", e);
                populateCardsNew();
            }
        } 
        else {
            populateCardsNew();
        }

        startGameFlow();
    });
};

function startGameFlow() {
    // 1. Show all cards
    cardsArray.forEach(card => card.classList.add("flipped"));
    
    // 2. Hide them after 1.5s and Start Shuffle Timer
    setTimeout(() => {
        flipAll(); 
        gameStarted = true; 
        
        // [NEW] Start the Chaos Timer (Shuffle every 15 seconds)
        startChaosTimer(); 
        
    }, 1500); 
}

// [NEW] Chaos Timer Logic
function startChaosTimer() {
    // Clear existing if any
    if (shuffleTimer) clearInterval(shuffleTimer);

    shuffleTimer = setInterval(() => {
        // Only shuffle if game is active and not won
        if (gameStarted && window.GameManager.gameActive) {
            shuffleUnmatched();
        }
    }, 15000); // 15 Seconds
}

function shuffleUnmatched() {
    // 1. Reset any currently half-flipped cards (punish the player slightly)
    flippedCards.forEach(card => card.classList.remove("flipped"));
    flippedCards = [];

    // 2. Find all cards that are NOT matched yet
    const unmatchedCards = cardsArray.filter(card => !card.classList.contains("matched"));

    if (unmatchedCards.length === 0) return; // Game over or error

    // 3. Visual Feedback (Shake)
    cardSpace.classList.add("shaking");
    setTimeout(() => cardSpace.classList.remove("shaking"), 500);

    // 4. Randomize their Order using CSS Grid 'order'
    unmatchedCards.forEach(card => {
        // Generate a random order integer between 1 and 100
        let randomPos = Math.floor(Math.random() * 100);
        card.style.order = randomPos;
    });
    
    console.log("Chaos Shuffle Triggered!");
}

// --- 2. P1 GENERATION ---
function populateCardsNew() {
    const deck = new Deck();
    deck.shuffle();

    // 8 Pairs = 16 Cards
    const slicedDeck = new Deck(deck.cards.slice(0,8));
    const playingDeck = new Deck(slicedDeck.cards.concat(slicedDeck.cards));
    playingDeck.shuffle();

    boardStateForSave = [];
    
    for(let i=0; i<playingDeck.cards.length; i++) {
        let cardObj = playingDeck.cards[i];
        let cardHTML = cardObj.getHTML(); 

        setupCardElement(cardHTML);
        
        // [NEW] Set initial CSS order so shuffling works smoothly later
        cardHTML.style.order = i; 

        boardStateForSave.push({
            value: cardHTML.dataset.value,
            classes: cardHTML.className,
            content: cardHTML.innerHTML 
        });

        cardSpace.appendChild(cardHTML);
        cardsArray.push(cardHTML);
    }
}

// --- 3. P2 RECONSTRUCTION ---
function reconstructBoard(savedData) {
    boardStateForSave = null; 
    
    savedData.forEach((data, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = data.classes; 
        cardDiv.dataset.value = data.value;
        cardDiv.innerHTML = data.content; 
        
        // [NEW] Set initial order
        cardDiv.style.order = index;

        setupCardElement(cardDiv);
        
        cardSpace.appendChild(cardDiv);
        cardsArray.push(cardDiv);
    });
}

function setupCardElement(cardDiv) {
    cardDiv.addEventListener("click", flipCard);
}

// --- 4. GAME LOGIC ---
function flipCard() {
    if (!gameStarted) return;
    if (!window.GameManager.gameActive) return; 
    
    // Prevent clicking matched cards
    if (this.classList.contains("matched")) return;

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

        // [NEW] Mark as matched so they don't shuffle
        card1.classList.add("matched");
        card2.classList.add("matched");

        if (score === 8) {
            clearInterval(shuffleTimer); // Stop the chaos
            setTimeout(() => {
                alert("ALL PAIRS FOUND!");
                window.GameManager.submitScore(score); 
            }, 500);
        }

    } else {
        // NO MATCH
        setTimeout(() => {
            // Only unflip if they haven't been shuffled away during the wait (rare edge case)
            if (!card1.classList.contains("matched")) card1.classList.remove("flipped");
            if (!card2.classList.contains("matched")) card2.classList.remove("flipped");
            flippedCards = [];
        }, 1000);
    }
}

function flipAll() {
    cardsArray.forEach(card => {
        card.classList.remove("flipped");
    });
}

// --- 5. SUBMISSION ---
window.GameManager.submitScore = function(scoreVal) {
    clearInterval(shuffleTimer); // Ensure timer stops on manual submit
    const matchId = this.getMatchId();
    
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

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
        if (data.tournament_id) {
            window.location.href = '../tournament/view.php?id=' + data.tournament_id;
        } else {
            window.location.href = '../history_page.php';
        }
    });
};