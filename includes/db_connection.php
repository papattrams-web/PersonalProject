<?php
$servername = "localhost";
$username = "root";      
$password = "";          
$dbname = "geekerz_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// AUTOMATIC ACTIVITY TRACKER
// If a session exists, update the user's last_activity time
if (isset($_SESSION['user_id'])) {
    $uid = $_SESSION['user_id'];
    $conn->query("UPDATE users SET last_activity = NOW() WHERE id = '$uid'");
}
?>