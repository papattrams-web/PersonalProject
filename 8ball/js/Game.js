const PoolGame = {
    gameWorld: null,

    start: function() {
        PoolGame.mainLoop();
    },

    mainLoop: function() {
        // Global Pause Check
        if (!GameManager.gameActive) { requestAnimationFrame(PoolGame.mainLoop); return; }

        if(!PoolGame.gameWorld) return;

        Canvas.clear();
        
        // Input is handled inside GameWorld based on myPlayerIndex
        PoolGame.gameWorld.handleInput(1/60); 
        PoolGame.gameWorld.update(1/60);
        PoolGame.gameWorld.draw();
        
        Mouse.reset();
        requestAnimationFrame(PoolGame.mainLoop);
    },

    // Called when turn ends (No foul, no win/loss)
    sendTurn: function(gameState) {
        let jsonState = JSON.stringify(gameState);
        const matchId = GameManager.getMatchId(); // FIX: Use getter
        
        // Send to PHP
        fetch('../submit_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // FIX: Added Header
            body: JSON.stringify({
                game: '8ball',
                type: 'turn_update',
                match_id: matchId, 
                score: 0,
                board_state: jsonState
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                // Determine redirect based on context (Tournament vs Regular)
                if (data.tournament_id) {
                    window.location.href = "../tournament/view.php?id=" + data.tournament_id;
                } else {
                    window.location.href = "../history_page.php";
                }
            }
        });
    },

    // Called when Game Over (Win or Loss)
    gameOver: function(didIWin) {
        // Use GameManager so we get the "Game Over" popup
        let score = didIWin ? 1 : -1;
        GameManager.submitScore(score);
    }
};