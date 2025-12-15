<?php
session_start();
include '../includes/db_connection.php'; // Adjusted path if file is in 'includes'

$query = isset($_GET['q']) ? $conn->real_escape_string($_GET['q']) : '';
$current_user = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;

$users = [];

if ($query) {
    // Select ID, Username, and calculate Status
    // If last_activity is within 5 minutes, they are 'online'
    $sql = "SELECT id, username, 
            CASE 
                WHEN last_activity > (NOW() - INTERVAL 5 MINUTE) THEN 'online'
                ELSE 'offline'
            END as status
            FROM users 
            WHERE username LIKE '%$query%' 
            AND id != '$current_user' 
            LIMIT 5";
            
    $result = $conn->query($sql);
    
    if($result) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }
}

echo json_encode($users);
?>