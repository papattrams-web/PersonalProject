<?php
// submit_score.php - FINAL ROBUST VERSION (High Score Logic Applied)
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    session_start();
    require_once __DIR__ . '/includes/db_connection.php';

    if (!isset($_SESSION['user_id'])) throw new Exception("User not logged in.");
    $user_id = $_SESSION['user_id'];
    
    // 1. Get Input
    $json_input = file_get_contents('php://input');
    $data = json_decode($json_input, true);
    if (!$data) throw new Exception("Invalid JSON.");

    $game_slug = $conn->real_escape_string($data['game']);
    $type = isset($data['type']) ? $data['type'] : 'score'; 
    $match_id = isset($data['match_id']) ? intval($data['match_id']) : null;
    $score = isset($data['score']) ? intval($data['score']) : 0;

    // 2. Get Game ID
    $gRes = $conn->query("SELECT id FROM games WHERE game_slug = '$game_slug'");
    if (!$gRes || $gRes->num_rows == 0) throw new Exception("Game not found.");
    $game_id = $gRes->fetch_assoc()['id'];

    // 3. MATCH LOGIC
    if ($match_id) {
        $mRes = $conn->query("SELECT * FROM matches WHERE id = '$match_id'");
        if (!$mRes || $mRes->num_rows == 0) throw new Exception("Match not found.");
        $matchData = $mRes->fetch_assoc();

        // --- A. TURN BASED (Tic Tac Show / 8 Ball Updates) ---
        if ($type === 'turn_update') {
            $board_state = $conn->real_escape_string($data['board_state']);
            // Toggle Turn
            $newStatus = ($user_id == $matchData['player1_id']) ? 'waiting_p2' : 'waiting_p1';
            
            $conn->query("UPDATE matches SET board_state = '$board_state', status = '$newStatus' WHERE id = '$match_id'");
            echo json_encode(['status' => 'success']);
            exit(); 
        }

        // --- B. SCORE BASED (Sudoku / PacMan / 2048) ---
        if ($type === 'score') {
            // 1. Handle Board State (For Sudoku P1 -> P2 fairness)
            $extra_sql = "";
            if (isset($data['board_state'])) {
                $b_state = $conn->real_escape_string($data['board_state']);
                $extra_sql = ", board_state = '$b_state'";
            }

            $is_p1 = ($user_id == $matchData['player1_id']);
            $my_score_col = $is_p1 ? "player1_score" : "player2_score";

            // LOGIC: Are we the FIRST or SECOND to finish?
            // If status is 'active' or 'pending', we are FIRST.
            if ($matchData['status'] == 'active' || $matchData['status'] == 'pending') {
                $newStatus = $is_p1 ? 'waiting_p2' : 'waiting_p1';
                
                $conn->query("UPDATE matches SET $my_score_col = $score, status = '$newStatus' $extra_sql WHERE id = '$match_id'");
            } 
            // If status is 'waiting_...', the OTHER player already finished. We are SECOND.
            else {
                // Get opponent's score from DB
                $p1_score = $is_p1 ? $score : $matchData['player1_score'];
                $p2_score = $is_p1 ? $matchData['player2_score'] : $score;
                
                // Determine Winner
                $winner_id = "NULL"; // Default to Draw
                if ($p1_score > $p2_score) $winner_id = $matchData['player1_id'];
                elseif ($p2_score > $p1_score) $winner_id = $matchData['player2_id'];
                
                // Update Match: Mark Completed
                $conn->query("UPDATE matches SET $my_score_col = $score, winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");

                // Update Leaderboard (Highest Score Logic)
                if ($winner_id !== "NULL") {
                    // Determine the numeric score of the winner
                    $w_score = ($winner_id == $matchData['player1_id']) ? $p1_score : $p2_score;

                    // Insert, or update ONLY if new score is higher than old highscore
                    $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) 
                                  VALUES ('$winner_id', '$game_id', '$w_score') 
                                  ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$w_score')");
                }
            }
            
            echo json_encode(['status' => 'success']);
            exit();
        }

        // --- C. WIN/LOSS BASED (8 Ball / Tic Tac Show End Game) ---
        // Keeps "Total Wins" logic for these games
        if ($type === 'win' || $type === 'loss') {
            // If I sent 'win' (score 1), I win. If 'loss' (score -1), Opponent wins.
            $winner_id = "NULL";
            
            if ($user_id == $matchData['player1_id']) {
                $winner_id = ($score == 1) ? $matchData['player1_id'] : $matchData['player2_id'];
                $conn->query("UPDATE matches SET player1_score = $score WHERE id = '$match_id'");
            } else {
                $winner_id = ($score == 1) ? $matchData['player2_id'] : $matchData['player1_id'];
                $conn->query("UPDATE matches SET player2_score = $score WHERE id = '$match_id'");
            }

            $conn->query("UPDATE matches SET winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");

            if ($winner_id !== "NULL") {
                $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$winner_id', '$game_id', 1) 
                              ON DUPLICATE KEY UPDATE highscore = highscore + 1");
            }
            
            echo json_encode(['status' => 'success']);
            exit();
        }
    }

// ... [Inside submit_score.php, after the query updates are done] ...

    // --- TOURNAMENT ADVANCEMENT LOGIC ---
    if ($match_id) {
        // 1. Get Tournament Details
        $tCheck = $conn->query("SELECT tournament_id, round FROM matches WHERE id = '$match_id'");
        $tData = $tCheck->fetch_assoc();

        if ($tData && $tData['tournament_id']) {
            $trn_id = $tData['tournament_id'];
            $round = $tData['round'];

            // 2. Check if ALL matches in this round are completed
            $pending = $conn->query("SELECT count(*) as c FROM matches WHERE tournament_id = '$trn_id' AND round = '$round' AND status != 'completed'");
            $count = $pending->fetch_assoc()['c'];

            if ($count == 0) {
                // ROUND COMPLETE! GENERATE NEXT ROUND.
                
                // Get all winners from this round
                // We order by ID to keep the bracket structure (Match 1 winner plays Match 2 winner)
                $winnersSql = "SELECT winner_id FROM matches WHERE tournament_id = '$trn_id' AND round = '$round' ORDER BY id ASC";
                $wRes = $conn->query($winnersSql);
                
                $winners = [];
                while($row = $wRes->fetch_assoc()) {
                    if ($row['winner_id']) $winners[] = $row['winner_id'];
                }

                // If only 1 winner remains, Tournament is Over
                if (count($winners) == 1) {
                    $conn->query("UPDATE tournaments SET status = 'completed' WHERE id = '$trn_id'");
                } 
                elseif (count($winners) > 1) {
                    // Create Next Round Matches (Pair them up)
                    $next_round = $round + 1;
                    
                    // Get Game ID again
                    $gIdRes = $conn->query("SELECT game_id FROM tournaments WHERE id = '$trn_id'");
                    $gId = $gIdRes->fetch_assoc()['game_id'];

                    for ($i = 0; $i < count($winners); $i += 2) {
                        if (isset($winners[$i+1])) {
                            $p1 = $winners[$i];
                            $p2 = $winners[$i+1];
                            // Status is 'active' immediately for next round (or 'pending' if you want)
                            // 'pending' usually safer for turn-based 
                            $conn->query("INSERT INTO matches (tournament_id, game_id, round, player1_id, player2_id, status) 
                                          VALUES ('$trn_id', '$gId', '$next_round', '$p1', '$p2', 'pending')");
                        }
                    }
                }
            }
        }
    }
    // ... [End of Insert] ...


    // Fallback
    echo json_encode(['status' => 'success']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>