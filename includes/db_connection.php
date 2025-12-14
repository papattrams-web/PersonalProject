<?php
$servername = "localhost";
$username = "root";      // Default for XAMPP/MAMP
$password = "";          // Default is empty or "root" for MAMP
$dbname = "geekerz_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>