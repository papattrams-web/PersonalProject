<?php
session_start();
include 'db_connection.php';

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_SESSION['user_id'])) {
    $player1 = $_SESSION['user_id'];
    $player2 = intval($_POST['opponent_id']);
    $game_slug = $conn->real_escape_string($_POST['game_slug']);

    // 1. Get Game ID
    $gameQuery = "SELECT id FROM games WHERE game_slug = '$game_slug'";
    $result = $conn->query($gameQuery);
    
    if ($result->num_rows > 0) {
        $game = $result->fetch_assoc();
        $game_id = $game['id'];

        // 2. Create Match (Status: Pending)
        // We insert Player 1 as the challenger
        $sql = "INSERT INTO matches (game_id, player1_id, player2_id, status) 
                VALUES ('$game_id', '$player1', '$player2', 'pending')";

        if ($conn->query($sql) === TRUE) {
            // Success: Go back to lobby with a message
            header("Location: ../history_page.php?msg=Challenge sent successfully!");
        } else {
            echo "Error: " . $conn->error;
        }
    } else {
        echo "Game not found.";
    }
}
?>