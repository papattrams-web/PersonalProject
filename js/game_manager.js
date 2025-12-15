const GameManager = {
    config: {
        gameSlug: null,
        gameType: 'score', // 'score' or 'win'
        duration: 90, // 90 seconds
        scoreElementId: 'score',
    },
    timer: null,
    timeLeft: 0,

    init: function(slug, type, scoreId = 'score') {
        this.config.gameSlug = slug;
        this.config.gameType = type;
        this.config.scoreElementId = scoreId;
        
        // Check if this is a Ranked Match
        const matchId = this.getMatchId();
        
        if(matchId) {
            console.log("Ranked Match Detected: " + matchId);
        }

        if (type === 'score') {
            this.createOverlay(matchId);
        } else {
            console.log("Win/Loss game ready.");
        }
    },

    // Helper to get URL params
    getMatchId: function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('match_id');
    },

    createOverlay: function(matchId) {
        const overlay = document.createElement('div');
        overlay.id = 'gm-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: sans-serif;
        `;
        
        // Different text for Ranked vs Practice
        const titleText = matchId ? "Ranked Match" : "Ready?";
        const subText = matchId ? "You have 90s to beat your opponent." : "You have 1.5 minutes to get the highest score.";
        
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px;">${titleText}</h1>
            <p>${subText}</p>
            <button id="gm-start-btn" style="
                padding: 15px 30px; font-size: 1.5rem; cursor: pointer;
                background: #6c5ce7; color: white; border: none; border-radius: 50px;
            ">START GAME</button>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('gm-start-btn').addEventListener('click', () => {
            overlay.remove();
            this.startGame();
        });
    },

    startGame: function() {
        this.timeLeft = this.config.duration;
        
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'gm-timer';
        timerDisplay.style.cssText = `
            position: fixed; top: 10px; right: 10px;
            background: #d63031; color: white; padding: 10px 20px;
            font-size: 1.5rem; font-weight: bold; border-radius: 10px; z-index: 1000;
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
        
        // Block interaction
        const cover = document.createElement('div');
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;";
        document.body.appendChild(cover);

        let finalScore = 0;
        const scoreEl = document.getElementById(this.config.scoreElementId);
        if(scoreEl) {
            finalScore = parseInt(scoreEl.innerText) || 0; 
        } else {
             const scoreClass = document.querySelector('.score-container') || document.querySelector('.score-display');
             if(scoreClass) finalScore = parseInt(scoreClass.innerText) || 0;
        }

        alert(`Time's Up! Final Score: ${finalScore}`);
        this.submitScore(finalScore);
    },

    submitScore: function(scoreVal) {
        // Send Match ID if it exists
        const matchId = this.getMatchId();

        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game: this.config.gameSlug,
                score: scoreVal,
                type: this.config.gameType,
                match_id: matchId 
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                // If it was a match, go back to lobby/homepage
                window.location.href = '../homepage.php'; 
            } else {
                alert("Error saving score: " + data.message);
            }
        });
    },

    recordWin: function() {
        this.submitScore(1); 
    },

    // Add inside the GameManager object
    saveTurn: function(boardState) {
        const matchId = this.getMatchId();
        if(!matchId) return; // Local practice, don't save

        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game: '8ball',
                type: 'turn_update', // New type
                match_id: matchId,
                board_state: JSON.stringify(boardState) // Send as string
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                alert("Turn Finished. Sent to opponent.");
                window.location.href = '../homepage.php'; // Kick back to lobby
            }
        });
    },

// Helper to load state
loadMatchState: function(callback) {
    const matchId = this.getMatchId();
    if(!matchId) {
        callback(null);
        return;
    }

    fetch('../includes/get_match_state.php?match_id=' + matchId)
        .then(res => res.json())
        .then(data => {
            // Check if data exists AND isn't an error
            if(data && !data.error && data.board_state) {
                callback(JSON.parse(data.board_state));
            } else {
                // Pass the whole data object so 8ball.php can read player IDs 
                // even if board_state is null (new game)
                callback(data); 
            }
        })
        .catch(err => {
            console.error("Error loading match:", err);
            callback(null);
        });
    }
};