<?php
session_start();

// 1. Security Check
if (!isset($_SESSION['user_id'])) {
    header("Location: ../Login/login.php");
    exit();
}

// 2. Capture Data
$my_user_id = $_SESSION['user_id'];
$match_id = isset($_GET['match_id']) ? intval($_GET['match_id']) : 0;

// 3. Redirect if no match ID (Prevents "Manual Entry" errors)
if ($match_id === 0) {
    // If opened without a match, send them to lobby to find one
    header("Location: ../lobby.php?msg=select_rival");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tic Tac Show</title>
    <link rel="stylesheet" href="TicTacShow.css"> 
</head>
<body>
    <nav style="position:absolute; top:20px; left:20px;">
        <a href="../homepage.php" style="color:white; text-decoration:none; font-weight:bold;">&larr; Back to Dashboard</a>
    </nav>

    <div class="container">
        <h1>Tic Tac Show</h1>
        
        <h3 id="status-msg" style="margin-bottom: 10px; color: #00d2ff; min-height: 30px;">Loading Game...</h3>

        <div class="board"></div>
        
        <button id="play" style="display:none;">CONFIRM MOVE</button>
        
        <div class="characters" style="display:none;"></div>
    </div>

    <script src="../js/game_manager.js"></script>
    
    <script>
        const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
        const MATCH_ID = <?php echo json_encode($match_id); ?>;
    </script>

    <script src="TicTacShow.js"></script>
</body>
</html>