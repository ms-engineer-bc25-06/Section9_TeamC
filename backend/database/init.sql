-- Section9 TeamC Database Initialization Script
-- This script creates the database schema for the child challenge tracking application

-- Create database and user (handled by Docker environment variables)
-- CREATE DATABASE bud_db;
-- CREATE USER bud_user WITH PASSWORD 'bud_password';
-- GRANT ALL PRIVILEGES ON DATABASE bud_db TO bud_user;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Children table
CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    grade VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster parent-child lookups
CREATE INDEX idx_children_user_id ON children(user_id);

-- Challenges table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    transcript TEXT,
    comment TEXT,
    audio_duration INTEGER, -- duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on child_id for faster challenge lookups per child
CREATE INDEX idx_challenges_child_id ON challenges(child_id);
-- Create index on created_at for chronological queries
CREATE INDEX idx_challenges_created_at ON challenges(created_at);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some constraints for data integrity
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_name_length 
    CHECK (LENGTH(TRIM(name)) >= 1);

ALTER TABLE children ADD CONSTRAINT check_name_length 
    CHECK (LENGTH(TRIM(name)) >= 1);

ALTER TABLE challenges ADD CONSTRAINT check_audio_duration_positive 
    CHECK (audio_duration IS NULL OR audio_duration >= 0);

-- Insert sample data for development/testing
INSERT INTO users (email, name) VALUES 
    ('parent1@example.com', '田中太郎'),
    ('parent2@example.com', '佐藤花子');

INSERT INTO children (user_id, name, nickname, grade) VALUES 
    (1, '田中一郎', 'いちろう', '小学3年'),
    (1, '田中二郎', 'じろう', '小学1年'),
    (2, '佐藤三郎', 'さぶろう', '小学5年');

INSERT INTO challenges (child_id, transcript, comment, audio_duration) VALUES 
    (1, '今日は算数の宿題を頑張りました。九九を全部覚えました。', '素晴らしい頑張りでした！', 30),
    (1, '友達と一緒に公園で遊びました。楽しかったです。', '友達と仲良く遊べてよかったね', 25),
    (2, 'ひらがなの練習をしました。「あ」から「ん」まで書けました。', '上手に書けるようになったね！', 20),
    (3, '理科の実験をしました。水が氷になる実験です。', '実験の観察がよくできていました', 35);

-- Grant permissions to the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bud_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bud_user;