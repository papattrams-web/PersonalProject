const GameManager = {
    config: {
        gameSlug: null,
        gameType: 'score', 
        duration: 90, 
        scoreElementId: 'score',
    },
    timer: null,
    timeLeft: 0,
    gameActive: false, 
    redirectUrl: null,

    init: function(slug, type, scoreId = 'score') {
        this.config.gameSlug = slug;
        this.config.gameType = type;
        this.config.scoreElementId = scoreId;
        this.blockInputs();
        const matchId = this.getMatchId();
        this.createOverlay(matchId);
    },

    getMatchId: function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('match_id');
    },

    blockInputs: function() {
        const trap = (e) => {
            if (!this.gameActive) {
                // FIX: Allow interaction if target is inside Start Overlay OR Game Over Modal
                if (e.target && e.target.closest && 
                   (e.target.closest('#gm-overlay') || e.target.closest('#gm-game-over-modal'))) {
                    return; 
                }

                e.stopImmediatePropagation(); 
                e.preventDefault();           
            }
        };
        ['keydown','keyup','mousedown','mouseup','touchstart','click'].forEach(evt => 
            window.addEventListener(evt, trap, true)
        );
    },

    createOverlay: function(matchId) {
        const overlay = document.createElement('div');
        overlay.id = 'gm-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: 'Courier New', sans-serif; pointer-events: auto;`;
        
        const titleText = matchId ? "RANKED MATCH" : "PRACTICE";
        const subText = matchId ? "Beat your opponent." : "Play for high score.";
        
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px; text-transform:uppercase;">${titleText}</h1>
            <p style="margin-bottom: 30px; font-size: 1.2rem;">${subText}</p>
            <button id="gm-start-btn" style="padding: 15px 40px; font-size: 1.5rem; cursor: pointer; background: #2ecc71; color: white; border: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);">START GAME</button>
        `;
        document.body.appendChild(overlay);
        document.getElementById('gm-start-btn').addEventListener('click', () => {
            overlay.remove();
            this.startGame();
        });
    },

    startGame: function() {
        this.gameActive = true; 
        this.timeLeft = this.config.duration;
        if (this.config.gameType === 'score') this.startTimer();
    },

    startTimer: function() {
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'gm-timer';
        timerDisplay.style.cssText = `position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #2ecc71; padding: 10px 20px; font-size: 1.5rem; font-weight: bold; border: 2px solid #2ecc71; border-radius: 10px; z-index: 1000; font-family: monospace;`;
        timerDisplay.innerText = this.formatTime(this.timeLeft);
        document.body.appendChild(timerDisplay);

        this.timer = setInterval(() => {
            this.timeLeft--;
            timerDisplay.innerText = this.formatTime(this.timeLeft);
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    },

    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    endGame: function() {
        // We let submitScore handle the cleanup
        let finalScore = 0;
        const scoreEl = document.getElementById(this.config.scoreElementId);
        if(scoreEl) finalScore = parseInt(scoreEl.innerText) || 0; 

        this.submitScore(finalScore);
    },

    submitScore: function(scoreVal) {
        // FIX: Stop everything immediately so we don't trigger twice
        clearInterval(this.timer);
        this.gameActive = false; 

        const matchId = this.getMatchId();
        
        // 1. Ensure Overlay Exists
        let cover = document.getElementById('gm-game-over-modal');
        if (!cover) {
            cover = document.createElement('div');
            cover.id = 'gm-game-over-modal'; // <--- Allowed ID
            cover.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;flex-direction:column;font-family:'Courier New', monospace;";
            
            let displayScore = (this.config.gameType === 'win') ? (scoreVal == 1 ? "WIN" : "LOSE") : scoreVal;

            cover.innerHTML = `
                <h1 style="font-size:3rem; margin-bottom:10px;">GAME OVER</h1>
                <h2 style="font-size:2rem; margin-bottom:30px; color:#f1c40f;">Result: ${displayScore}</h2>
                <div id="gm-status-msg" style="color:#aaa; margin-bottom:20px; font-size:1.2rem;">Saving results...</div>
                <button id="gm-continue-btn" style="display:none; padding:15px 30px; font-size:1.2rem; background:#2ecc71; color:white; border:none; border-radius:5px; cursor:pointer;">CONTINUE</button>
            `;
            document.body.appendChild(cover);
            
            document.getElementById('gm-continue-btn').addEventListener('click', () => {
                if (this.redirectUrl) window.location.href = this.redirectUrl;
                else window.location.href = '../history_page.php';
            });
        }

        // 2. Submit Data
        let payload = {
            game: this.config.gameSlug,
            score: scoreVal,
            type: this.config.gameType,
            match_id: matchId
        };

        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            const statusMsg = document.getElementById('gm-status-msg');
            const btn = document.getElementById('gm-continue-btn');
            
            if(statusMsg && btn) {
                statusMsg.innerText = "Saved Successfully!";
                statusMsg.style.color = "#2ecc71";
                btn.style.display = "block"; // Show button now
                
                if (data.tournament_id) {
                    this.redirectUrl = '../tournament/view.php?id=' + data.tournament_id;
                } else {
                    this.redirectUrl = '../history_page.php';
                }
            }
        })
        .catch(err => {
            const statusMsg = document.getElementById('gm-status-msg');
            if(statusMsg) {
                statusMsg.innerText = "Error Saving Score. Check Connection.";
                statusMsg.style.color = "#e74c3c";
            }
        });
    },

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

window.GameManager = GameManager;