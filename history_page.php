<?php
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$my_id = $_SESSION['user_id'];

// 1. Fetch ALL Matches (Completed AND Active)
// We look for status: 'completed', 'active', 'waiting_p1', 'waiting_p2'
$sql = "SELECT m.*, g.display_name, g.game_slug,
        u1.username as p1_name, u2.username as p2_name
        FROM matches m
        JOIN games g ON m.game_id = g.id
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE (m.player1_id = '$my_id' OR m.player2_id = '$my_id') 
        AND m.status != 'pending' 
        ORDER BY 
            CASE WHEN m.status = 'completed' THEN 2 ELSE 1 END, -- Show active games first
            m.played_at DESC";

$result = $conn->query($sql);

// Helper function to get game URL
function getGameUrl($slug, $match_id) {
    $path = "";
    switch ($slug) {
        case '2048': $path = "../2048/2048.html"; break;
        case 'pacman': $path = "../PacMan/PacMan.html"; break;
        case 'sudoku': $path = "../Sudoku/sudoku.html"; break;
        case 'memory': $path = "../Memory Card/MemCard.html"; break;
        case '8ball': $path = "../8ball/8ball.php"; break;
        case 'tictactoe': $path = "../TicTacToe/TicTacToe.html"; break;
        case 'war': $path = "../Cards/cards.html"; break;
        default: return "#";
    }
    return $path . "?match_id=" . $match_id;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geekerz - Match History</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .history-container {
            max-width: 900px;
            margin: 50px auto;
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 20px;
        }
        .match-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 10px;
            background: rgba(0,0,0,0.3);
            border-left: 5px solid #555;
        }
        .win { border-left-color: #2ecc71; }
        .lose { border-left-color: #e74c3c; }
        .draw { border-left-color: #f1c40f; }
        .active { border-left-color: #3498db; } /* Blue for active */
        
        .score-box {
            font-weight: bold;
            font-size: 1.2rem;
            min-width: 100px;
            text-align: center;
        }

        .action-btn {
            padding: 8px 15px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.9rem;
            display: inline-block;
            transition: 0.2s;
        }
        .btn-play {
            background-color: #3498db;
            color: white;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
        }
        .btn-play:hover { transform: scale(1.05); }
        
        .btn-wait {
            background-color: #555;
            color: #aaa;
            cursor: not-allowed;
            border: 1px solid #777;
        }
        
        .status-text {
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <span class="logo-text">GEEKERZ</span>
        </div>
        <div class="user-menu">
            <a href="homepage.php" class="btn-logout" style="text-decoration:none;">Dashboard</a>
        </div>
    </nav>

    <div class="hero">
        <h1>My Matches</h1>
        <p>Active Games & History</p>
    </div>

    <div class="history-container">
        <?php if ($result && $result->num_rows > 0): ?>
            <?php while($row = $result->fetch_assoc()): ?>
                <?php
                    // 1. Identify Player Roles
                    $is_p1 = ($row['player1_id'] == $my_id);
                    $opponent = $is_p1 ? $row['p2_name'] : $row['p1_name'];
                    $my_score = $is_p1 ? $row['player1_score'] : $row['player2_score'];
                    $their_score = $is_p1 ? $row['player2_score'] : $row['player1_score'];
                    
                    // 2. Determine State
                    $status = $row['status'];
                    $row_class = 'active';
                    $display_html = '';

                    // LOGIC: COMPLETED GAMES
                    if ($status == 'completed') {
                        if ($row['winner_id'] == $my_id) {
                            $row_class = 'win';
                            $display_html = '<span class="status-text" style="color:#2ecc71">VICTORY</span>';
                        } elseif ($row['winner_id'] === NULL) {
                            $row_class = 'draw';
                            $display_html = '<span class="status-text" style="color:#f1c40f">DRAW</span>';
                        } else {
                            $row_class = 'lose';
                            $display_html = '<span class="status-text" style="color:#e74c3c">DEFEAT</span>';
                        }
                    } 
                    // LOGIC: ACTIVE GAMES
                    else {
                        // Check whose turn it is
                        $is_my_turn = false;

                        if ($status == 'active') {
                            // "active" usually means game just started. P1 goes first.
                            if ($is_p1) $is_my_turn = true;
                        } 
                        elseif ($status == 'waiting_p1' && $is_p1) {
                            $is_my_turn = true;
                        }
                        elseif ($status == 'waiting_p2' && !$is_p1) {
                            $is_my_turn = true;
                        }

                        if ($is_my_turn) {
                            $url = getGameUrl($row['game_slug'], $row['id']);
                            $display_html = "<a href='$url' class='action-btn btn-play'>PLAY NOW</a>";
                        } else {
                            $display_html = "<span class='action-btn btn-wait'>OPPONENT'S TURN</span>";
                        }
                    }
                ?>
                
                <div class="match-row <?php echo $row_class; ?>">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 5px;"><?php echo htmlspecialchars($row['display_name']); ?></h3>
                        <span style="color:#aaa;">vs <?php echo htmlspecialchars($opponent); ?></span>
                    </div>
                    
                    <div class="score-box">
                        <?php if($status == 'completed'): ?>
                            <span style="color: #fff;"><?php echo $my_score; ?></span> 
                            <span style="color: #aaa; font-size: 0.8rem;">-</span>
                            <span style="color: #fff;"><?php echo $their_score; ?></span>
                        <?php else: ?>
                            <span style="color: #aaa; font-size: 0.9rem;">IN PROGRESS</span>
                        <?php endif; ?>
                    </div>
                    
                    <div style="flex: 0.5; text-align: right;">
                        <?php echo $display_html; ?>
                    </div>
                </div>
            <?php endwhile; ?>
        <?php else: ?>
            <p style="text-align:center; color:#aaa;">No matches found.</p>
        <?php endif; ?>
    </div>

</body>
</html>