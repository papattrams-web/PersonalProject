<?php
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$my_id = $_SESSION['user_id'];

// Fetch Completed Matches
$sql = "SELECT m.*, g.display_name, 
        u1.username as p1_name, u2.username as p2_name
        FROM matches m
        JOIN games g ON m.game_id = g.id
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE (m.player1_id = '$my_id' OR m.player2_id = '$my_id') 
        AND m.status = 'completed'
        ORDER BY m.played_at DESC";

$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geekerz - Match History</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
        
        .score-box {
            font-weight: bold;
            font-size: 1.2rem;
            min-width: 100px;
            text-align: center;
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
        <h1>Match History</h1>
        <p>Your Wins and Losses</p>
    </div>

    <div class="history-container">
        <?php if ($result->num_rows > 0): ?>
            <?php while($row = $result->fetch_assoc()): ?>
                <?php
                    // Determine Logic
                    $is_p1 = ($row['player1_id'] == $my_id);
                    $opponent = $is_p1 ? $row['p2_name'] : $row['p1_name'];
                    $my_score = $is_p1 ? $row['player1_score'] : $row['player2_score'];
                    $their_score = $is_p1 ? $row['player2_score'] : $row['player1_score'];
                    
                    // Result
                    $result_class = 'draw';
                    $result_text = 'DRAW';
                    
                    if ($row['winner_id'] == $my_id) {
                        $result_class = 'win';
                        $result_text = 'VICTORY';
                    } elseif ($row['winner_id'] != NULL) {
                        $result_class = 'lose';
                        $result_text = 'DEFEAT';
                    }
                ?>
                
                <div class="match-row <?php echo $result_class; ?>">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 5px;"><?php echo $row['display_name']; ?></h3>
                        <span style="color:#aaa;">vs <?php echo htmlspecialchars($opponent); ?></span>
                    </div>
                    
                    <div class="score-box">
                        <span style="color: #fff;"><?php echo $my_score; ?></span> 
                        <span style="color: #aaa; font-size: 0.8rem;">-</span>
                        <span style="color: #fff;"><?php echo $their_score; ?></span>
                    </div>
                    
                    <div style="flex: 0.5; text-align: right; font-weight: bold; letter-spacing: 1px;">
                        <?php echo $result_text; ?>
                    </div>
                </div>
            <?php endwhile; ?>
        <?php else: ?>
            <p style="text-align:center; color:#aaa;">No matches played yet.</p>
        <?php endif; ?>
    </div>

</body>
</html>