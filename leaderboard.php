<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Leaderboards</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Specific Styles for Leaderboard Table */
        .lb-container {
            max-width: 800px;
            margin: 50px auto;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-selector {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .game-btn {
            background: transparent;
            border: 1px solid var(--accent-color);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            transition: 0.3s;
        }

        .game-btn:hover, .game-btn.active {
            background: var(--accent-color);
            box-shadow: 0 0 15px var(--accent-color);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            color: white;
        }

        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        th {
            color: var(--accent-color);
            text-transform: uppercase;
            font-size: 0.9rem;
        }

        .rank-1 { color: #ffd700; font-weight: bold; text-shadow: 0 0 10px #ffd700; } /* Gold */
        .rank-2 { color: #c0c0c0; font-weight: bold; } /* Silver */
        .rank-3 { color: #cd7f32; font-weight: bold; } /* Bronze */
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <img src="Images/gremlin.png" alt="Gremlin" class="gremlin-logo" style="width:50px;">
            <span class="logo-text">GEEKERZ</span>
        </div>
        <div class="user-menu">
            <a href="homepage.php" class="btn-logout" style="text-decoration:none; margin-right:10px;">Dashboard</a>
            <a href="Login/login.php" class="btn-logout">Logout</a>
        </div>
    </nav>

    <div class="hero">
        <h1>Global Leaderboards</h1>
        <p>See who rules the campus</p>
    </div>

    <div class="lb-container">
        <div class="game-selector">
            <button class="game-btn active" onclick="loadLeaderboard('2048', this)">2048</button>
            <button class="game-btn" onclick="loadLeaderboard('pacman', this)">PacMan</button>
            <button class="game-btn" onclick="loadLeaderboard('sudoku', this)">Sudoku</button>
            <button class="game-btn" onclick="loadLeaderboard('memory', this)">Memory</button>
            <button class="game-btn" onclick="loadLeaderboard('8ball', this)">8 Ball</button>
            <button class="game-btn" onclick="loadLeaderboard('tictactoe', this)">TicTacToe</button>
            <button class="game-btn" onclick="loadLeaderboard('war', this)">War</button>
        </div>

        <table id="lb-table">
            <thead>
                <tr>
                    <th width="10%">Rank</th>
                    <th width="60%">Player</th>
                    <th width="30%" id="score-header">Score</th>
                </tr>
            </thead>
            <tbody id="lb-body">
                </tbody>
        </table>
    </div>

    <script>
        // Load 2048 by default (No button passed, so it won't crash)
        document.addEventListener('DOMContentLoaded', () => loadLeaderboard('2048'));

        function loadLeaderboard(gameSlug, btn) {
            // 1. Update Buttons (Only if a button was clicked)
            if (btn) {
                document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }

            // 2. Fetch Data
            fetch(`includes/get_leaderboard.php?game=${gameSlug}`)
                .then(res => res.json())
                .then(data => {
                    const tbody = document.getElementById('lb-body');
                    const scoreHeader = document.getElementById('score-header');
                    tbody.innerHTML = ''; // Clear old data

                    if(data.status === 'success') {
                        // Update Header based on type (Wins vs Points)
                        scoreHeader.innerText = (data.scoring === 'win') ? 'Total Wins' : 'High Score';

                        // Populate Rows
                        if(data.data.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#aaa;">No scores yet. Be the first!</td></tr>';
                        } else {
                            data.data.forEach(row => {
                                let rankClass = '';
                                if(row.rank === 1) rankClass = 'rank-1';
                                if(row.rank === 2) rankClass = 'rank-2';
                                if(row.rank === 3) rankClass = 'rank-3';

                                let html = `
                                    <tr>
                                        <td class="${rankClass}">#${row.rank}</td>
                                        <td>${row.username}</td>
                                        <td>${row.highscore}</td>
                                    </tr>
                                `;
                                tbody.innerHTML += html;
                            });
                        }
                    } else {
                        tbody.innerHTML = `<tr><td colspan="3">Error loading data.</td></tr>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('lb-body').innerHTML = `<tr><td colspan="3">Connection error.</td></tr>`;
                });
        }
    </script>
</body>
</html>