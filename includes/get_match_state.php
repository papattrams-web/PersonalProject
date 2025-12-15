<?php
include 'db_connection.php';
header('Content-Type: application/json');

$match_id = intval($_GET['match_id']);
$sql = "SELECT board_state FROM matches WHERE id = '$match_id'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo json_encode($result->fetch_assoc());
} else {
    echo json_encode([]);
}
?>