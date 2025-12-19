CREATE DATABASE IF NOT EXISTS geekerz_db;
USE geekerz_db;

-- 1. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT NULL
);

-- 2. GAMES TABLE
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_slug VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    scoring_type ENUM('score', 'win') NOT NULL
);

-- Seed the games table
INSERT INTO games (game_slug, display_name, scoring_type) VALUES 
('2048', '2048', 'score'),
('pacman', 'PacMan', 'score'),
('sudoku', 'Sudoku', 'score'),
('memory', 'Memory Card', 'score'),
('8ball', '8 Ball Pool', 'win'),
('8ball_hard', '8 Ball Pool (Hard)', 'win'),
('tictactoe', 'Tic Tac Show', 'win'),
('war', 'War', 'win');

-- 3. LEADERBOARD TABLE
CREATE TABLE leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    highscore INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE KEY unique_user_game (user_id, game_id)
);

-- 4. TOURNAMENTS TABLE
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE,
    name VARCHAR(100),
    game_id INT NOT NULL,
    created_by INT NOT NULL,
    status ENUM('open', 'active', 'completed') DEFAULT 'open',
    master_board_state LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Tournament participants
CREATE TABLE tournament_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. MATCHES TABLE
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NULL,
    game_id INT NOT NULL,
    round INT DEFAULT 1,
    player1_id INT NOT NULL,
    player2_id INT NULL,
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    winner_id INT NULL,
    -- UPDATED: Includes waiting status for turn-based games
    status ENUM('pending', 'active', 'completed', 'waiting_p1', 'waiting_p2') DEFAULT 'pending',
    -- UPDATED: LONGTEXT allows for larger game states (Tic Tac Show/8Ball)
    board_state LONGTEXT,
    played_at DATETIME NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);