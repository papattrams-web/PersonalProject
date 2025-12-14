const GameManager = {
    config: {
        gameSlug: null,
        gameType: 'score', // 'score' or 'win'
        duration: 90, // 90 seconds (1.5 mins)
        scoreElementId: 'score', // Default ID to look for score
    },
    timer: null,
    timeLeft: 0,

    // 1. Initialize the Game Session
    init: function(slug, type, scoreId = 'score') {
        this.config.gameSlug = slug;
        this.config.gameType = type;
        this.config.scoreElementId = scoreId;
        
        if (type === 'score') {
            this.createOverlay();
        } else {
            // For Win/Loss games, we just listen for the end, no timer overlay needed initially
            console.log("Win/Loss game ready.");
        }
    },

    // 2. Create the "Ready?" Overlay
    createOverlay: function() {
        const overlay = document.createElement('div');
        overlay.id = 'gm-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: sans-serif;
        `;
        
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px;">Ready?</h1>
            <p>You have 1.5 minutes to get the highest score.</p>
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

    // 3. Start Timer
    startGame: function() {
        this.timeLeft = this.config.duration;
        
        // Create Timer Display
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

    // 4. End Game & Scrape Score
    endGame: function() {
        clearInterval(this.timer);
        
        // Block interaction
        const cover = document.createElement('div');
        cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;";
        document.body.appendChild(cover);

        // Scrape Score
        let finalScore = 0;
        const scoreEl = document.getElementById(this.config.scoreElementId);
        if(scoreEl) {
            finalScore = parseInt(scoreEl.innerText) || 0; // Grab text and convert to integer
        } else {
            // Fallback for Pacman/others if ID differs (we can refine this later)
            // Try querySelector if ID fails
             const scoreClass = document.querySelector('.score-container') || document.querySelector('.score-display');
             if(scoreClass) finalScore = parseInt(scoreClass.innerText) || 0;
        }

        alert(`Time's Up! Final Score: ${finalScore}`);
        this.submitScore(finalScore);
    },

    // 5. Submit Data
    submitScore: function(scoreVal) {
        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game: this.config.gameSlug,
                score: scoreVal,
                type: this.config.gameType
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                window.location.href = '../homepage.php'; // Return to lobby
            } else {
                alert("Error saving score: " + data.message);
            }
        });
    },

    // 6. Manual Trigger for Win/Loss Games
    recordWin: function() {
        this.submitScore(1); // 1 represents a "Win" increment
    }
};