<?php
session_start();
include 'db_connection.php';

if (!isset($_SESSION['user_id']) || $_SERVER["REQUEST_METHOD"] != "POST") {
    header("Location: ../Login/login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'];

// --- 1. UPDATE INFO (Username/Email) ---
if ($action === 'update_info') {
    $username = $conn->real_escape_string($_POST['username']);
    $email = $conn->real_escape_string($_POST['email']);

    // Check for duplicates (excluding self)
    $check = $conn->query("SELECT id FROM users WHERE (username = '$username' OR email = '$email') AND id != '$user_id'");
    
    if ($check->num_rows > 0) {
        header("Location: ../settings.php?err=Username or Email already taken");
        exit();
    }

    $sql = "UPDATE users SET username = '$username', email = '$email' WHERE id = '$user_id'";
    
    if ($conn->query($sql)) {
        $_SESSION['username'] = $username; // Update session
        header("Location: ../settings.php?msg=Profile updated successfully");
    } else {
        header("Location: ../settings.php?err=Database error");
    }
}

// --- 2. CHANGE PASSWORD ---
elseif ($action === 'change_password') {
    $current = $_POST['current_password'];
    $new = $_POST['new_password'];
    $confirm = $_POST['confirm_password'];

    if ($new !== $confirm) {
        header("Location: ../settings.php?err=New passwords do not match");
        exit();
    }

    // Verify Old Password
    $result = $conn->query("SELECT password_hash FROM users WHERE id = '$user_id'");
    $user = $result->fetch_assoc();

    if (password_verify($current, $user['password_hash'])) {
        $new_hash = password_hash($new, PASSWORD_DEFAULT);
        $conn->query("UPDATE users SET password_hash = '$new_hash' WHERE id = '$user_id'");
        header("Location: ../settings.php?msg=Password changed successfully");
    } else {
        header("Location: ../settings.php?err=Current password is incorrect");
    }
}

// --- 3. DELETE ACCOUNT ---
elseif ($action === 'delete_account') {
    // We must manually delete related data first to avoid Foreign Key errors
    
    // 1. Delete Leaderboard entries
    $conn->query("DELETE FROM leaderboard WHERE user_id = '$user_id'");
    
    // 2. Delete Matches where user is Player 1 (Cannot set to NULL due to schema)
    $conn->query("DELETE FROM matches WHERE player1_id = '$user_id'");
    
    // 3. Update Matches where user is Player 2 (Set to NULL or Delete?)
    // Since player2_id is nullable, we can set it to NULL to preserve P1's history
    $conn->query("UPDATE matches SET player2_id = NULL WHERE player2_id = '$user_id'");

    // 4. Finally, Delete User
    if ($conn->query("DELETE FROM users WHERE id = '$user_id'")) {
        session_destroy();
        header("Location: ../Login/login.php?msg=Account deleted");
    } else {
        header("Location: ../settings.php?err=Could not delete account");
    }
}
?>