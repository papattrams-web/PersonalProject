<?php
session_start();
include '../includes/db_connection.php'; 

// 1. Security Check
if (!isset($_SESSION['user_id'])) {
    header("Location: ../Login/login.php");
    exit();
}

$my_user_id = $_SESSION['user_id'];
$match_id = isset($_GET['match_id']) ? intval($_GET['match_id']) : 0;

if ($match_id === 0) {
    header("Location: ../lobby.php?msg=select_rival");
    exit();
}

// 2. Determine Player Role
$sql = "SELECT player1_id, player2_id FROM matches WHERE id = '$match_id'";
$res = $conn->query($sql);
$match = $res->fetch_assoc();

$myPlayerIndex = 0; // Default P1
if ($match && $match['player2_id'] == $my_user_id) {
    $myPlayerIndex = 1; // I am P2
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>8 Ball Pool</title>
    <style>
        body { margin: 0; padding: 0; background: black; overflow: hidden; }
        canvas { display: block; margin: 0 auto; }
        #back-btn { position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; text-decoration: none; font-weight: bold; z-index: 100; }
    </style>
</head>
<body>
    <a href="../homepage.php" id="back-btn">&larr; Quit</a>

    <canvas id="screen" width="1500" height="825"></canvas>

    <script src="js/Vector2.js"></script>
    <script src="js/Colors.js"></script>
    <script src="js/Assets.js"></script>
    <script src="js/Canvas.js"></script>
    
    <script src="./Input/ButtonState.js"></script> 
    <script src="./Input/Mouse.js"></script>
    
    <script src="js/Ball.js"></script>
    <script src="js/Stick.js"></script>
    <script src="js/Rules.js"></script>
    <script src="js/GameWorld.js"></script>
    <script src="js/Game.js"></script>
    
    <script src="../js/game_manager.js"></script>

    <script>
        const MATCH_ID = <?php echo json_encode($match_id); ?>;
        const MY_PLAYER_INDEX = <?php echo json_encode($myPlayerIndex); ?>;

        // Init Manager
        GameManager.init('8ball', 'win', 'screen');

        loadAssets(function() {
            GameManager.loadMatchState(function(response) {
                let savedState = null;
                if (response && response.board_state && response.board_state !== "null") {
                    try {
                        savedState = JSON.parse(response.board_state);
                    } catch(e) { console.error("State Parse Error", e); }
                }
                PoolGame.gameWorld = new GameWorld(savedState, MY_PLAYER_INDEX);
                PoolGame.start();
            });
        });
    </script>
</body>
</html>