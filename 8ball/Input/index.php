<?php
session_start();

// Go up TWO levels (../../)
$login_path = "../../Login/login.php";
$home_path = "../../homepage.php";

if (isset($_SESSION['user_id'])) {
    header("Location: " . $home_path);
} else {
    header("Location: " . $login_path);
}
exit();
?>