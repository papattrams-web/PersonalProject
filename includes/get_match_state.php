<?php
session_start();
include 'db_connection.php';
header('Content-Type: application/json');

$match_id = intval($_GET['match_id']);
$current_user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;

$sql = "SELECT board_state, player1_id, player2_id, status FROM matches WHERE id = '$match_id'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    // 1. Fetch the data once
    $row = $result->fetch_assoc();
    
    // 2. Modify the data
    $row['current_user_id'] = $current_user_id;
    
    if (empty($row['board_state'])) {
        $row['board_state'] = null;
    }

    // 3. ERROR WAS HERE: Do not call $result->fetch_assoc() again!
    // Send the $row we just prepared.
    echo json_encode($row); 
} else {
    echo json_encode(['error' => 'Match not found']);
}
?>