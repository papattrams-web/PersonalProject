<?php
session_start();
include 'db_connection.php';

if (isset($_GET['action']) && isset($_GET['id'])) {
    $match_id = intval($_GET['id']);
    $action = $_GET['action'];

    if ($action == 'accept') {
        // 1. Update Match Status to Active
        $sql = "UPDATE matches SET status = 'active' WHERE id = '$match_id'";
        $conn->query($sql);

        // 2. Redirect to the correct game file
        $game_slug = $_GET['game'];
        $url = "";

        // Map slugs to file paths
        switch ($game_slug) {
            case '2048': $url = "../2048/2048.html"; break;
            case 'pacman': $url = "../PacMan/PacMan.php"; break;
            case 'sudoku': $url = "../Sudoku/sudoku.php"; break;
            case 'memory': $url = "../Memory Card/MemCard.php"; break; // Check folder name spaces
            case '8ball': $url = "../8ball/8ball.php"; break;
            case 'tictactoe': $url = "../TicTacShow/TicTacShow.php"; break;
            case 'war': $url = "../Cards/cards.html"; break;
            default: $url = "../homepage.php";
        }

        // Attach match_id to URL so the game knows this is a ranked match
        header("Location: " . $url . "?match_id=" . $match_id);

    } elseif ($action == 'decline') {
        // Delete the match request
        $sql = "DELETE FROM matches WHERE id = '$match_id'";
        $conn->query($sql);
        header("Location: ../homepage.php?msg=declined");
    }
}
?>