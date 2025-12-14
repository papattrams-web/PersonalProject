<?php
session_start()

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Geekerz - Home</title>
</head>
<body>
    <div>

        <form action="" method="post">
            <input type="text" name="fName" id="fName" placeholder="First Name: " required>
            <input type="text" name="sName" id="sName" placeholder="Surame: " required>
            <input type="text" name="username" id="username" placeholder="Username" required minlength="3" maxlength="15">
            <input type="email" name="email" id="email" placeholder="Email: " required>
            <input type="password" name="pasword" id="pasword" placeholder="Password: " required minlength="8">
            <input type="password" name="cPasword" id="cPasword" placeholder="Confirm Password: " required minlength="8">
            <button>Sign Up</button>
        </form>

    </div>
</body>