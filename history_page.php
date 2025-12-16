<?php
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$my_id = $_SESSION['user_id'];
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';

// --- 1. Fetch Pending Requests (NEW SECTION) ---
$inboxSql = "SELECT m.id as match_id, u.username as challenger, g.display_name, g.game_slug
             FROM matches m
             JOIN users u ON m.player1_id = u.id
             JOIN games g ON m.game_id = g.id
             WHERE m.player2_id = '$my_id' AND m.status = 'pending'";
$inboxResult = $conn->query($inboxSql);

// --- 2. Fetch Active/History Matches ---
$sql = "SELECT m.*, g.display_name, g.game_slug,
        u1.username as p1_name, u2.username as p2_name
        FROM matches m
        JOIN games g ON m.game_id = g.id
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE (m.player1_id = '$my_id' OR m.player2_id = '$my_id') 
        AND m.status != 'pending'";

if ($filter !== 'all') {
    $safe_filter = $conn->real_escape_string($filter);
    $sql .= " AND g.game_slug = '$safe_filter'";
}

$sql .= " ORDER BY 
            CASE 
                WHEN m.status LIKE 'waiting%' THEN 0  -- Your turn/Their turn first
                ELSE 1 
            END,
            m.played_at DESC"; // Then by date

$result = $conn->query($sql);

