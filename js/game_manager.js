const GameManager = {
    config: {
        gameSlug: null,
        gameType: 'score', 
        duration: 90, 
        scoreElementId: 'score',
    },
    timer: null,
    timeLeft: 0,
    gameActive: false, // <--- NEW CONTROL FLAG

    init: function(slug, type, scoreId = 'score') {
        this.config.gameSlug = slug;
        this.config.gameType = type;
        this.config.scoreElementId = scoreId;
        
        // 1. Install Input Blockers (The Security Gate)
        this.blockInputs();

        const matchId = this.getMatchId();
        // Create overlay (which blocks the view and starts the flow)
        this.createOverlay(matchId);
    },

    getMatchId: function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('match_id');
    },

    // --- NEW: GLOBAL INPUT BLOCKER ---
    // --- UPDATED: GLOBAL INPUT BLOCKER ---
    blockInputs: function() {
        const trap = (e) => {
            if (!this.gameActive) {
                // FIX: Allow interaction if the target is inside the Overlay (e.g., the Start Button)
                if (e.target && e.target.closest && e.target.closest('#gm-overlay')) {
                    return; 
                }

                e.stopImmediatePropagation(); // Stop game from hearing it
                e.preventDefault();           // Stop default browser action
            }
        };

        // Capture phase (true) ensures we catch it BEFORE the game does
        window.addEventListener('keydown', trap, true);
        window.addEventListener('keyup', trap, true);
        window.addEventListener('mousedown', trap, true);
        window.addEventListener('mouseup', trap, true);
        window.addEventListener('touchstart', trap, true);
        window.addEventListener('click', trap, true);
    },

    createOverlay: function(matchId) {
        const overlay = document.createElement('div');
        overlay.id = 'gm-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: 'Courier New', sans-serif;
            pointer-events: auto; /* Catch clicks */
        `;
        
        const titleText = matchId ? "RANKED MATCH" : "PRACTICE";
        const subText = matchId ? "Beat your opponent's score." : "Play for high score.";
        
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px; text-transform:uppercase;">${titleText}</h1>
            <p style="margin-bottom: 30px; font-size: 1.2rem;">${subText}</p>
            <button id="gm-start-btn" style="
                padding: 15px 40px; font-size: 1.5rem; cursor: pointer;
                background: #2ecc71; color: white; border: none; border-radius: 5px;
                font-weight: bold; text-transform: uppercase;
                box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
            ">START GAME</button>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('gm-start-btn').addEventListener('click', () => {
            overlay.remove();
            this.startGame();
        });
    },

    startGame: function() {
        this.gameActive = true; // <--- OPEN THE GATES
        this.timeLeft = this.config.duration;
        
        // 8-Ball and TicTacShow don't use the timer, so we check type
        if (this.config.gameType === 'score') {
            this.startTimer();
        }
    },

    startTimer: function() {
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'gm-timer';
        timerDisplay.style.cssText = `
            position: fixed; top: 10px; right: 10px;
            background: rgba(0,0,0,0.8); color: #2ecc71; padding: 10px 20px;
            font-size: 1.5rem; font-weight: bold; border: 2px solid #2ecc71; 
            border-radius: 10px; z-index: 1000; font-family: monospace;
        `;
        timerDisplay.innerText = this.formatTime(this.timeLeft);
        document.body.appendChild(timerDisplay);

        this.timer = setInterval(() => {
            this.timeLeft--;
            timerDisplay.innerText = this.formatTime(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    },

    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    endGame: function() {
        clearInterval(this.timer);
        this.gameActive = false; // <--- CLOSE THE GATES (Freezes game)

        // Game Over Screen
        const cover = document.createElement('div');
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;flex-direction:column;";
        
        let finalScore = 0;
        const scoreEl = document.getElementById(this.config.scoreElementId);
        if(scoreEl) finalScore = parseInt(scoreEl.innerText) || 0; 

        cover.innerHTML = `<h1>TIME UP!</h1><h2>Score: ${finalScore}</h2><h3 style='color:#aaa'>Saving...</h3>`;
        document.body.appendChild(cover);

        this.submitScore(finalScore);
    },

    submitScore: function(scoreVal) {
        // [Existing logic - No changes needed here]
        const matchId = this.getMatchId();
        let payload = {
            game: this.config.gameSlug,
            score: scoreVal,
            type: this.config.gameType,
            match_id: matchId
        };

        // Pass-through for custom submissions (like Sudoku/PacMan overwrites)
        // If the game file overwrote submitScore, this function won't be called anyway.
        // But for standard timer games:
        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            window.location.href = '../homepage.php'; 
        });
    },

    // Standard Helper
    loadMatchState: function(callback) {
        const matchId = this.getMatchId();
        if(!matchId) { callback(null); return; }

        fetch('../includes/get_match_state.php?match_id=' + matchId + '&t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                if(data && !data.error) callback(data);
                else callback(null);
            })
            .catch(() => callback(null));
    }
};