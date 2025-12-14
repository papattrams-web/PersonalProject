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
        
        <form action="" method="post">
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
</body>
</html>