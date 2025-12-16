<?php
// Determine if we are on localhost or live server
// Change 'localhost' to your live server IP if needed, but usually this works
if ($_SERVER['SERVER_NAME'] == 'localhost' || $_SERVER['SERVER_NAME'] == '127.0.0.1') {
    // LOCAL CREDENTIALS (XAMPP/WAMP)
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "geekerz_db";
} else {
    // LIVE SERVER CREDENTIALS (You get these from your hosting panel)
    $servername = "localhost"; // Often remains 'localhost' on shared hosting
    $username = "u123456_geekerz"; // Example format provided by host
    $password = "StrongPassword123!"; // You create this in cPanel
    $dbname = "u123456_geekerz_db";
}

$conn = new mysqli($servername, $username, $password, $dbname);

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