<?php
session_start();
include '../includes/db_connection.php'; // Adjusted path for your structure

$error_msg = "";
$success_msg = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Grab data using the 'name' attributes from your HTML
    $fName = $conn->real_escape_string($_POST['fName']);
    $sName = $conn->real_escape_string($_POST['sName']);
    $username = $conn->real_escape_string($_POST['username']);
    $email = $conn->real_escape_string($_POST['email']);
    $password = $_POST['pasword']; // Note: Keeping your spelling 'pasword'
    $cPassword = $_POST['cPasword'];

    // 2. Basic Validation
    if ($password !== $cPassword) {
        $error_msg = "Passwords do not match!";
    } else {
        // 3. Check for existing user
        $checkQuery = "SELECT id FROM users WHERE email = '$email' OR username = '$username'";
        $result = $conn->query($checkQuery);

        if ($result->num_rows > 0) {
            $error_msg = "Username or Email already exists.";
        } else {
            // 4. Hash Password & Insert
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            // Ensure your DB has columns: first_name, last_name, username, email, password_hash
            $sql = "INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES ('$fName', '$sName', '$username', '$email', '$hashed_password')";

            if ($conn->query($sql) === TRUE) {
                $_SESSION['user_id'] = $conn->insert_id;
                $_SESSION['username'] = $username;
                // Redirect to homepage after success
                header("Location: ../Login/login.php"); 
                exit();
            } else {
                $error_msg = "Error: " . $conn->error;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Sign Up</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body class="auth-body">
    <div class="auth-container">
        <img src="../Images/gremlin.png" alt="Gremlin Playing Games" class="gremlin-logo">
        
        <h2>Join Geekerz</h2>
        
        <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">

            <?php if($error_msg): ?>
                <div style="color: red; margin-bottom: 10px;"><?php echo $error_msg; ?></div>
            <?php endif; ?>


            <div class="form-row">
                <div class="form-group">
                    <input type="text" name="fName" id="fName" placeholder="First Name" required>
                </div>
                <div class="form-group">
                    <input type="text" name="sName" id="sName" placeholder="Surname" required>
                </div>
            </div>

            <div class="form-group">
                <input type="text" name="username" id="username" placeholder="Username (3-15 chars)" required minlength="3" maxlength="15">
            </div>
            <div class="form-group">
                <input type="email" name="email" id="email" placeholder="Email Address" required>
            </div>
            <div class="form-group">
                <input type="password" name="pasword" id="pasword" placeholder="Password (Min 8 chars)" required minlength="8">
            </div>
            <div class="form-group">
                <input type="password" name="cPasword" id="cPasword" placeholder="Confirm Password" required minlength="8">
            </div>
            <button type="submit" class="btn-primary">Sign Up</button>
        </form>
        
        <div class="auth-link">
            Already have an account? <a href="../Login/login.php">Login here</a>
        </div>
    </div>

    <script src="signup.js"></script>
</body>
</html>