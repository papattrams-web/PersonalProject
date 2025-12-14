CREATE DATABASE IF NOT EXISTS geekerz_db;
USE geekerz_db;

-- 1. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. GAMES TABLE
-- Defines which games exist and if they are Timed or Win-based
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_slug VARCHAR(50) NOT NULL UNIQUE, -- e.g. '2048', '8ball_hard'
    display_name VARCHAR(50) NOT NULL,     -- e.g. '2048', '8 Ball (Hard)'
    scoring_type ENUM('score', 'win') NOT NULL -- 'score' for 2048, 'win' for 8ball
);

-- Seed the games table with your list
INSERT INTO games (game_slug, display_name, scoring_type) VALUES 
('2048', '2048', 'score'),
('pacman', 'PacMan', 'score'),
('sudoku', 'Sudoku', 'score'),
('memory', 'Memory Card', 'score'),
('8ball', '8 Ball Pool', 'win'),
('8ball_hard', '8 Ball Pool (Hard)', 'win'),
('tictactoe', 'Tic Tac Toe', 'win');

-- 3. LEADERBOARD TABLE (Global Stats)
-- Stores the best score (or total wins) for every user in every game
CREATE TABLE leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    highscore INT DEFAULT 0, -- For 8ball, this counts total wins
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE KEY unique_user_game (user_id, game_id) -- Ensures 1 entry per user per game
);

-- 4. TOURNAMENTS TABLE
-- Groups matches together (e.g., "Engineering Class Tournament")
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    game_id INT NOT NULL,
    created_by INT NOT NULL, -- The user who started it
    status ENUM('open', 'active', 'completed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- 5. MATCHES TABLE (The Engine)
-- Handles both single 1v1 challenges AND Tournament brackets
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NULL,      -- NULL if it's just a friendly 1v1
    game_id INT NOT NULL,
    round INT DEFAULT 1,         -- 1=Round of 16, 2=Quarters, etc.
    player1_id INT NOT NULL,
    player2_id INT NULL,         -- NULL if waiting for an opponent
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    winner_id INT NULL,
    status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
    played_at DATETIME NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);