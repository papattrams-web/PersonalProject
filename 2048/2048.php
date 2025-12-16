<?php
session_start();

// 1. Security Check
if (!isset($_SESSION['user_id'])) {
    header("Location: ../Login/login.php");
    exit();
}

$my_user_id = $_SESSION['user_id'];
$match_id = isset($_GET['match_id']) ? intval($_GET['match_id']) : 0;

// 2. Redirect if manual entry
if ($match_id === 0) {
    header("Location: ../lobby.php?msg=select_rival");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>2048 - Geekerz</title>
        <link rel="stylesheet" href="2048.css">
    </head>
    <body>
        <a href="../homepage.php" style="position: absolute; top: 10px; left: 10px; color: #776e65; font-family: sans-serif; text-decoration: none; font-weight: bold; z-index:100;">&larr; Quit</a>

        <div class="container">
            <div class="info">
                <h1>2048</h1>
                <div class="score-container">
                    <h2 class="score-title">Score <br><span id="score">0</span></h2>
                </div>
            </div>

            <p id="result">Join the numbers to get <b>2048</b> tile</p>

            <div class="grid"></div>
        </div>
        
        <script src="../js/game_manager.js"></script>

        <script>
            const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
            const MATCH_ID = <?php echo json_encode($match_id); ?>;

            // Init Game Manager
            // Slug: '2048' | Type: 'score' | ScoreID: 'score'
            GameManager.init('2048', 'score', 'score');
        </script>

        <script src="2048.js"></script> 
    </body>
</html>