function getGameUrl($slug, $match_id) {
    $path = "";
    switch ($slug) {
        case '2048': $path = "2048/2048.php"; break;
        case 'pacman': $path = "PacMan/PacMan.php"; break;
        case 'sudoku': $path = "Sudoku/sudoku.php"; break;
        case 'memory': $path = "Memory Card/MemCard.php"; break;
        case '8ball': $path = "8ball/8ball.php"; break;
        case 'tictactoe': $path = "TicTacShow/TicTacShow.php"; break;
        case 'war': $path = "Cards/cards.php"; break;
        default: return "#";
    }
    return $path . "?match_id=" . $match_id;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geekerz - Matches</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .history-container {
            max-width: 900px;
            margin: 30px auto;
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 20px;
        }
        .filter-bar { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 30px; }
        .filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: #aaa; text-decoration: none; font-size: 0.9rem; }
        .filter-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }
        .filter-btn.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }

        .match-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 10px; background: rgba(0,0,0,0.3); border-left: 5px solid #555; }
        .win { border-left-color: #2ecc71; }
        .lose { border-left-color: #e74c3c; }
        .draw { border-left-color: #f1c40f; }
        .active { border-left-color: #3498db; }
        .request { border-left-color: #e67e22; background: rgba(230, 126, 34, 0.1); }

        .action-btn { padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 0.9rem; display: inline-block; transition: 0.2s; }
        .btn-play { background-color: #3498db; color: white; }
        .btn-accept { background-color: #2ecc71; color: white; margin-right: 10px; }
        .btn-decline { background-color: #e74c3c; color: white; }
        .btn-wait { background-color: #555; color: #aaa; cursor: not-allowed; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand"><span class="logo-text">GEEKERZ</span></div>
        <div class="user-menu"><a href="homepage.php" class="btn-logout" style="text-decoration:none;">Dashboard</a></div>
    </nav>

    <div class="hero">
        <h1>Matches & Requests</h1>
    </div>

    <div class="history-container">
        
        <?php if ($inboxResult->num_rows > 0): ?>
            <h3 style="color: #e67e22; margin-bottom: 15px;"><i class="fas fa-envelope"></i> Game Requests</h3>
            <?php while($row = $inboxResult->fetch_assoc()): ?>
                <div class="match-row request">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 5px;"><?php echo htmlspecialchars($row['display_name']); ?></h3>
                        <span style="color:#fff;">Challenge from <strong><?php echo htmlspecialchars($row['challenger']); ?></strong></span>
                    </div>
                    <div>
                        <a href="includes/handle_challenge.php?action=accept&id=<?php echo $row['match_id']; ?>&game=<?php echo $row['game_slug']; ?>" class="action-btn btn-accept">Accept</a>
                        <a href="includes/handle_challenge.php?action=decline&id=<?php echo $row['match_id']; ?>" class="action-btn btn-decline">Decline</a>
                    </div>
                </div>
            <?php endwhile; ?>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
        <?php endif; ?>


        <h3 style="color: #3498db; margin-bottom: 15px;"><i class="fas fa-gamepad"></i> Your Matches</h3>
        
        <div class="filter-bar">
            <a href="?filter=all" class="filter-btn <?php echo $filter == 'all' ? 'active' : ''; ?>">All</a>
            <a href="?filter=2048" class="filter-btn <?php echo $filter == '2048' ? 'active' : ''; ?>">2048</a>
            <a href="?filter=pacman" class="filter-btn <?php echo $filter == 'pacman' ? 'active' : ''; ?>">PacMan</a>
            <a href="?filter=sudoku" class="filter-btn <?php echo $filter == 'sudoku' ? 'active' : ''; ?>">Sudoku</a>
            <a href="?filter=memory" class="filter-btn <?php echo $filter == 'memory' ? 'active' : ''; ?>">Memory</a>
            <a href="?filter=8ball" class="filter-btn <?php echo $filter == '8ball' ? 'active' : ''; ?>">8 Ball</a>
            <a href="?filter=tictactoe" class="filter-btn <?php echo $filter == 'tictactoe' ? 'active' : ''; ?>">Tic Tac Show</a>
            <a href="?filter=war" class="filter-btn <?php echo $filter == 'war' ? 'active' : ''; ?>">War</a>
        </div>

        <?php if ($result && $result->num_rows > 0): ?>
            <?php while($row = $result->fetch_assoc()): ?>
                <?php
                    $is_p1 = ($row['player1_id'] == $my_id);
                    $opponent = $is_p1 ? $row['p2_name'] : $row['p1_name'];
                    $my_score = $is_p1 ? $row['player1_score'] : $row['player2_score'];
                    $their_score = $is_p1 ? $row['player2_score'] : $row['player1_score'];
                    $status = $row['status'];
                    $row_class = 'active';
                    $display_html = '';

                    if ($status == 'completed') {
                        if ($row['winner_id'] == $my_id) { $row_class = 'win'; $display_html = '<span style="color:#2ecc71; font-weight:bold;">VICTORY</span>'; }
                        elseif ($row['winner_id'] === NULL) { $row_class = 'draw'; $display_html = '<span style="color:#f1c40f; font-weight:bold;">DRAW</span>'; }
                        else { $row_class = 'lose'; $display_html = '<span style="color:#e74c3c; font-weight:bold;">DEFEAT</span>'; }
                    } else {
                        $is_my_turn = false;
                        if ($status == 'active' && $is_p1) $is_my_turn = true;
                        elseif ($status == 'waiting_p1' && $is_p1) $is_my_turn = true;
                        elseif ($status == 'waiting_p2' && !$is_p1) $is_my_turn = true;

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
                        <span style="color:#aaa;">vs <?php echo htmlspecialchars($opponent); ?></span> <br>
                        <span style="color:#aaa;">Match ID: <?php echo htmlspecialchars($row['id']); ?></span>
                    </div>
                    <div style="font-weight:bold; font-size:1.2rem; min-width:100px; text-align:center;">
                        <?php if($status == 'completed'): ?>
                            <span style="color:#fff;"><?php echo $my_score; ?></span> - <span style="color:#fff;"><?php echo $their_score; ?></span>
                        <?php else: ?>
                            <span style="color:#aaa; font-size:0.9rem;">IN PROGRESS</span>
                        <?php endif; ?>
                    </div>
                    <div style="flex: 0.5; text-align: right;"><?php echo $display_html; ?></div>
                </div>
            <?php endwhile; ?>
        <?php else: ?>
            <p style="text-align:center; color:#aaa;">No matches found.</p>
        <?php endif; ?>
    </div>

</body>
</html>