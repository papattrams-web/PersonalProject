<?php
session_start();
include '../includes/db_connection.php';

$error_msg = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $input_user = $conn->real_escape_string($_POST['username']); 
    $password = $_POST['pasword']; 

    $sql = "SELECT id, username, password_hash FROM users WHERE username = '$input_user' OR email = '$input_user'";
    $result = $conn->query($sql);

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        
        if (password_verify($password, $row['password_hash'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            
            // Redirect to homepage
            header("Location: ../homepage.php"); 
            exit();
        } else {
            $error_msg = "Invalid password.";
        }
    } else {
        $error_msg = "No account found.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Login</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body class="auth-body">
    <div class="auth-container">
        <img src="../Images/gremlin.png" alt="Gremlin Playing Games" class="gremlin-logo">
        
        <h2>Welcome Back</h2>
        
        <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">

            <?php if($error_msg): ?>
                <div style="color: red; margin-bottom: 10px;"><?php echo $error_msg; ?></div>
            <?php endif; ?>

            <div class="form-group">
                <input type="text" name="username" id="username" placeholder="Username or Email" required>
            </div>
            <div class="form-group">
                <input type="password" name="pasword" id="pasword" placeholder="Password" required>
            </div>
            <button type="submit" class="btn-primary">Login</button>
        </form>
        
        <div class="auth-link">
            Don't have an account? <a href="../SignUp/signup.php">Sign up</a>
        </div>
    </div>
</body>
</html>