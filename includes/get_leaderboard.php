<?php
include 'db_connection.php';

header('Content-Type: application/json');

// Get the game slug (e.g., '2048' or '8ball') from the request
$game_slug = isset($_GET['game']) ? $conn->real_escape_string($_GET['game']) : '';

if ($game_slug) {
    // 1. Find Game ID and Scoring Type
    $idQuery = "SELECT id, scoring_type FROM games WHERE game_slug = '$game_slug'";
    $idResult = $conn->query($idQuery);
    
    if ($idResult->num_rows > 0) {
        $gameData = $idResult->fetch_assoc();
        $game_id = $gameData['id'];
        
        // 2. Fetch Top 10 Scores
        $sql = "SELECT u.username, l.highscore 
                FROM leaderboard l
                JOIN users u ON l.user_id = u.id
                WHERE l.game_id = '$game_id'
                ORDER BY l.highscore DESC
                LIMIT 10";
                
        $result = $conn->query($sql);
        
        $leaders = [];
        $rank = 1;
        while($row = $result->fetch_assoc()) {
            $row['rank'] = $rank++;
            $leaders[] = $row;
        }
        
        // FIX: Ensure 'scoring' key matches what frontend expects
        echo json_encode(['status' => 'success', 'data' => $leaders, 'scoring' => $gameData['scoring_type']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Game not found']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No game specified']);
}
?>