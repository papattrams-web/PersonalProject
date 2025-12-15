<?php
session_start();

// Define paths relative to a 1-level deep folder
$login_path = "../Login/login.php";
$home_path = "../homepage.php";

if (isset($_SESSION['user_id'])) {
    // Session exists? Go to Dashboard
    header("Location: " . $home_path);
} else {
    // No session? Go to Login
    header("Location: " . $login_path);
}
exit();
?>

