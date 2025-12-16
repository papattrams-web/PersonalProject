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
// --- 5. OVERRIDE SUBMISSION ---
window.GameManager.submitScore = function(scoreVal) {
    // 1. Stop the Chaos Timer immediately
    clearInterval(shuffleTimer); 
    this.gameActive = false;

    const matchId = this.getMatchId();
    
    // 2. Create and Show "Game Over" Popup
    let cover = document.getElementById('gm-game-over-modal');
    if (!cover) {
        cover = document.createElement('div');
        cover.id = 'gm-game-over-modal';
        // Dark overlay with centered text
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;flex-direction:column;font-family:'Comic Neue', cursive;";
        
        cover.innerHTML = `
            <h1 style="font-size:3rem; margin-bottom:10px; color:#ff7979;">ALL PAIRS FOUND!</h1>
            <h2 style="font-size:2rem; margin-bottom:30px; color:#badc58;">Score: ${scoreVal}</h2>
            <div id="gm-status-msg" style="color:#aaa; margin-bottom:20px; font-size:1.2rem;">Saving results...</div>
            <button id="gm-continue-btn" style="display:none; padding:15px 30px; font-size:1.5rem; background:#ff7979; color:white; border:none; border-radius:10px; cursor:pointer; box-shadow: 0 5px 0 #eb4d4b;">CONTINUE &rarr;</button>
        `;
        document.body.appendChild(cover);
        
        // Setup listener for when button appears
        document.getElementById('gm-continue-btn').addEventListener('click', () => {
            if (this.redirectUrl) window.location.href = this.redirectUrl;
            else window.location.href = '../history_page.php';
        });
    }

    // 3. Prepare Data
    let payload = {
        game: this.config.gameSlug,
        score: scoreVal,
        type: this.config.gameType,
        match_id: matchId
    };

    // Attach Board State (P1 only)
    if (boardStateForSave && boardStateForSave.length > 0) {
        payload.board_state = JSON.stringify(boardStateForSave);
    }

    // 4. Send to Server
    fetch('../submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        // 5. Update UI on Success
        const statusMsg = document.getElementById('gm-status-msg');
        const btn = document.getElementById('gm-continue-btn');
        
        if(statusMsg && btn) {
            statusMsg.innerText = "Saved Successfully!";
            statusMsg.style.color = "#badc58"; // Green-ish
            btn.style.display = "block"; // Show button now
            
            // Store the correct redirect URL
            if (data.tournament_id) {
                this.redirectUrl = '../tournament/view.php?id=' + data.tournament_id;
            } else {
                this.redirectUrl = '../history_page.php';
            }
        }
    })
    .catch(err => {
        console.error(err);
        const statusMsg = document.getElementById('gm-status-msg');
        if(statusMsg) {
            statusMsg.innerText = "Error Saving Score. Check Connection.";
            statusMsg.style.color = "red";
        }
    });
};