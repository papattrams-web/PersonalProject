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
    <title>Extreme Sudoku</title>
    <link rel="stylesheet" href="sudoku.css">
</head>
<body>
    <nav style="position:absolute; top:20px; left:20px;">
        <a href="../homepage.php" style="color:#2c3e50; text-decoration:none; font-weight:bold;">&larr; Quit</a>
    </nav>

    <div class="game-header">
        <h1>Extreme Sudoku</h1>
        <p id="instruction" style="color: red; font-weight: bold;">
            Be careful: game ends immediately after 3 errors.
        </p>
        <hr>
    </div>

    <div class="info">
        <div id="errors" style="opacity:0;">Errors <br> 0</div>
        <div id="score-container">Score <br> <span id="actual-score">0</span></div>
    </div>
    
    <div id="board"></div>
    <br>
    <div id="digits"></div>

    <script src="../js/game_manager.js"></script>

    <script>
        const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
        const MATCH_ID = <?php echo json_encode($match_id); ?>;
        
        // Init: Slug, Type ('score'), ID of score element
        GameManager.init('sudoku', 'score', 'actual-score');
    </script>

    <script src="sudoku.js"></script>
</body>
</html>