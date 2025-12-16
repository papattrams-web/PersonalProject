<?php
// Determine if we are on localhost or live server
// Change 'localhost' to your live server IP if needed, but usually this works
// We use 'getenv' to pull secret settings from Railway
$servername = getenv('MYSQLHOST') ?: "localhost"; // Falls back to localhost if not found
$username = getenv('MYSQLUSER') ?: "root";
$password = getenv('MYSQLPASSWORD') ?: "";
$dbname = getenv('MYSQLDATABASE') ?: "geekerz_db";
$port = getenv('MYSQLPORT') ?: 3306;

$conn = new mysqli($servername, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    // On live sites, don't show specific errors to users (Security)
    die("Connection failed."); 
}

// Activity Tracker
if (isset($_SESSION['user_id'])) {
    $uid = $_SESSION['user_id'];
    $conn->query("UPDATE users SET last_activity = NOW() WHERE id = '$uid'");
}
?>