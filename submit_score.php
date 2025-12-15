<?php
// submit_score.php - CORRECTED VERSION
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    session_start();
    require_once __DIR__ . '/includes/db_connection.php';

    if (!isset($_SESSION['user_id'])) throw new Exception("User not logged in.");
    $user_id = $_SESSION['user_id'];
    
    $json_input = file_get_contents('php://input');
    $data = json_decode($json_input, true);
    if (!$data) throw new Exception("Invalid JSON.");

    $game_slug = $conn->real_escape_string($data['game']);
    $type = isset($data['type']) ? $data['type'] : 'score'; // 'score', 'win', 'loss', 'turn_update'
    $match_id = isset($data['match_id']) ? intval($data['match_id']) : null;
    $score = isset($data['score']) ? intval($data['score']) : 0; // -1 for loss, 1 for win

    // Get Game ID
    $gRes = $conn->query("SELECT id FROM games WHERE game_slug = '$game_slug'");
    if (!$gRes || $gRes->num_rows == 0) throw new Exception("Game not found.");
    $game_id = $gRes->fetch_assoc()['id'];

    // --- MATCH LOGIC ---
    if ($match_id) {
        $mRes = $conn->query("SELECT * FROM matches WHERE id = '$match_id'");
        if (!$mRes || $mRes->num_rows == 0) throw new Exception("Match not found.");
        $matchData = $mRes->fetch_assoc();

        // 1. HANDLE TURN UPDATES (Game continues)
        if ($type === 'turn_update') {
            $board_state = $conn->real_escape_string($data['board_state']);
            // Toggle Turn
            $newStatus = ($user_id == $matchData['player1_id']) ? 'waiting_p2' : 'waiting_p1';
            
            $conn->query("UPDATE matches SET board_state = '$board_state', status = '$newStatus' WHERE id = '$match_id'");
            echo json_encode(['status' => 'success']);
            exit(); 
        }

        // [INSERT THIS BLOCK BETWEEN 'turn_update' AND 'win/loss' BLOCKS]

        // 3. HANDLE STANDARD SCORING (Sudoku, 2048, PacMan)
        if ($type === 'score') {
            
            // 1. Handle Board State (Whoever plays first sets the board)
            $extra_sql = "";
            if (isset($data['board_state'])) {
                $b_state = $conn->real_escape_string($data['board_state']);
                // Only save board state if it's sent
                $extra_sql = ", board_state = '$b_state'";
            }

            // 2. Identify Who Is Playing
            $is_p1 = ($user_id == $matchData['player1_id']);
            $my_score_col = $is_p1 ? "player1_score" : "player2_score";
            
            // 3. Check Match Status to decide next step
            // IF match is 'active' (or pending), it means I am the FIRST to finish.
            if ($matchData['status'] == 'active' || $matchData['status'] == 'pending') {
                $newStatus = $is_p1 ? 'waiting_p2' : 'waiting_p1';
                
                // Save my score, save the board, and set status to wait for opponent
                $conn->query("UPDATE matches SET $my_score_col = $score, status = '$newStatus' $extra_sql WHERE id = '$match_id'");
            } 
            
            // IF match is 'waiting_p1' or 'waiting_p2', it means the OTHER player already finished.
            else {
                // I am the SECOND to finish. Logic to End the Game.
                
                // Get the scores
                $p1_score = $is_p1 ? $score : $matchData['player1_score'];
                $p2_score = $is_p1 ? $matchData['player2_score'] : $score;
                
                // Determine Winner
                $winner_id = "NULL";
                if ($p1_score > $p2_score) $winner_id = $matchData['player1_id'];
                elseif ($p2_score > $p1_score) $winner_id = $matchData['player2_id'];
                // Tie = NULL
                
                // Update my score, set winner, mark completed
                $conn->query("UPDATE matches SET $my_score_col = $score, winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");

                // Update Global Leaderboard (Wins)
                if ($winner_id !== "NULL") {
                    $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$winner_id', '$game_id', 1) 
                                  ON DUPLICATE KEY UPDATE highscore = highscore + 1");
                }
            }
            
            echo json_encode(['status' => 'success']);
            exit();
        }

        // 2. HANDLE GAME OVER (Win or Loss)
        if ($type === 'win' || $type === 'loss') {
            // Determine who won based on the report
            // If I sent 'win' (score 1), I win. If I sent 'loss' (score -1), Opponent wins.
            
            $winner_id = "NULL";
            
            if ($user_id == $matchData['player1_id']) {
                // I am P1. 
                if ($score == 1) $winner_id = $matchData['player1_id']; // I win
                else $winner_id = $matchData['player2_id']; // I lost, so P2 wins
                
                // Update my score
                $conn->query("UPDATE matches SET player1_score = $score WHERE id = '$match_id'");
            } 
            else {
                // I am P2.
                if ($score == 1) $winner_id = $matchData['player2_id']; // I win
                else $winner_id = $matchData['player1_id']; // I lost, so P1 wins
                
                // Update my score
                $conn->query("UPDATE matches SET player2_score = $score WHERE id = '$match_id'");
            }

            // CLOSE THE MATCH
            $conn->query("UPDATE matches SET winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");

            // UPDATE LEADERBOARD
            if ($winner_id !== "NULL") {
                $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$winner_id', '$game_id', 1) 
                              ON DUPLICATE KEY UPDATE highscore = highscore + 1");
            }
            
            echo json_encode(['status' => 'success']);
            exit();
        }
    }

    // Fallback for non-match scores
    echo json_encode(['status' => 'success']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>