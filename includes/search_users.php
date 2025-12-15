<?php
session_start();
include 'db_connection.php';

$query = isset($_GET['q']) ? $conn->real_escape_string($_GET['q']) : '';
$current_user = $_SESSION['user_id'];

$users = [];

if ($query) {
    // Find users matching the name, BUT exclude yourself
    $sql = "SELECT id, username FROM users 
            WHERE username LIKE '%$query%' 
            AND id != '$current_user' 
            LIMIT 5";
            
    $result = $conn->query($sql);
    
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

echo json_encode($users);
?>