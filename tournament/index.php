<?php
session_start();
include '../includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: ../Login/login.php");
    exit();
}

$msg = isset($_GET['msg']) ? $_GET['msg'] : '';
$err = isset($_GET['err']) ? $_GET['err'] : '';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tournament Mode</title>
    <link rel="stylesheet" href="../style.css">
    <style>
        .split-container { display: flex; flex-wrap: wrap; gap: 30px; justify-content: center; margin-top: 50px; }
        .card-box { 
            background: rgba(255,255,255,0.05); padding: 40px; border-radius: 20px; 
            width: 400px; text-align: center; border: 1px solid rgba(255,255,255,0.1);
        }
        .card-box h2 { margin-bottom: 20px; color: var(--accent-color); }
        .input-code { 
            padding: 15px; width: 100%; border-radius: 10px; border: 1px solid #555; 
            background: rgba(0,0,0,0.5); color: white; font-size: 1.2rem; text-align: center; letter-spacing: 2px;
        }
        select { width: 100%; padding: 15px; background: #333; color: white; border: 1px solid #555; border-radius: 10px; margin-bottom: 15px; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand"><span class="logo-text">GEEKERZ</span></div>
        <div class="user-menu"><a href="../homepage.php" class="btn-logout" style="text-decoration:none;">Dashboard</a></div>
    </nav>

    <div class="hero">
        <h1>Tournament Mode</h1>
        <p>Compete for the ultimate glory</p>
        <?php if($err) echo "<p style='color:#e74c3c; background:rgba(0,0,0,0.5); padding:10px; border-radius:5px;'>$err</p>"; ?>
    </div>

    <div class="split-container">
        
        <?php
            // Fetch tournaments I have joined
            $myTrnSql = "SELECT t.id, t.name, t.status, g.display_name 
                         FROM tournament_participants tp 
                         JOIN tournaments t ON tp.tournament_id = t.id 
                         JOIN games g ON t.game_id = g.id 
                         WHERE tp.user_id = '$my_id' 
                         ORDER BY t.created_at DESC";
            $myTrnRes = $conn->query($myTrnSql);
        ?>
        
        <?php if ($myTrnRes->num_rows > 0): ?>
            <div class="card-box" style="width: 100%; max-width: 830px; border-color: var(--accent-color);">
                <h2>Your Tournaments</h2>
                <table style="width:100%; text-align:left; border-collapse:collapse;">
                    <tr style="color:#aaa; border-bottom:1px solid #555;">
                        <th style="padding:10px;">Game</th>
                        <th style="padding:10px;">Status</th>
                        <th style="padding:10px;">Action</th>
                    </tr>
                    <?php while($row = $myTrnRes->fetch_assoc()): ?>
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                            <td style="padding:15px; font-weight:bold;"><?php echo htmlspecialchars($row['display_name']); ?></td>
                            <td style="padding:15px;">
                                <?php 
                                    if($row['status'] == 'open') echo '<span style="color:#f1c40f">Lobby Open</span>';
                                    elseif($row['status'] == 'active') echo '<span style="color:#3498db">In Progress</span>';
                                    else echo '<span style="color:#2ecc71">Completed</span>';
                                ?>
                            </td>
                            <td style="padding:15px;">
                                <?php if($row['status'] == 'open'): ?>
                                    <a href="lobby.php?id=<?php echo $row['id']; ?>" class="btn-sm">Go to Lobby</a>
                                <?php else: ?>
                                    <a href="view.php?id=<?php echo $row['id']; ?>" class="btn-sm" style="background:#2ecc71;">View Bracket</a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                </table>
            </div>
        <?php endif; ?>

        <div class="card-box">
            <h2>Create New</h2>
            <form action="process.php" method="POST">
                <input type="hidden" name="action" value="create">
                
                <label style="display:block; text-align:left; margin-bottom:5px;">Select Game</label>
                <select name="game_slug" required>
                    <option value="2048">2048 (Leaderboard)</option>
                    <option value="pacman">PacMan (Leaderboard)</option>
                    <option value="sudoku">Sudoku (Leaderboard)</option>
                    <option value="memory">Memory Card (Bracket)</option>
                    <option value="8ball">8 Ball Pool (Bracket)</option>
                    <option value="tictactoe">Tic Tac Show (Bracket)</option>
                    <option value="war">War (Bracket)</option>
                </select>

                <button type="submit" class="btn-primary">Create & Get Code</button>
            </form>
        </div>

        <div class="card-box">
            <h2>Join with Code</h2>
            <form action="process.php" method="POST">
                <input type="hidden" name="action" value="join">
                <label style="display:block; text-align:left; margin-bottom:5px;">Enter Code</label>
                <input type="text" name="code" class="input-code" placeholder="TRN-XXXX" required>
                <button type="submit" class="btn-primary" style="background:#2ecc71; margin-top:20px;">Join Lobby</button>
            </form>
        </div>

    </div>
</body>
</html>