<?php
session_start();

// 1. Security Check: Must be logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: ../Login/login.php");
    exit();
}

// 2. Capture Data
$my_user_id = $_SESSION['user_id'];
$match_id = isset($_GET['match_id']) ? intval($_GET['match_id']) : 0;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>8 BALL - Geekerz</title>
    <link rel="stylesheet" href="8ball.css">
</head>
<body>
    <canvas id="screen" width="1500" height="825"></canvas>
    
    <script src="./js/Colors.js"></script>
    <script src="./js/Vector2.js"></script>
    <script src="./js/Canvas.js"></script>
    <script src="./js/Assets.js"></script>

    <script src="./Input/ButtonState.js"></script>
    <script src="./Input/Mouse.js"></script>

    <script src="./js/Ball.js"></script>
    <script src="./js/Stick.js"></script>
    <script src="./js/Rules.js"></script> 
    <script src="./js/GameWorld.js"></script>
    <script src="./js/Game.js"></script>

    <script src="../js/game_manager.js"></script>

    <script>
    // 1. Inject PHP Variables safely
    const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
    const MATCH_ID = <?php echo json_encode($match_id); ?>;

    // 2. Initialize Manager
    GameManager.init('8ball', 'win');
    GameManager.matchId = MATCH_ID;

    // 3. Start Loading Assets
    loadAssets(function() {

        // 4. Fetch the Match State
        GameManager.loadMatchState(function(response) {

            // --- SAFETY CHECK 1: Did we get a valid response? ---
            if (!response || response.error) {
                console.error("Match Data Error:", response);
                alert("Could not load match data. Check console.");
                return;
            }

            // --- SAFETY CHECK 2: Determine Identity ---
            // 0 = Player 1 (Challenger), 1 = Player 2 (Opponent)
            let myPlayerIndex = -1;

            // Ensure IDs are treated as strings or numbers consistently for comparison
            if (MY_USER_ID == response.player1_id) {
                myPlayerIndex = 0;
            } else if (MY_USER_ID == response.player2_id) {
                myPlayerIndex = 1;
            }

            // --- LOGIC: Handle the Board State ---
            let savedState = null;

            // Only try to parse if there is actually data strings
            if (response.board_state && response.board_state !== "null") {
                try {
                    savedState = JSON.parse(response.board_state);
                } catch (e) {
                    console.error("Corrupt board state, resetting to new game.");
                    savedState = null;
                }
            }

            // If savedState is null, GameWorld automatically runs initNewGame() (The Triangle)
            PoolGame.gameWorld = new GameWorld(savedState, myPlayerIndex);

            // --- UI FEEDBACK ---
            // If the game just started (Turn 0) and I am Player 2 (Index 1)
            // I need to know why I can't move.
            if (PoolGame.gameWorld.rules.turn !== myPlayerIndex) {
                PoolGame.gameWorld.feedbackMessage = "Opponent's Turn";
            }

            // Start the Loop
            PoolGame.start();
        });
    });
</script>

</body>
</html>