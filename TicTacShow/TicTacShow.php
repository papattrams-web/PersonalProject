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
            <span id="score-p1" style="color:#2ecc71;">P1: 0</span>
            <span>-</span>
            <span id="score-p2" style="color:#e74c3c;">P2: 0</span>
        </div>

        <div class="status-msg" id="status-msg">Loading...</div>

        <div class="board" id="board">
            </div>
        
        <button id="play" style="display:none;">CONFIRM MOVES</button>
        
        <div style="font-size:0.8rem; color:#aaa; margin-top:10px;">
            <span style="color:#2ecc71">■</span> Hide Position &nbsp;&nbsp; 
            <span style="color:#e74c3c">■</span> Attack Position
        </div>
    </div>

    <script src="../js/game_manager.js"></script>
    
    <script>
        const MY_USER_ID = <?php echo json_encode($my_user_id); ?>;
        const MATCH_ID = <?php echo json_encode($match_id); ?>;
    </script>

    <script src="TicTacShow.js"></script>
</body>
</html>