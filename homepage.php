<?php
// Ensure this is at the top
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$my_id = $_SESSION['user_id'];

// 1. Count "Your Turn" Games
// (Where I am P1 and status is waiting_p1 OR I am P2 and status is waiting_p2)
$turnSql = "SELECT COUNT(*) as count FROM matches 
            WHERE (player1_id = '$my_id' AND status = 'waiting_p1') 
            OR (player2_id = '$my_id' AND status = 'waiting_p2')";
$turnResult = $conn->query($turnSql);
$turnCount = $turnResult->fetch_assoc()['count'];

// 2. Count "Pending Challenges" (Inbox)
$inboxSql = "SELECT COUNT(*) as count FROM matches 
             WHERE player2_id = '$my_id' AND status = 'pending'";
$inboxResult = $conn->query($inboxSql);
$requestCount = $inboxResult->fetch_assoc()['count'];

$total_notifications = $turnCount + $requestCount;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Notification Badge Style */
        .nav-link { position: relative; }
        .badge {
            background-color: #e74c3c;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 0.7rem;
            position: absolute;
            top: -5px;
            right: -10px;
            font-weight: bold;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        
        /* Alert Banners */
        .alert-banner {
            max-width: 800px;
            margin: 0 auto 15px auto;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-decoration: none;
            transition: transform 0.2s;
        }
        .alert-banner:hover { transform: scale(1.02); }
        .alert-challenges { background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: white; }
        .alert-turn { background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71; color: white; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <img src="./Images/gremlin.png" alt="Gremlin" class="gremlin-logo">
            <span class="logo-text">GEEKERZ</span>
        </div>
        
        <div class="user-menu">
            <a href="tournament/index.php" class="btn-tournament">
                <i class="fas fa-trophy"></i> Tournament
            </a>

            <a href="lobby.php" style="color: red; margin-right: 20px; text-decoration: none; font-weight:bold;">Challenge Players</a>
            
            <a href="history_page.php" class="nav-link" style="color:yellow; margin-right: 20px; text-decoration: none; font-weight:bold;">
                Matches
                <?php if($total_notifications > 0): ?>
                    <span class="badge"><?php echo $total_notifications; ?></span>
                    <?php endif; ?>
            </a>

            <a href="leaderboard.php" style="color:green; margin-right: 20px; text-decoration: none; font-weight:bold;">Leaderboard</a>

            <a href="settings.php" style="color:white; margin-right: 20px; text-decoration: none; font-weight:bold;">Settings</a>
            <a href="logout.php" class="btn-logout" style="text-decoration:none;">Logout</a>
        </div>
    </nav>

    <div class="hero">
        <?php if ($requestCount > 0): ?>
            <a href="history_page.php" class="alert-banner alert-challenges">
                <span><i class="fas fa-envelope"></i> You have <strong><?php echo $requestCount; ?></strong> new challenge request(s).</span>
                <span style="background:#e74c3c; padding:5px 10px; border-radius:5px; font-size:0.9rem;">View</span>
            </a>
        <?php endif; ?>

        <?php if ($turnCount > 0): ?>
            <a href="history_page.php" class="alert-banner alert-turn">
                <span><i class="fas fa-play-circle"></i> It's your turn in <strong><?php echo $turnCount; ?></strong> game(s).</span>
                <span style="background:#2ecc71; padding:5px 10px; border-radius:5px; font-size:0.9rem;">Play</span>
            </a>
        <?php endif; ?>

        <h1>Game Library</h1>
        <p>Select a game to start playing</p>
    </div>

    <div class="container">
        <div class="games-grid">
            <div class="game-card card-2048">
                <div class="card-image">2048</div>
                <div class="card-content">
                    <h3>2048</h3>
                    <p>Join the numbers and get to the 2048 tile!</p>
                    <a href="./2048/2048.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-pacman">
                <div class="card-image"><i class="fas fa-ghost"></i></div>
                <div class="card-content">
                    <h3>PacMan</h3>
                    <p>Eat the dots, avoid the ghosts. Retro classic.</p>
                    <a href="./PacMan/PacMan.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-sudoku">
                <div class="card-image"><i class="fas fa-border-all"></i></div>
                <div class="card-content">
                    <h3>Sudoku</h3>
                    <p>Fill the grid with logic. Zen mode enabled.</p>
                    <a href="./Sudoku/sudoku.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-memory">
                <div class="card-image"><i class="fas fa-layer-group"></i></div>
                <div class="card-content">
                    <h3>Memory</h3>
                    <p>Test your brain power. Match the cards.</p>
                    <a href="./Memory Card/MemCard.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-war">
                <div class="card-image" style="background: #c0392b; color: white;">
                    <i class="fas fa-diamond"></i>
                </div>
                <div class="card-content">
                    <h3>War</h3>
                    <p>Battle of the decks. High card wins the round.</p>
                    <a href="Cards/cards.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-8ball">
                <div class="card-image"><i class="fas fa-dot-circle"></i></div>
                <div class="card-content">
                    <h3>8 Ball Pool</h3>
                    <p>Pot the balls and beat the table.</p>
                    <a href="./8ball/8ball.php" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-tictac">
                <div class="card-image"><i class="fas fa-times"></i></div>
                <div class="card-content">
                    <h3>Tic Tac Show</h3>
                    <p>The classic X and O game. Can you win?</p>
                    <a href="./TicTacShow/TicTacShow.php" class="btn-play">Play Now</a>
                </div>
            </div>

        </div>
    </div>

</body>
</html>