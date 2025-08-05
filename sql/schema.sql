-- Portfolio Management App Database Schema
-- Run this script in MySQL Workbench to create the database structure

CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- Users tab
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- User settings table
CREATE TABLE user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dark_mode BOOLEAN DEFAULT FALSE,
    notifications BOOLEAN DEFAULT TRUE,
    currency VARCHAR(10) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
);

-- Holdings table
CREATE TABLE holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    buy_price DECIMAL(15,4) NOT NULL,
    current_price DECIMAL(15,4),
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_symbol (user_id, symbol),
    INDEX idx_symbol (symbol)
);

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    transaction_type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    total_amount DECIMAL(15,4) NOT NULL,
    fees DECIMAL(10,4) DEFAULT 0,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_symbol (symbol)
);

-- Watchlist table
CREATE TABLE watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255),
    added_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_symbol (symbol)
);

-- Stock prices table (for caching real-time prices)
CREATE TABLE stock_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    change_percent DECIMAL(8,4),
    volume BIGINT,
    market_cap BIGINT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_symbol (symbol),
    INDEX idx_symbol (symbol),
    INDEX idx_last_updated (last_updated)
);

-- Sessions table (optional, for database session storage)
CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data TEXT,
    INDEX idx_expires (expires)
);

-- Insert some sample data (optional)
INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, address) VALUES
('john.doe@example.com', '$2y$10$oji3jh.bWWu02zmONNrW/ubwdTEzvNilkrPtJg6.o4YieRztjjnfO', 'John', 'Doe', '+1-555-0123', '1990-05-15', '123 Investment Street, Finance City, FC 12345'),
('jane.smith@example.com', '$2y$10$oji3jh.bWWu02zmONNrW/ubwdTEzvNilkrPtJg6.o4YieRztjjnfO', 'Jane', 'Smith', '+1-555-0456', '1985-09-22', '456 Portfolio Avenue, Wealth City, WC 67890');

-- Insert user settings
INSERT INTO user_settings (user_id, dark_mode, notifications, currency, language) VALUES
(1, FALSE, TRUE, 'USD', 'en'),
(2, TRUE, FALSE, 'USD', 'en');

-- Insert sample holdings
INSERT INTO holdings (user_id, symbol, company_name, quantity, buy_price, current_price, purchase_date) VALUES
(1, 'AAPL', 'Apple Inc.', 50.0000, 150.25, 175.80, '2023-03-15'),
(1, 'GOOGL', 'Alphabet Inc.', 25.0000, 2450.75, 2680.30, '2023-02-10'),
(1, 'MSFT', 'Microsoft Corporation', 40.0000, 285.60, 312.45, '2023-01-20'),
(1, 'TSLA', 'Tesla Inc.', 15.0000, 220.80, 195.25, '2023-04-05'),
(1, 'AMZN', 'Amazon.com Inc.', 35.0000, 3180.50, 3385.20, '2023-03-08');

-- Insert sample transactions
INSERT INTO transactions (user_id, symbol, transaction_type, quantity, price, total_amount, fees, transaction_date) VALUES
(1, 'AAPL', 'BUY', 50.0000, 150.25, 7512.50, 9.99, '2023-03-15'),
(1, 'GOOGL', 'BUY', 25.0000, 2450.75, 61268.75, 15.99, '2023-02-10'),
(1, 'MSFT', 'BUY', 40.0000, 285.60, 11424.00, 12.99, '2023-01-20'),
(1, 'TSLA', 'BUY', 15.0000, 220.80, 3312.00, 8.99, '2023-04-05'),
(1, 'AMZN', 'BUY', 35.0000, 3180.50, 111317.50, 18.99, '2023-03-08'),
(1, 'AAPL', 'SELL', 10.0000, 172.30, 1723.00, 7.99, '2023-05-12');

-- Insert sample watchlist
INSERT INTO watchlist (user_id, symbol, company_name, added_date) VALUES
(1, 'NVDA', 'NVIDIA Corporation', '2023-05-01'),
(1, 'META', 'Meta Platforms Inc.', '2023-04-28'),
(1, 'NFLX', 'Netflix Inc.', '2023-05-10'),
(1, 'AMD', 'Advanced Micro Devices Inc.', '2023-05-05');

-- Insert sample stock prices
INSERT INTO stock_prices (symbol, price, change_percent, volume, market_cap) VALUES
('AAPL', 175.80, 2.15, 45000000, 2800000000000),
('GOOGL', 2680.30, -0.85, 1200000, 1700000000000),
('MSFT', 312.45, 1.32, 25000000, 2300000000000),
('TSLA', 195.25, -3.45, 35000000, 620000000000),
('AMZN', 3385.20, 0.75, 3000000, 1400000000000),
('NVDA', 485.20, 2.45, 20000000, 1200000000000),
('META', 298.75, -1.23, 15000000, 800000000000),
('NFLX', 425.60, 0.87, 8000000, 190000000000),
('AMD', 102.85, 3.21, 30000000, 165000000000);