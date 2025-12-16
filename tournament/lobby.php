<?php
session_start();
include '../includes/db_connection.php';
$trn_id = intval($_GET['id']);
$my_id = $_SESSION['user_id'];

// Fetch Info
$res = $conn->query("SELECT t.*, g.display_name, g.scoring_type FROM tournaments t JOIN games g ON t.game_id = g.id WHERE t.id = '$trn_id'");
$trn = $res->fetch_assoc();

if($trn['status'] == 'active' || $trn['status'] == 'completed') {
    header("Location: view.php?id=$trn_id");
    exit();
}

// Fetch Players
$pRes = $conn->query("SELECT u.username FROM tournament_participants tp JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = '$trn_id'");
?>

<!DOCTYPE html>
<html>
<head>
    <title>Lobby - <?php echo $trn['display_name']; ?></title>
    <link rel="stylesheet" href="../style.css">
    <meta http-equiv="refresh" content="5"> 
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand"><span class="logo-text">LOBBY</span></div>
        <div class="user-menu"><a href="../homepage.php" class="btn-logout">Exit</a></div>
    </nav>

    <div class="hero">
        <h1 style="color: #f1c40f;">Code: <?php echo $trn['code']; ?></h1>
        <p>Share this code to invite players.</p>
        
        <?php if($trn['created_by'] == $my_id): ?>
            <form action="process.php" method="POST">
                <input type="hidden" name="action" value="start">
                <input type="hidden" name="tournament_id" value="<?php echo $trn_id; ?>">
                <button class="btn-primary" style="font-size:1.5rem; padding:15px 40px; margin-top:20px;">START TOURNAMENT</button>
            </form>
            <?php if(isset($_GET['err'])) echo "<p style='color:red'>{$_GET['err']}</p>"; ?>
        <?php else: ?>
            <h3 style="color:#aaa; margin-top:20px;">Waiting for Host to start...</h3>
        <?php endif; ?>
    </div>

    <div class="container" style="max-width:600px;">
        <h3>Participants (<?php echo $pRes->num_rows; ?>)</h3>
        <ul style="list-style:none; padding:0;">
            <?php while($row = $pRes->fetch_assoc()): ?>
                <li style="background:rgba(255,255,255,0.1); padding:15px; margin-bottom:10px; border-radius:10px;">
                    <?php echo htmlspecialchars($row['username']); ?>
                </li>
            <?php endwhile; ?>
        </ul>
    </div>
</body>
</html>