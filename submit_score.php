<?php
session_start();
include 'includes/db_connection.php';

header('Content-Type: application/json');

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit();
}

$user_id = $_SESSION['user_id'];

// 2. Get Data from JavaScript (JSON)
$data = json_decode(file_get_contents('php://input'), true);

$game_slug = $conn->real_escape_string($data['game']);
$score = intval($data['score']);
$type = $data['type']; // 'score' or 'win'

// 3. Get Game ID
$gameQuery = "SELECT id FROM games WHERE game_slug = '$game_slug'";
$gameResult = $conn->query($gameQuery);

if ($gameResult->num_rows > 0) {
    $gameRow = $gameResult->fetch_assoc();
    $game_id = $gameRow['id'];

    // 4. Update Leaderboard
    if ($type === 'win') {
        // For 8Ball/TicTacToe: Increment win count (Score = Current Wins + 1)
        // We use ON DUPLICATE KEY UPDATE to either insert a new row or update existing
        $sql = "INSERT INTO leaderboard (user_id, game_id, highscore) 
                VALUES ('$user_id', '$game_id', 1) 
                ON DUPLICATE KEY UPDATE highscore = highscore + 1";
    } else {
        // For Timed Games: Update only if new score is higher
        $sql = "INSERT INTO leaderboard (user_id, game_id, highscore) 
                VALUES ('$user_id', '$game_id', '$score') 
                ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$score')";
    }

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $conn->error]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Game not found']);
}
?>