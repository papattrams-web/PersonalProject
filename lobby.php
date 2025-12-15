<?php
session_start();
include 'includes/db_connection.php';

// Check if logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: Login/login.php");
    exit();
}

$current_user_id = $_SESSION['user_id'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geekerz - Challenge Lobby</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .lobby-container {
            max-width: 600px;
            margin: 50px auto;
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
        }
        .search-box {
            width: 100%;
            padding: 15px;
            border-radius: 10px;
            border: none;
            margin-bottom: 20px;
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 1.1rem;
        }
        .user-list {
            list-style: none;
            padding: 0;
            text-align: left;
        }
        .user-item {
            background: rgba(255,255,255,0.1);
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .challenge-btn {
            background: var(--accent-color);
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            font-size: 0.9rem;
        }
        .game-select {
            padding: 5px;
            border-radius: 5px;
            background: #333;
            color: white;
            border: 1px solid #555;
            margin-right: 10px;
        }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <span class="logo-text">GEEKERZ</span>
        </div>
        <div class="user-menu">
            <a href="homepage.php" class="btn-logout" style="text-decoration:none;">Back to Dashboard</a>
        </div>
    </nav>

    <div class="hero">
        <h1>Challenge Lobby</h1>
        <p>Find a rival and start a match</p>
    </div>

    <div class="lobby-container">
        <input type="text" id="user-search" class="search-box" placeholder="Search for a username..." onkeyup="searchUsers()">
        
        <ul id="results-area" class="user-list">
            </ul>
    </div>

    <script>
        function searchUsers() {
            let query = document.getElementById('user-search').value;
            if(query.length < 2) {
                document.getElementById('results-area').innerHTML = '';
                return;
            }

            // AJAX call to find users
            fetch('includes/search_users.php?q=' + query)
                .then(res => res.json())
                .then(data => {
                    let html = '';
                    if(data.length > 0) {
                        data.forEach(user => {
                            html += `
                                <li class="user-item">
                                    <span>${user.username}</span>
                                    <form action="includes/create_challenge.php" method="POST" style="display:flex; align-items:center;">
                                        <input type="hidden" name="opponent_id" value="${user.id}">
                                        
                                        <select name="game_slug" class="game-select">
                                            <option value="2048">2048</option>
                                            <option value="pacman">PacMan</option>
                                            <option value="sudoku">Sudoku</option>
                                            <option value="8ball">8 Ball</option>
                                            <option value="tictactoe">TicTacToe</option>
                                            <option value="war">War</option>
                                        </select>

                                        <button type="submit" class="challenge-btn">Challenge</button>
                                    </form>
                                </li>
                            `;
                        });
                    } else {
                        html = '<p style="color:#aaa;">No users found.</p>';
                    }
                    document.getElementById('results-area').innerHTML = html;
                });
        }
    </script>

</body>
</html>