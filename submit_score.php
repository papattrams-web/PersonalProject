<?php
session_start();
include 'includes/db_connection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$game_slug = $conn->real_escape_string($data['game']);
$score = intval($data['score']);
$type = $data['type']; // 'score' or 'win'
$match_id = isset($data['match_id']) ? intval($data['match_id']) : null;

// 1. Get Game ID
$gameQuery = "SELECT id FROM games WHERE game_slug = '$game_slug'";
$gameResult = $conn->query($gameQuery);

if ($gameResult->num_rows > 0) {
    $gameRow = $gameResult->fetch_assoc();
    $game_id = $gameRow['id'];

    // --- LOGIC A: RANKED MATCH UPDATE ---
    // --- LOGIC A: RANKED MATCH UPDATE ---
    if ($match_id) {
        // Verify user is part of this match
        $checkMatch = "SELECT * FROM matches WHERE id = '$match_id'";
        $mResult = $conn->query($checkMatch);
        
        if($mResult->num_rows > 0) {
            $matchData = $mResult->fetch_assoc();
            $status = $matchData['status'];
            
            // CASE 1: Opponent (Player 2) just finished playing
            if ($user_id == $matchData['player2_id']) {
                $new_score = ($type === 'win') ? 1 : $score; // 1 for win, or actual score
                
                // Update P2 score and set status so P1 knows it's their turn
                $updateSql = "UPDATE matches SET player2_score = '$new_score', status = 'waiting_p1' WHERE id = '$match_id'";
                $conn->query($updateSql);
            } 
            
            // CASE 2: Challenger (Player 1) just finished playing
            elseif ($user_id == $matchData['player1_id']) {
                $p1_score = ($type === 'win') ? 1 : $score;
                $p2_score = $matchData['player2_score'];
                
                // Determine Winner
                $winner_id = "NULL"; // Default Draw
                if ($p1_score > $p2_score) {
                    $winner_id = $matchData['player1_id'];
                } elseif ($p2_score > $p1_score) {
                    $winner_id = $matchData['player2_id'];
                }
                
                // Update P1 score, set Winner, Mark Completed
                $updateSql = "UPDATE matches SET player1_score = '$p1_score', winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'";
                $conn->query($updateSql);
                
                // Update Winner's Global Win Count (for Leaderboard)
                if($winner_id !== "NULL") {
                    $winSql = "INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$winner_id', '$game_id', 1) 
                               ON DUPLICATE KEY UPDATE highscore = highscore + 1";
                    $conn->query($winSql);
                }
            }

            // ... inside the if($match_id) block ...

            if ($type === 'turn_update') {
                $board_state = $conn->real_escape_string($data['board_state']);
                
                // Determine who just played based on session ID
                $checkMatch = "SELECT player1_id, player2_id, status FROM matches WHERE id = '$match_id'";
                $mResult = $conn->query($checkMatch);
                $mData = $mResult->fetch_assoc();

                $newStatus = '';
                // If I am P1 and I played, now it's P2's turn
                if ($user_id == $mData['player1_id']) {
                    $newStatus = 'waiting_p2'; // Or whatever logic you prefer
                } else {
                    $newStatus = 'waiting_p1';
                }

                $sql = "UPDATE matches SET board_state = '$board_state', status = '$newStatus' WHERE id = '$match_id'";
                $conn->query($sql);
                
                echo json_encode(['status' => 'success']);
                exit();
            }
        }
    }

    // --- LOGIC B: GLOBAL LEADERBOARD UPDATE ---
    // We ALWAYS update your global profile, even during a ranked match.
    if ($type === 'win') {
        $lbSql = "INSERT INTO leaderboard (user_id, game_id, highscore) 
                VALUES ('$user_id', '$game_id', 1) 
                ON DUPLICATE KEY UPDATE highscore = highscore + 1";
    } else {
        $lbSql = "INSERT INTO leaderboard (user_id, game_id, highscore) 
                VALUES ('$user_id', '$game_id', '$score') 
                ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$score')";
    }

    if ($conn->query($lbSql) === TRUE) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $conn->error]);
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Game not found']);
}
?>