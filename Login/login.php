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
        
        <form action="" method="post">
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