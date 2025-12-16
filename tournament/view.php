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
    // Adjust paths relative to /tournament/ folder
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
    <title><?php echo $trn['display_name']; ?> Tournament</title>
    <link rel="stylesheet" href="../style.css">
    <style>
        .container { max-width: 1000px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; color: var(--accent-color); margin-bottom: 10px; }
        .code-badge { background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 15px; letter-spacing: 2px; }
        
        /* Bracket Styles */
        .round-title { border-bottom: 1px solid #555; padding-bottom: 10px; margin: 30px 0 15px 0; color: #aaa; text-transform: uppercase; letter-spacing: 2px; }
        .match-card {
            background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; padding: 15px; margin-bottom: 15px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .match-card.my-match { border-color: var(--accent-color); background: rgba(108, 92, 231, 0.1); }
        .vs { font-weight: bold; color: #555; margin: 0 10px; }
        .winner { color: #2ecc71; font-weight: bold; }
        .btn-sm { padding: 5px 15px; font-size: 0.8rem; border-radius: 5px; text-decoration: none; background: var(--accent-color); color: white; }
        
        /* Leaderboard Styles */
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { color: #aaa; }
        tr:hover { background: rgba(255,255,255,0.05); }
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
            <span class="code-badge"><?php echo $trn['code']; ?></span>
            <?php if($trn['status'] == 'completed'): ?>
                <h2 style="color:#ffd700; margin-top:20px;">TOURNAMENT COMPLETE</h2>
            <?php endif; ?>
        </div>

        <?php if ($trn['scoring_type'] === 'score'): ?>
            <div class="card-box" style="width:100%; text-align:left;">
                <table>
                    <thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Status</th></tr></thead>
                    <tbody>
                        <?php 
                        // Flatten matches to get scores
                        $scores = [];
                        foreach($matches as $round => $roundMatches) {
                            foreach($roundMatches as $m) {
                                // In score mode, matches are solo (P1 vs NULL)
                                $scores[] = [
                                    'name' => $m['p1_name'],
                                    'score' => $m['player1_score'],
                                    'status' => $m['status'],
                                    'is_me' => ($m['player1_id'] == $my_id),
                                    'match_id' => $m['id']
                                ];
                            }
                        }
                        // Sort by Score DESC
                        usort($scores, function($a, $b) { return $b['score'] - $a['score']; });

                        $rank = 1;
                        foreach($scores as $s): 
                        ?>
                            <tr style="<?php echo $s['is_me'] ? 'background:rgba(108,92,231,0.2);' : ''; ?>">
                                <td>#<?php echo $rank++; ?></td>
                                <td><?php echo htmlspecialchars($s['name']); ?></td>
                                <td><?php echo $s['score']; ?></td>
                                <td>
                                    <?php if($s['status'] == 'active' && $s['is_me']): ?>
                                        <a href="<?php echo getGameUrl($trn['game_slug'], $s['match_id']); ?>" class="btn-sm">PLAY NOW</a>
                                    <?php else: ?>
                                        <?php echo ($s['status'] == 'completed') ? 'Finished' : 'Playing...'; ?>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

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
                            <div>
                                <div style="<?php echo ($m['winner_id'] == $m['player1_id']) ? 'color:#2ecc71' : ''; ?>">
                                    <?php echo htmlspecialchars($p1); ?>
                                </div>
                                <div style="<?php echo ($m['winner_id'] && $m['winner_id'] == $m['player2_id']) ? 'color:#2ecc71' : ''; ?>">
                                    <?php echo htmlspecialchars($p2); ?>
                                </div>
                            </div>
                            
                            <div>
                                <?php if($m['status'] == 'completed'): ?>
                                    <span style="color:#aaa; font-size:0.8rem;">DONE</span>
                                <?php elseif($is_my_match && $m['status'] != 'pending'): ?>
                                    <?php 
                                        $can_play = false;
                                        if ($m['status'] == 'active' && $m['player1_id'] == $my_id) $can_play = true; // Start
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