-- Section9 TeamC データベース初期化スクリプト
-- 子供向け英語学習チャレンジアプリのデータベーススキーマを作成します

-- データベースとユーザーの作成（Docker環境変数で処理）
-- CREATE DATABASE bud_db;
-- CREATE USER bud_user WITH PASSWORD 'bud_password';
-- GRANT ALL PRIVILEGES ON DATABASE bud_db TO bud_user;

-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル（親）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    firebase_uid VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- メールアドレスの高速検索用インデックス
CREATE INDEX idx_users_email ON users(email);

-- 子供テーブル（nameカラム追加）
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(50),
    birthdate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 親子関係の高速検索用インデックス
CREATE INDEX idx_children_user_id ON children(user_id);

-- チャレンジテーブル（音声認識記録）
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
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

-- データ整合性のための制約を追加
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_name_length 
    CHECK (LENGTH(TRIM(name)) >= 1);

-- 開発・テスト用のサンプルデータを挿入
-- UUIDを明示的に指定してリレーションを管理
INSERT INTO users (id, email, name, firebase_uid) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'parent1@example.com', '田中太郎', 'firebase_uid_1'),
    ('550e8400-e29b-41d4-a716-446655440002', 'parent2@example.com', '佐藤花子', 'firebase_uid_2');

INSERT INTO children (id, user_id, nickname, birthdate) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ゆうくん', '2016-04-15'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'あかりちゃん', '2018-08-20'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'そらちゃん', '2014-12-10');

INSERT INTO challenges (child_id, transcript, comment) VALUES 
    -- ゆうくん（低学年）のチャレンジ
    ('660e8400-e29b-41d4-a716-446655440001', 
     'Hello are you lost yes I am lost can you help me where do you want to go um station JR station oh I know this way thank you very much you are welcome bye bye', 
     '困っている外国人を助けることができたね！😊「this way」で道案内もできてすごいよ！'),
    
    ('660e8400-e29b-41d4-a716-446655440001', 
     'Hi what is your name my name is Tom what is your name I am Yuki nice to meet you do you want to play yes let us play soccer I like soccer me too', 
     '外国人のお友達と仲良くなれたね！👏「Let us play」で遊びに誘えて上手だよ！'),
    
    ('660e8400-e29b-41d4-a716-446655440001', 
     'Excuse me where is ice cream shop ice cream shop is over there thank you what flavor do you like I like chocolate chocolate is delicious yes very good', 
     '丁寧に「Excuse me」から始められたね！✨ 好きな味も英語で言えてすばらしい！'),
    
    -- あかりちゃん（低学年）のチャレンジ  
    ('660e8400-e29b-41d4-a716-446655440002', 
     'Hello nice to meet you nice to meet you too where are you from I am from Canada wow Canada is far yes very far do you like Japan yes I love Japan', 
     '初対面の挨拶が上手にできたね！🌟 カナダについて質問もできてすごいよ！'),
    
    ('660e8400-e29b-41d4-a716-446655440002', 
     'Excuse me can you take picture of course say cheese cheese thank you very much you are welcome where are you going we go to temple temple is beautiful yes very beautiful', 
     '写真をお願いするのも英語でできたね！📸「Say cheese」も覚えられて楽しいね！'),
    
    -- そらちゃん（高学年）のチャレンジ
    ('660e8400-e29b-41d4-a716-446655440003', 
     'Excuse me how can I go to Tokyo Station you need to take JR line which platform platform number three over there how much does it cost about 200 yen thank you for your help you are welcome have a nice trip', 
     '電車の乗り方を詳しく教えてあげられたね！🚃 料金まで英語で説明できてすごい！'),
    
    ('660e8400-e29b-41d4-a716-446655440003', 
     'Hello do you need help yes I am looking for restaurant what kind of food do you like I like Japanese food I know good sushi restaurant really where is it near the station thank you so much', 
     'レストランの案内まで英語でできるなんて！🍣 外国人観光客にとても親切だね！'),
    
    ('660e8400-e29b-41d4-a716-446655440003', 
     'Hi are you enjoying Japan yes Japan is amazing what did you visit today we visited temple and museum how was it very interesting Japanese culture is wonderful I am glad you like it', 
     '日本の文化について英語で話せるようになったね！🏛️ 会話がとても自然で上手だよ！');
     
-- アプリケーションユーザーに権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bud_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bud_user;
