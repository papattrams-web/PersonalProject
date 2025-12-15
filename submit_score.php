<?php
// 1. ENABLE DEBUGGING
ini_set('display_errors', 0); // Turn off HTML error printing (corrupts JSON)
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    session_start();

    // 2. CHECK DATABASE FILE
    $path = __DIR__ . '/includes/db_connection.php';
    if (!file_exists($path)) {
        throw new Exception("Database file not found at: " . $path);
    }
    require_once $path;

    // 3. AUTH CHECK
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("User not logged in.");
    }

    $user_id = $_SESSION['user_id'];
    
    // 4. GET INPUT
    $json_input = file_get_contents('php://input');
    $data = json_decode($json_input, true);

    if (!$data) {
        throw new Exception("Invalid or missing JSON input.");
    }

    $game_slug = $conn->real_escape_string($data['game']);
    $score = isset($data['score']) ? intval($data['score']) : 0;
    $type = isset($data['type']) ? $data['type'] : 'score';
    $match_id = isset($data['match_id']) ? intval($data['match_id']) : null;

    // 5. GET GAME ID
    $gameQuery = "SELECT id FROM games WHERE game_slug = '$game_slug'";
    $gameResult = $conn->query($gameQuery);

    if (!$gameResult || $gameResult->num_rows === 0) {
        throw new Exception("Game not found: " . $game_slug);
    }

    $gameRow = $gameResult->fetch_assoc();
    $game_id = $gameRow['id'];

    // 6. PROCESS MATCH
    if ($match_id) {
        $checkMatch = "SELECT * FROM matches WHERE id = '$match_id'";
        $mResult = $conn->query($checkMatch);
        
        if (!$mResult) {
            throw new Exception("Database Query Failed: " . $conn->error);
        }
        
        if ($mResult->num_rows > 0) {
            $matchData = $mResult->fetch_assoc();
            
            // --- A. TURN UPDATE ---
            if ($type === 'turn_update') {
                if (!isset($data['board_state'])) {
                    throw new Exception("Missing board_state data.");
                }
                
                $board_state = $conn->real_escape_string($data['board_state']);
                
                // Toggle Status
                $newStatus = ($user_id == $matchData['player1_id']) ? 'waiting_p2' : 'waiting_p1';

                $sql = "UPDATE matches SET board_state = '$board_state', status = '$newStatus' WHERE id = '$match_id'";
                
                if ($conn->query($sql)) {
                    echo json_encode(['status' => 'success']);
                    exit(); 
                } else {
                    throw new Exception("Update Failed: " . $conn->error);
                }
            }

            // --- B. SCORING / GAME OVER ---
            // (Logic omitted for brevity, but safe fallback exists)
            
            // Just for now, let's treat other types as generic updates if needed
             // ... [Existing win logic goes here normally] ...
        } else {
            throw new Exception("Match ID $match_id not found.");
        }
    }

    // --- FALLBACK: LEADERBOARD UPDATE ---
    // Only runs if we haven't exited yet
    $lbSql = "INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$user_id', '$game_id', '$score') 
              ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$score')";

    if ($conn->query($lbSql)) {
        echo json_encode(['status' => 'success']);
    } else {
        throw new Exception("Leaderboard Error: " . $conn->error);
    }

} catch (Exception $e) {
    // CATCH ANY CRASH AND SEND IT TO BROWSER
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>