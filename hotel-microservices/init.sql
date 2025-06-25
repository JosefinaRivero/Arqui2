CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id VARCHAR(50) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    amadeus_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS hotel_mapping (
    internal_id VARCHAR(50) PRIMARY KEY,
    amadeus_id VARCHAR(100) NOT NULL
);

-- Insert admin user
INSERT IGNORE INTO users (username, email, password, is_admin) 
VALUES ('admin', 'admin@hotel.com', MD5('admin123'), TRUE);

-- Insert sample hotel mappings
INSERT IGNORE INTO hotel_mapping (internal_id, amadeus_id) VALUES 
('1', 'YXPARKPR'),
('2', 'MCLONGHM'),
('3', 'ADPARADT');