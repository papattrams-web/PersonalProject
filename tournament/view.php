<?php
session_start();
include '../includes/db_connection.php';

if (!isset($_SESSION['user_id'])) { header("Location: ../Login/login.php"); exit(); }

$my_id = $_SESSION['user_id'];
$trn_id = intval($_GET['id']);

// 1. Fetch Tournament Info
$sql = "SELECT t.*, g.display_name, g.scoring_type, g.game_slug 
        FROM tournaments t 
        JOIN games g ON t.game_id = g.id 
        WHERE t.id = '$trn_id'";
$res = $conn->query($sql);
if ($res->num_rows == 0) die("Tournament not found");
$trn = $res->fetch_assoc();

// 2. Fetch Matches
// We join users 3 times: Player 1, Player 2, and Winner
$mRes = $conn->query("
    SELECT m.*, u1.username as p1_name, u2.username as p2_name, w.username as winner_name
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    LEFT JOIN users u2 ON m.player2_id = u2.id
    LEFT JOIN users w ON m.winner_id = w.id
    WHERE m.tournament_id = '$trn_id'
    ORDER BY m.round ASC, m.id ASC
");

$matches = [];
while($row = $mRes->fetch_assoc()) {
    $matches[$row['round']][] = $row;
}

// Helper for Game URL
function getGameUrl($slug, $match_id) {
    switch ($slug) {
        case '2048': return "../2048/2048.html?match_id=$match_id";
        case 'pacman': return "../PacMan/PacMan.php?match_id=$match_id";
        case 'sudoku': return "../Sudoku/sudoku.php?match_id=$match_id";
        case 'memory': return "../Memory Card/MemCard.php?match_id=$match_id";
        case '8ball': return "../8ball/8ball.php?match_id=$match_id";
        case 'tictactoe': return "../TicTacShow/TicTacShow.php?match_id=$match_id";
        case 'war': return "../Cards/cards.php?match_id=$match_id";
        default: return "#";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars($trn['display_name']); ?> Tournament</title>
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .container { max-width: 1000px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; color: var(--accent-color); margin-bottom: 10px; }
        .code-badge { background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 15px; letter-spacing: 2px; border: 1px solid #555; }
        
        /* Bracket Styles */
        .round-title { border-bottom: 1px solid #555; padding-bottom: 10px; margin: 30px 0 15px 0; color: #aaa; text-transform: uppercase; letter-spacing: 2px; }
        .match-card {
            background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; padding: 15px; margin-bottom: 15px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .match-card.my-match { border-color: var(--accent-color); background: rgba(108, 92, 231, 0.1); }
        .btn-sm { padding: 5px 15px; font-size: 0.8rem; border-radius: 5px; text-decoration: none; background: var(--accent-color); color: white; display:inline-block; }
        
        /* Leaderboard Styles */
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { color: #aaa; }
        tr:hover { background: rgba(255,255,255,0.05); }
        
        .crown-icon { color: #ffd700; margin-right: 5px; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand"><span class="logo-text">TOURNAMENT</span></div>
        <div class="user-menu"><a href="../homepage.php" class="btn-logout" style="text-decoration:none;">Dashboard</a></div>
    </nav>

    <div class="container">
        <div class="header">
            <h1><?php echo htmlspecialchars($trn['display_name']); ?></h1>
            <span class="code-badge">CODE: <?php echo $trn['code']; ?></span>
        </div>

        <?php if($trn['status'] == 'completed'): ?>
            <div style="background: linear-gradient(45deg, #f1c40f, #e67e22); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 40px; color: #000; box-shadow: 0 0 30px rgba(241, 196, 15, 0.3);">
                <h1 style="margin:0; font-size: 2.5rem; text-shadow:none;"><i class="fas fa-crown"></i> TOURNAMENT CHAMPION</h1>
                
                <?php
                    $winnerName = "Unknown";
                    // A. Bracket Game Winner
                    if ($trn['scoring_type'] !== 'score') {
                         $maxR = 0;
                         foreach($matches as $r => $ms) $maxR = max($maxR, $r);
                         if(isset($matches[$maxR][0]['winner_name'])) {
                             $winnerName = $matches[$maxR][0]['winner_name'];
                         }
                    } 
                    // B. Leaderboard Game Winner
                    else {
                         $highScore = -1;
                         foreach($matches as $roundMatches) {
                             foreach($roundMatches as $m) {
                                 if ($m['player1_score'] > $highScore) {
                                     $highScore = $m['player1_score'];
                                     $winnerName = $m['p1_name'];
                                 }
                             }
                         }
                    }
                ?>
                <h2 style="font-size: 3.5rem; margin: 10px 0; font-weight:800;"><?php echo htmlspecialchars($winnerName); ?></h2>
            </div>
        <?php endif; ?>

        <?php if ($trn['scoring_type'] === 'score'): ?>
            <div class="card-box" style="width:100%; text-align:left; padding:0; background:transparent; border:none;">
                <table style="background: rgba(0,0,0,0.3); border-radius:10px;">
                    <thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Status</th></tr></thead>
                    <tbody>
                        <?php 
                        $scores = [];
                        foreach($matches as $round => $roundMatches) {
                            foreach($roundMatches as $m) {
                                $scores[] = [
                                    'name' => $m['p1_name'],
                                    'score' => $m['player1_score'],
                                    'status' => $m['status'],
                                    'is_me' => ($m['player1_id'] == $my_id),
                                    'match_id' => $m['id']
                                ];
                            }
                        }
                        // Sort Descending
                        usort($scores, function($a, $b) { return $b['score'] - $a['score']; });

                        $rank = 1;
                        foreach($scores as $s): 
                            $is_winner = ($rank === 1 && $trn['status'] == 'completed');
                        ?>
                            <tr style="<?php echo $s['is_me'] ? 'background:rgba(108,92,231,0.2);' : ''; ?>">
                                <td>
                                    <?php if($is_winner): ?>
                                        <i class="fas fa-crown crown-icon"></i>
                                    <?php else: ?>
                                        #<?php echo $rank; ?>
                                    <?php endif; ?>
                                </td>
                                <td style="font-weight: bold; <?php echo $is_winner ? 'color: gold;' : ''; ?>">
                                    <?php echo htmlspecialchars($s['name']); ?>
                                </td>
                                <td><?php echo $s['score']; ?></td>
                                <td>
                                    <?php if($s['status'] == 'active' && $s['is_me']): ?>
                                        <a href="<?php echo getGameUrl($trn['game_slug'], $s['match_id']); ?>" class="btn-sm">PLAY NOW</a>
                                    <?php else: ?>
                                        <?php echo ($s['status'] == 'completed') ? 'Finished' : 'Playing...'; ?>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php $rank++; ?>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
            <?php if($trn['created_by'] == $my_id && $trn['status'] == 'active'): ?>
                <div style="text-align:center; margin-top:30px;">
                    <form action="process.php" method="POST" onsubmit="return confirm('End tournament and declare winner?');">
                        <input type="hidden" name="action" value="end_tournament">
                        <input type="hidden" name="tournament_id" value="<?php echo $trn_id; ?>">
                        <button class="btn-primary" style="background:#e74c3c;">End Tournament & Declare Winner</button>
                    </form>
                </div>
            <?php endif; ?>

        <?php else: ?>
            <?php foreach($matches as $round => $roundMatches): ?>
                <h3 class="round-title">
                    <?php 
                        if ($round == 1) echo "Round 1";
                        elseif (count($roundMatches) == 1) echo "Finals";
                        elseif (count($roundMatches) == 2) echo "Semi-Finals";
                        else echo "Round $round";
                    ?>
                </h3>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <?php foreach($roundMatches as $m): ?>
                        <?php 
                            $is_my_match = ($m['player1_id'] == $my_id || $m['player2_id'] == $my_id);
                            $p1 = $m['p1_name'];
                            $p2 = $m['p2_name'] ? $m['p2_name'] : "Waiting...";
                        ?>
                        <div class="match-card <?php echo $is_my_match ? 'my-match' : ''; ?>">
                            <div style="flex:1;">
                                <div style="display:flex; justify-content:space-between; <?php echo ($m['winner_id'] == $m['player1_id']) ? 'color:#2ecc71; font-weight:bold;' : ''; ?>">
                                    <span>
                                        <?php if($m['winner_id'] == $m['player1_id']) echo '<i class="fas fa-crown crown-icon"></i>'; ?>
                                        <?php echo htmlspecialchars($p1); ?>
                                    </span>
                                    <?php if($m['status'] == 'completed') echo "<span>" . ($m['winner_id'] == $m['player1_id'] ? 'WIN' : 'LOSE') . "</span>"; ?>
                                </div>
                                
                                <div style="display:flex; justify-content:space-between; margin-top:5px; <?php echo ($m['winner_id'] && $m['winner_id'] == $m['player2_id']) ? 'color:#2ecc71; font-weight:bold;' : ''; ?>">
                                    <span>
                                        <?php if($m['winner_id'] && $m['winner_id'] == $m['player2_id']) echo '<i class="fas fa-crown crown-icon"></i>'; ?>
                                        <?php echo htmlspecialchars($p2); ?>
                                    </span>
                                    <?php if($m['status'] == 'completed') echo "<span>" . ($m['winner_id'] == $m['player2_id'] ? 'WIN' : 'LOSE') . "</span>"; ?>
                                </div>
                            </div>
                            
                            <div style="margin-left:15px;">
                                <?php if($m['status'] == 'completed'): ?>
                                    <span style="color:#aaa; font-size:0.8rem;">DONE</span>
                                <?php elseif($is_my_match && $m['status'] != 'pending'): ?>
                                    <?php 
                                        $can_play = false;
                                        if ($m['status'] == 'active' && $m['player1_id'] == $my_id) $can_play = true; 
                                        if ($m['status'] == 'waiting_p1' && $m['player1_id'] == $my_id) $can_play = true;
                                        if ($m['status'] == 'waiting_p2' && $m['player2_id'] == $my_id) $can_play = true;
                                    ?>
                                    <?php if($can_play): ?>
                                        <a href="<?php echo getGameUrl($trn['game_slug'], $m['id']); ?>" class="btn-sm">PLAY</a>
                                    <?php else: ?>
                                        <span style="color:#aaa; font-size:0.8rem;">WAITING</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <span style="color:#555; font-size:0.8rem;">LOCKED</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>

    </div>
</body>
</html>