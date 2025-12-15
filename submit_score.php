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
    if ($match_id) {
        // Verify user is part of this match
        $checkMatch = "SELECT player1_id, player2_id FROM matches WHERE id = '$match_id'";
        $mResult = $conn->query($checkMatch);
        
        if($mResult->num_rows > 0) {
            $matchData = $mResult->fetch_assoc();
            
            if ($type === 'win') {
                // For Win/Loss games (8Ball/TicTacToe), if this runs, THIS user won.
                // We mark the match completed and set the winner.
                $updateSql = "UPDATE matches SET winner_id = '$user_id', status = 'completed' WHERE id = '$match_id'";
                $conn->query($updateSql);
            } else {
                // For Score games (2048), update the specific player's score
                if($user_id == $matchData['player1_id']) {
                    $updateSql = "UPDATE matches SET player1_score = '$score' WHERE id = '$match_id'";
                } elseif($user_id == $matchData['player2_id']) {
                    $updateSql = "UPDATE matches SET player2_score = '$score' WHERE id = '$match_id'";
                }
                $conn->query($updateSql);
                
                // Note: We leave status 'active'. You can write logic to close it 
                // when both scores are > 0 if you want.
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