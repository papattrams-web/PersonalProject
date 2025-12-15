const PoolGame = {
    gameWorld: null,

    start: function() {
        // Initialize Canvas
        // Note: Canvas variable comes from Canvas.js which is already loaded in HTML
        
        // Start the Main Loop
        PoolGame.mainLoop();
    },

    mainLoop: function() {
        if(!PoolGame.gameWorld) return;

        Canvas.clear();
        
        // Only allow input if it is MY turn
        // GameManager.userId is set in game_manager.js (Need to ensure that exists)
        // For now, let's assume we play locally or control logic matches PHP
        
        PoolGame.gameWorld.handleInput(1/60); // Delta time
        PoolGame.gameWorld.update(1/60);
        PoolGame.gameWorld.draw();
        
        Mouse.reset();
        requestAnimationFrame(PoolGame.mainLoop);
    },

    // Called when turn ends
    sendTurn: function(gameState) {
        let jsonState = JSON.stringify(gameState);
        
        // Send to PHP
        fetch('../submit_score.php', {
            method: 'POST',
            body: JSON.stringify({
                game: '8ball',
                type: 'turn_update',
                match_id: GameManager.matchId, 
                score: 0,
                board_state: jsonState
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                // Reload page or show "Waiting for opponent"
                window.location.href = "../lobby.php?msg=turn_sent";
            }
        });
    },

    // Called when Game Over
    gameOver: function(didIWin) {
        let type = didIWin ? 'win' : 'loss';
        
        //replacing
        // let score = didIWin ? 1 : 0;

        let score = didIWin ? 1 : -1;

        fetch('../submit_score.php', {
            method: 'POST',
            body: JSON.stringify({
                game: '8ball',
                type: type,
                match_id: GameManager.matchId,
                score: score
            })
        })
        .then(() => {
            window.location.href = "../history_page.php";
        });
    }
};