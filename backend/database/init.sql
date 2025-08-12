- Section9 TeamC データベース初期化スクリプト
-- 子供向け英語学習チャレンジアプリのデータベーススキーマを作成します

-- データベースとユーザーの作成（Docker環境変数で処理）
-- CREATE DATABASE bud_db;
-- CREATE USER bud_user WITH PASSWORD 'bud_password';
-- GRANT ALL PRIVILEGES ON DATABASE bud_db TO bud_user;

-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル（親）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- メールアドレスの高速検索用インデックス
CREATE INDEX idx_users_email ON users(email);

-- 子供テーブル
CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    birthdate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 親子関係の高速検索用インデックス
CREATE INDEX idx_children_user_id ON children(user_id);

-- チャレンジテーブル（音声認識記録）
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    transcript TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 子供ごとのチャレンジ検索用インデックス
CREATE INDEX idx_challenges_child_id ON challenges(child_id);
-- 時系列検索用インデックス
CREATE INDEX idx_challenges_created_at ON challenges(created_at);

-- updated_at列を自動更新するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;

$$ language 'plpgsql';

-- ユーザーテーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 子供テーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_children_updated_at 
    BEFORE UPDATE ON children 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Firebase認証対応とテーブル構造の改善
-- ユーザーテーブルにGoogle ID追加
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- データ整合性のための制約を追加
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_name_length 
    CHECK (LENGTH(TRIM(name)) >= 1);

ALTER TABLE children ADD CONSTRAINT check_name_length 
    CHECK (LENGTH(TRIM(name)) >= 1);

-- 開発・テスト用のサンプルデータを挿入
INSERT INTO users (email, name) VALUES 
    ('parent1@example.com', '田中太郎'),
    ('parent2@example.com', '佐藤花子');

INSERT INTO children (user_id, name, nickname, birthdate) VALUES 
    (1, '田中ゆうと', 'ゆうくん', '2016-04-15'),  -- 2025年時点で8-9歳
    (1, '田中あかり', 'あかりちゃん', '2018-08-20'),  -- 2025年時点で6-7歳
    (2, '佐藤そら', 'そらちゃん', '2014-12-10');  -- 2025年時点で10-11歳

INSERT INTO challenges (child_id, transcript, comment) VALUES 
    (1, 'Hello!', 'とても上手に挨拶できたね！😊 発音がきれいだよ！'),
    (1, 'My name is Yuto.', '完璧な自己紹介だったよ！👏 はっきりと話せてすごいね！'),
    (1, 'I like apples.', 'すばらしい！「I like apples」って上手に言えたね！🍎 りんごは美味しいよね！'),
    (1, 'Thank you very much.', 'とても丁寧にありがとうが言えたね！✨ 礼儀正しくて素晴らしいよ！'),
    (2, 'Good morning!', '元気な朝の挨拶だったね！🌅 笑顔が伝わってくるよ！'),
    (2, 'How are you?', '上手に質問できたね！💬 会話が上達してるよ！'),
    (3, 'I am fine.', 'パーフェクトな答えだったよ！😄 とても上手になったね！'),
    (3, 'See you later!', '素敵なお別れの挨拶だね！👋 たくさんの英語フレーズを覚えたね！');

-- アプリケーションユーザーに権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bud_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bud_user;