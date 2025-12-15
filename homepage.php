<?php
// Ensure this is at the top of homepage.php
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$my_id = $_SESSION['user_id'];

// 1. Fetch Pending Challenges (Where I am Player 2)
$inboxSql = "SELECT m.id as match_id, u.username as challenger, g.display_name, g.game_slug
             FROM matches m
             JOIN users u ON m.player1_id = u.id
             JOIN games g ON m.game_id = g.id
             WHERE m.player2_id = '$my_id' AND m.status = 'pending'";
$inboxResult = $conn->query($inboxSql);

// 2. Fetch "Your Turn" Matches (Where I am Player 1 and P2 has finished)
$turnSql = "SELECT m.id as match_id, u.username as opponent, g.display_name, g.game_slug, m.player2_score
            FROM matches m
            JOIN users u ON m.player2_id = u.id
            JOIN games g ON m.game_id = g.id
            WHERE m.player1_id = '$my_id' AND m.status = 'waiting_p1'";
$turnResult = $conn->query($turnSql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <img src="./Images/gremlin.png" alt="Gremlin" class="gremlin-logo">
            <span class="logo-text">GEEKERZ</span>
        </div>
        
        <div class="user-menu">
            <a href="lobby.php" style="color:red; margin-right: 20px; text-decoration: none; font-weight:bold;">Challenge Players</a>
            <a href="history_page.php" style="color:yellow; margin-right: 20px; text-decoration: none; font-weight:bold;">Matches</a>
            <a href="leaderboard.php" style="color:green; margin-right: 20px; text-decoration: none; font-weight:bold;">Leaderboard</a>
            <span style="margin-right: 15px; font-weight: 500;">Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?></span>
            <button class="btn-logout">Logout</button>
        </div>
    </nav>

    <div class="hero">
        <?php if ($inboxResult->num_rows > 0): ?>
        <div class="container" style="margin-bottom: 20px;">
            <div style="background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; padding: 20px; border-radius: 15px;">
                <h3 style="color: #e74c3c; margin-bottom: 15px;"><i class="fas fa-envelope"></i> Game Challenges</h3>
                
                <?php while($row = $inboxResult->fetch_assoc()): ?>
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: white; font-size: 1.1rem;">
                            <strong><?php echo htmlspecialchars($row['challenger']); ?></strong> challenges you to <strong><?php echo htmlspecialchars($row['display_name']); ?></strong>!
                        </span>
                        
                        <div>
                            <a href="includes/handle_challenge.php?action=accept&id=<?php echo $row['match_id']; ?>&game=<?php echo $row['game_slug']; ?>" 
                            style="background: #2ecc71; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px; font-weight: bold;">
                            Accept
                            </a>

                            <a href="includes/handle_challenge.php?action=decline&id=<?php echo $row['match_id']; ?>" 
                            style="background: #e74c3c; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Decline
                            </a>
                        </div>
                    </div>
                <?php endwhile; ?>
            </div>
        </div>
        <?php endif; ?>
        <?php if ($turnResult->num_rows > 0): ?>
        <div class="container" style="margin-bottom: 20px;">
            <div style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71; padding: 20px; border-radius: 15px;">
                <h3 style="color: #2ecc71; margin-bottom: 15px;"><i class="fas fa-play-circle"></i> It's Your Turn!</h3>
                
                <?php while($row = $turnResult->fetch_assoc()): ?>
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: white; font-size: 1.1rem;">
                            <strong><?php echo htmlspecialchars($row['opponent']); ?></strong> scored <strong><?php echo $row['player2_score']; ?></strong> in <?php echo htmlspecialchars($row['display_name']); ?>. Can you beat them?
                        </span>
                        
                        <a href="includes/handle_challenge.php?action=accept&id=<?php echo $row['match_id']; ?>&game=<?php echo $row['game_slug']; ?>" 
                        style="background: #2ecc71; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Play Now
                        </a>
                    </div>
                <?php endwhile; ?>
            </div>
        </div>
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
                    <a href="./2048/2048.html" class="btn-play">Play Now</a>
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
                    <a href="./Memory Card/MemCard.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-war">
                <div class="card-image" style="background: #c0392b; color: white;">
                    <i class="fas fa-diamond"></i>
                </div>
                <div class="card-content">
                    <h3>War</h3>
                    <p>Battle of the decks. High card wins the round.</p>
                    <a href="Cards/cards.html" class="btn-play">Play Now</a>
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