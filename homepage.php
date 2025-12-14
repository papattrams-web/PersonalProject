<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geekerz - Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <img src="./Images/gremlin.png" alt="Gremlin" class="gremlin-logo">
            <span class="logo-text">GEEKERZ</span>
        </div>
        
        <div class="user-menu">
            <span>Welcome, Player1</span>
            <button class="btn-logout">Logout</button>
        </div>
    </nav>

    <div class="hero">
        <h1>Game Library</h1>
        <p>Select a game to start playing</p>
    </div>

    <div class="container">
        <div class="games-grid">
            <div class="game-card card-2048">
                <div class="card-image">2048</div>
                <div class="card-content">
                    <h3>2048</h3>
                    <p>Join the numbers and get to the 2048 tile!</p>
                    <a href="./2048/2048.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-pacman">
                <div class="card-image"><i class="fas fa-ghost"></i></div>
                <div class="card-content">
                    <h3>PacMan</h3>
                    <p>Eat the dots, avoid the ghosts. Retro classic.</p>
                    <a href="./PacMan/PacMan.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-sudoku">
                <div class="card-image"><i class="fas fa-border-all"></i></div>
                <div class="card-content">
                    <h3>Sudoku</h3>
                    <p>Fill the grid with logic. Zen mode enabled.</p>
                    <a href="./Sudoku/sudoku.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-memory">
                <div class="card-image"><i class="fas fa-layer-group"></i></div>
                <div class="card-content">
                    <h3>Memory</h3>
                    <p>Test your brain power. Match the cards.</p>
                    <a href="./Memory Card/MemCard.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-8ball">
                <div class="card-image"><i class="fas fa-dot-circle"></i></div>
                <div class="card-content">
                    <h3>8 Ball Pool</h3>
                    <p>Pot the balls and beat the table.</p>
                    <a href="./8ball/8ball.html" class="btn-play">Play Now</a>
                </div>
            </div>

            <div class="game-card card-tictac">
                <div class="card-image"><i class="fas fa-times"></i></div>
                <div class="card-content">
                    <h3>Tic Tac Toe</h3>
                    <p>The classic X and O game. Can you win?</p>
                    <a href="./TicTacToe/TicTacToe.html" class="btn-play">Play Now</a>
                </div>
            </div>

        </div>
    </div>

</body>
</html>