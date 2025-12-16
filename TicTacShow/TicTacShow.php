<?php
session_start();
if (!isset($_SESSION['user_id'])) { header("Location: ../Login/login.php"); exit(); }

$my_user_id = $_SESSION['user_id'];
$match_id = isset($_GET['match_id']) ? intval($_GET['match_id']) : 0;

if ($match_id === 0) { header("Location: ../lobby.php?msg=select_rival"); exit(); }
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
    <a href="../homepage.php" style="position:absolute; top:20px; left:20px; color:white; text-decoration:none; font-weight:bold;">&larr; Quit</a>

    <div class="container">
        <h1>Tic Tac Show</h1>
        
        <div class="scoreboard">
            <span id="score-p1" style="color:#00d2ff;">P1 (X): 0</span>
            <span style="margin:0 10px;">-</span>
            <span id="score-p2" style="color:#e74c3c;">P2 (O): 0</span>
        </div>

        <div class="instruction-box" id="instruction-box">
            Loading...
        </div>

        <div class="status-msg" id="status-msg"></div>

        <div class="board" id="board">
            </div>
        
        <div class="tool-selector" id="tool-selector" style="display:none;">
            <button class="tool-btn" id="btn-x" onclick="selectTool('X')">X</button>
            <button class="tool-btn" id="btn-o" onclick="selectTool('O')">O</button>
        </div>

        <button id="confirm-btn" style="display:none;">CONFIRM MOVE</button>
    </div>

    <script src="../js/game_manager.js"></script>
    
    <script>
        const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
        const MATCH_ID = <?php echo json_encode($match_id); ?>;
    </script>

    <script src="TicTacShow.js"></script>
</body>
</html>