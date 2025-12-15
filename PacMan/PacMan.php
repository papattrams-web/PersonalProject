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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PacMan</title>
        <link rel="stylesheet" href="pacman.css">
        </head>
    <body>
        <a href="../homepage.php" style="position: absolute; top: 10px; left: 10px; color: white; font-family: sans-serif; text-decoration: none;">&larr; Quit</a>

        <canvas id="board"></canvas>
        
        <div id="score-container" style="display:none;">0</div>

        <script src="../js/game_manager.js"></script>

        <script>
            const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
            const MATCH_ID = <?php echo json_encode($match_id); ?>;

            // Init: Slug, Type, ID of score element
            GameManager.init('pacman', 'score', 'score-container');
        </script>

        <script src="pacman.js"></script>
    </body>
</html>