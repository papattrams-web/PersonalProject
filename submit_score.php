<?php
// submit_score.php - FINAL VERSION
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
    $type = isset($data['type']) ? $data['type'] : 'score'; 
    $match_id = isset($data['match_id']) ? intval($data['match_id']) : null;
    $score = isset($data['score']) ? intval($data['score']) : 0;

    $gRes = $conn->query("SELECT id FROM games WHERE game_slug = '$game_slug'");
    if (!$gRes || $gRes->num_rows == 0) throw new Exception("Game not found.");
    $game_id = $gRes->fetch_assoc()['id'];

    $response = ['status' => 'success'];
    $match_completed_now = false;

    if ($match_id) {
        $mRes = $conn->query("SELECT * FROM matches WHERE id = '$match_id'");
        if (!$mRes || $mRes->num_rows == 0) throw new Exception("Match not found.");
        $matchData = $mRes->fetch_assoc();

        // 1. HIGH SCORE GAMES (2048, PacMan, Sudoku)
        if ($type === 'score') {
            $is_p1 = ($user_id == $matchData['player1_id']);
            $my_score_col = $is_p1 ? "player1_score" : "player2_score";

            // If opponent hasn't played yet (Status is active/pending)
            if ($matchData['status'] == 'active' || $matchData['status'] == 'pending') {
                $newStatus = $is_p1 ? 'waiting_p2' : 'waiting_p1';
                $conn->query("UPDATE matches SET $my_score_col = $score, status = '$newStatus' WHERE id = '$match_id'");
                
                // Even if match isn't done, update MY highscore on leaderboard
                $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$user_id', '$game_id', '$score') ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$score')");
            } 
            // Opponent already played (Status is waiting_p1 or waiting_p2)
            else {
                $p1_score = $is_p1 ? $score : $matchData['player1_score'];
                $p2_score = $is_p1 ? $matchData['player2_score'] : $score;
                
                $winner_id = "NULL";
                if ($p1_score > $p2_score) $winner_id = $matchData['player1_id'];
                elseif ($p2_score > $p1_score) $winner_id = $matchData['player2_id'];
                
                $conn->query("UPDATE matches SET $my_score_col = $score, winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");
                $match_completed_now = true;

                // Update leaderboard for ME (Since I just finished)
                $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$user_id', '$game_id', '$score') ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$score')");
                
                // Force update opponent too (just in case)
                $opp_id = $is_p1 ? $matchData['player2_id'] : $matchData['player1_id'];
                $opp_score = $is_p1 ? $p2_score : $p1_score;
                if($opp_id) {
                    $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$opp_id', '$game_id', '$opp_score') ON DUPLICATE KEY UPDATE highscore = GREATEST(highscore, '$opp_score')");
                }
            }
        }
        // 2. WIN/LOSS GAMES (8 Ball, War)
        else if ($type === 'win' || $type === 'loss') {
            $winner_id = "NULL";
            // Logic: If I send 'win', I am winner. If I send 'loss', opponent is winner.
            if ($type === 'win') $winner_id = $user_id;
            else $winner_id = ($user_id == $matchData['player1_id']) ? $matchData['player2_id'] : $matchData['player1_id'];

            // Update scores (1 for winner, 0 for loser)
            $p1_s = ($winner_id == $matchData['player1_id']) ? 1 : 0;
            $p2_s = ($winner_id == $matchData['player2_id']) ? 1 : 0;

            $conn->query("UPDATE matches SET player1_score = $p1_s, player2_score = $p2_s, winner_id = $winner_id, status = 'completed' WHERE id = '$match_id'");
            $match_completed_now = true;

            // Only winner gets leaderboard point
            if ($winner_id !== "NULL") {
                $conn->query("INSERT INTO leaderboard (user_id, game_id, highscore) VALUES ('$winner_id', '$game_id', 1) ON DUPLICATE KEY UPDATE highscore = highscore + 1");
            }
        }
        // 3. TURN UPDATES (Tic Tac Show / 8 Ball State)
        else if ($type === 'turn_update') {
            $board_state = $conn->real_escape_string($data['board_state']);
            $newStatus = ($user_id == $matchData['player1_id']) ? 'waiting_p2' : 'waiting_p1';
            $conn->query("UPDATE matches SET board_state = '$board_state', status = '$newStatus' WHERE id = '$match_id'");
        }

        // --- TOURNAMENT ADVANCEMENT ---
        if ($match_completed_now && !empty($matchData['tournament_id'])) {
            $trn_id = $matchData['tournament_id'];
            $round = $matchData['round'];
            $response['tournament_id'] = $trn_id;

            $pending = $conn->query("SELECT count(*) as c FROM matches WHERE tournament_id = '$trn_id' AND round = '$round' AND status != 'completed'");
            if ($pending->fetch_assoc()['c'] == 0) {
                // Generate next round
                $winnersSql = "SELECT winner_id FROM matches WHERE tournament_id = '$trn_id' AND round = '$round' ORDER BY id ASC";
                $wRes = $conn->query($winnersSql);
                $winners = [];
                while($row = $wRes->fetch_assoc()) if ($row['winner_id']) $winners[] = $row['winner_id'];

                if (count($winners) == 1) {
                    $conn->query("UPDATE tournaments SET status = 'completed' WHERE id = '$trn_id'");
                } elseif (count($winners) > 1) {
                    $next_round = $round + 1;
                    $gId = $matchData['game_id'];
                    for ($i = 0; $i < count($winners); $i += 2) {
                        if (isset($winners[$i+1])) {
                            $conn->query("INSERT INTO matches (tournament_id, game_id, round, player1_id, player2_id, status) VALUES ('$trn_id', '$gId', '$next_round', '{$winners[$i]}', '{$winners[$i+1]}', 'pending')");
                        }
                    }
                }
            }
        } 
        elseif (!empty($matchData['tournament_id'])) {
             $response['tournament_id'] = $matchData['tournament_id'];
        }
    }
    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>