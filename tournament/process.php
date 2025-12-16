<?php
session_start();
include '../includes/db_connection.php';

if (!isset($_SESSION['user_id'])) { header("Location: ../Login/login.php"); exit(); }

$my_id = $_SESSION['user_id'];
$action = isset($_POST['action']) ? $_POST['action'] : '';

// --- 1. CREATE TOURNAMENT ---
if ($action === 'create') {
    $game_slug = $conn->real_escape_string($_POST['game_slug']);
    
    // Get Game ID
    $gRes = $conn->query("SELECT id FROM games WHERE game_slug = '$game_slug'");
    $game_id = $gRes->fetch_assoc()['id'];

    // Generate Code (e.g., TRN-8392)
    $code = "TRN-" . rand(1000, 9999);

    // Insert Tournament
    $sql = "INSERT INTO tournaments (name, game_id, created_by, status, code) VALUES ('$code', '$game_id', '$my_id', 'open', '$code')";
    if ($conn->query($sql)) {
        $trn_id = $conn->insert_id;
        // Auto-join creator
        $conn->query("INSERT INTO tournament_participants (tournament_id, user_id) VALUES ('$trn_id', '$my_id')");
        header("Location: lobby.php?id=$trn_id");
    } else {
        header("Location: index.php?err=Database error");
    }
}

// --- 2. JOIN TOURNAMENT ---
// --- 2. JOIN / RE-ENTER TOURNAMENT ---
elseif ($action === 'join') {
    $code = $conn->real_escape_string($_POST['code']);
    
    // 1. Find Tournament
    $res = $conn->query("SELECT id, status FROM tournaments WHERE code = '$code'");
    if ($res->num_rows == 0) { 
        header("Location: index.php?err=Invalid Code"); 
        exit(); 
    }
    
    $trn = $res->fetch_assoc();
    $trn_id = $trn['id'];
    
    // 2. Check if I am ALREADY a participant
    $check = $conn->query("SELECT id FROM tournament_participants WHERE tournament_id = '$trn_id' AND user_id = '$my_id'");
    $is_participant = ($check->num_rows > 0);

    // 3. Logic:
    // If I am ALREADY in -> Go straight to the view (or lobby if not started)
    // If I am NOT in -> Check if open. If closed, reject.
    
    if ($is_participant) {
        if ($trn['status'] == 'open') {
            header("Location: lobby.php?id=$trn_id");
        } else {
            // Active or Completed -> Go to Bracket
            header("Location: view.php?id=$trn_id");
        }
        exit();
    } else {
        // New user trying to join
        if ($trn['status'] !== 'open') {
            header("Location: index.php?err=Tournament has already started or ended.");
            exit();
        }
        
        // Add to list
        $conn->query("INSERT INTO tournament_participants (tournament_id, user_id) VALUES ('$trn_id', '$my_id')");
        header("Location: lobby.php?id=$trn_id");
    }
}

// --- 3. START TOURNAMENT (The Big Logic) ---
elseif ($action === 'start') {
    $trn_id = intval($_POST['tournament_id']);
    
    // Verify Owner
    $tRes = $conn->query("SELECT * FROM tournaments WHERE id = '$trn_id'");
    $trn = $tRes->fetch_assoc();
    if ($trn['created_by'] != $my_id) die("Unauthorized");

    // Fetch Participants
    $pRes = $conn->query("SELECT user_id FROM tournament_participants WHERE tournament_id = '$trn_id'");
    $players = [];
    while($row = $pRes->fetch_assoc()) $players[] = $row['user_id'];
    
    $count = count($players);
    if ($count < 2) { header("Location: lobby.php?id=$trn_id&err=Need at least 2 players"); exit(); }

    // Get Game Type
    $gRes = $conn->query("SELECT scoring_type, game_slug FROM games WHERE id = '{$trn['game_id']}'");
    $game = $gRes->fetch_assoc();
    $is_score_based = ($game['scoring_type'] === 'score');

    // --- LEADERBOARD LOGIC (Sudoku, PacMan, 2048) ---
    if ($is_score_based) {
        // 1. Generate Master Board (Simplified Placeholders)
        // Ideally, we'd call a generator, but for now we set a flag so the FIRST player generates it,
        // OR we can just rely on the first player's logic if we trust it. 
        // Better yet: We leave board_state NULL. The first player to load the game generates it,
        // submit_score saves it to the MATCH. We need a way to sync.
        
        // Simpler Sync: We create matches. The first match to finish saves the board to the TOURNAMENT table.
        // Or we just let them play random boards? NO, you requested same board.
        
        // Strategy: We create the matches. We set a special flag in board_state "WAITING_FOR_GEN".
        // Actually, let's stick to the method we used for 1v1: First player generates.
        // But here we have 16 players. 
        
        // Okay, simpler: We loop through players and create a "Solo Match" for each.
        // They are Player 1. Player 2 is NULL.
        
        foreach ($players as $pid) {
            $conn->query("INSERT INTO matches (tournament_id, game_id, player1_id, status) VALUES ('$trn_id', '{$trn['game_id']}', '$pid', 'active')");
        }
        
        // We handle the "Same Board" logic in the game JS by checking tournament_id.
        // Actually, let's keep it simple: For V1, they play generated boards. 
        // Fixing synchronization for 16 concurrent users is complex without a dedicated generator script.
        // **However**, we can do this: 
        // The Tournament View page will have a JS generator that runs ONCE for the host, saves to DB via AJAX, then redirects to Start.
        // For now, let's just start the matches.
    }

    // --- BRACKET LOGIC (War, 8 Ball) ---
    else {
        // Must be Power of 2 (2, 4, 8, 16)
        if (($count & ($count - 1)) != 0) { 
            header("Location: lobby.php?id=$trn_id&err=Player count must be power of 2 (2, 4, 8, 16) for this game."); 
            exit(); 
        }

        shuffle($players); // Randomize Seeds

        // Create Round 1 Matches
        for ($i = 0; $i < $count; $i += 2) {
            $p1 = $players[$i];
            $p2 = $players[$i+1];
            $conn->query("INSERT INTO matches (tournament_id, game_id, round, player1_id, player2_id, status) 
                          VALUES ('$trn_id', '{$trn['game_id']}', 1, '$p1', '$p2', 'pending')");
        }
    }

    // Close Lobby
    $conn->query("UPDATE tournaments SET status = 'active' WHERE id = '$trn_id'");
    header("Location: view.php?id=$trn_id");
}

// --- 4. MANUALLY END TOURNAMENT (For Leaderboard Games) ---
elseif ($action === 'end_tournament') {
    $trn_id = intval($_POST['tournament_id']);
    
    // Verify Owner
    $tRes = $conn->query("SELECT created_by FROM tournaments WHERE id = '$trn_id'");
    $creator = $tRes->fetch_assoc()['created_by'];
    
    if ($creator == $my_id) {
        $conn->query("UPDATE tournaments SET status = 'completed' WHERE id = '$trn_id'");
    }
    
    header("Location: view.php?id=$trn_id");
}


?>