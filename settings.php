<?php
session_start();
include 'includes/db_connection.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$msg = isset($_GET['msg']) ? $_GET['msg'] : '';
$err = isset($_GET['err']) ? $_GET['err'] : '';

// Fetch current user data
$sql = "SELECT username, email FROM users WHERE id = '$user_id'";
$result = $conn->query($sql);
$user = $result->fetch_assoc();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geekerz - Settings</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .settings-container {
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
        }
        .section-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 30px;
        }
        h2 { color: var(--accent-color); margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .alert { padding: 10px; border-radius: 5px; margin-bottom: 15px; font-weight: bold; }
        .success { background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid #2ecc71; }
        .error { background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c; }
        .btn-danger { background: #e74c3c; color: white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; }
        .btn-danger:hover { background: #c0392b; }
        label { display: block; margin-bottom: 5px; color: #ccc; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <span class="logo-text">GEEKERZ</span>
        </div>
        <div class="user-menu">
            <a href="homepage.php" class="btn-logout" style="text-decoration:none;">Dashboard</a>
            <a href="logout.php" class="btn-logout" style="text-decoration:none;">Logout</a>
        </div>
    </nav>

    <div class="settings-container">
        <h1 style="text-align:center; margin-bottom:30px;">Account Settings</h1>

        <?php if($msg): ?>
            <div class="alert success"><?php echo htmlspecialchars($msg); ?></div>
        <?php endif; ?>
        <?php if($err): ?>
            <div class="alert error"><?php echo htmlspecialchars($err); ?></div>
        <?php endif; ?>

        <div class="section-card">
            <h2>Profile Information</h2>
            <form action="includes/update_profile.php" method="POST">
                <input type="hidden" name="action" value="update_info">
                
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" name="username" value="<?php echo htmlspecialchars($user['username']); ?>" required>
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" required>
                </div>

                <button type="submit" class="btn-primary" style="width:auto;">Save Changes</button>
            </form>
        </div>

        <div class="section-card">
            <h2>Change Password</h2>
            <form action="includes/update_profile.php" method="POST">
                <input type="hidden" name="action" value="change_password">
                
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" name="current_password" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" name="new_password" required>
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" name="confirm_password" required>
                    </div>
                </div>

                <button type="submit" class="btn-primary" style="width:auto;">Update Password</button>
            </form>
        </div>

        <div class="section-card" style="border-color: #e74c3c;">
            <h2 style="color: #e74c3c; border-color: #e74c3c;">Danger Zone</h2>
            <p style="color: #aaa; margin-bottom: 20px;">Once you delete your account, there is no going back. All your match history and leaderboard scores will be permanently removed.</p>
            
            <form action="includes/update_profile.php" method="POST" onsubmit="return confirm('Are you strictly sure? This cannot be undone.');">
                <input type="hidden" name="action" value="delete_account">
                <button type="submit" class="btn-danger">Delete My Account</button>
            </form>
        </div>
    </div>

</body>
</html>