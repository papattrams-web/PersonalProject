<?php
session_start();

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
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Speed War</title>
        <link rel="stylesheet" href="cards.css">
        <script src="script.js" type="module"></script>
    </head>
    <body>
        <a href="../homepage.php" style="position: absolute; top: 10px; left: 10px; color: #f1c40f; font-family: sans-serif; text-decoration: none; font-weight: bold; z-index:100;">&larr; Quit</a>

        <div class="timer" id="game-timer">01:30</div>

        <div class="computer-deck deck"></div>
        <div class="computer-card-slot card-slot"></div>
        
        <div class="text"></div>
        
        <div class="player-card-slot card-slot"></div>
        <div class="player-deck deck"></div>

        <div class="hand-container" id="player-hand"></div>

        <div id="score-box" style="display:none;"></div> 

        <script src="../js/game_manager.js"></script>
        <script>
            const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
            const MATCH_ID = <?php echo json_encode($match_id); ?>;
            GameManager.init('war', 'win', 'score-box');
        </script>
    </body>
</html>