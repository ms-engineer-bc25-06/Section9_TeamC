# データベース設計書

---

## 1. 概要

BUD アプリケーションのデータベース設計をまとめたものです。  
各テーブルの構造、制約、インデックス、補足事項を記載しています。

---

## 2. ER 図

[ER 図 （draw.io ファイル）](./diagrams/database-er.drawio)

---

## 3. テーブル定義

### 3.1 users（親ユーザー）

| カラム名   | 型           | 制約             | 説明                         |
| ---------- | ------------ | ---------------- | ---------------------------- |
| id         | UUID         | PRIMARY KEY      | ユーザー ID                  |
| google_id  | VARCHAR(255) | UNIQUE, NOT NULL | Google 連携用 ID             |
| created_at | TIMESTAMP    | DEFAULT now()    | 登録日時                     |
| updated_at | TIMESTAMP    | DEFAULT now()    | 更新日時（更新時に明示更新） |

---

### 3.2 children（子ども情報）

| カラム名   | 型          | 制約                              | 説明                         |
| ---------- | ----------- | --------------------------------- | ---------------------------- |
| id         | UUID        | PRIMARY KEY                       | 子ども ID                    |
| user_id    | UUID        | FOREIGN KEY → users(id), NOT NULL | 親ユーザー ID                |
| name       | VARCHAR(50) | NOT NULL                          | 子どもの名前                 |
| birthdate  | DATE        | NOT NULL                          | 誕生日（年齢計算用）         |
| created_at | TIMESTAMP   | DEFAULT now()                     | 登録日時                     |
| updated_at | TIMESTAMP   | DEFAULT now()                     | 更新日時（更新時に明示更新） |

---

### 3.3 challenges（チャレンジ記録）

| カラム名          | 型        | 制約                                 | 説明               |
| ----------------- | --------- | ------------------------------------ | ------------------ |
| id                | UUID      | PRIMARY KEY                          | チャレンジ記録 ID  |
| child_id          | UUID      | FOREIGN KEY → children(id), NOT NULL | 対象の子ども       |
| transcription     | TEXT      | NOT NULL                             | 文字起こし結果     |
| ai_review_content | TEXT      |                                      | AI レビュー内容    |
| created_at        | TIMESTAMP | DEFAULT now()                        | チャレンジ実施日時 |

---

## 4. インデックス・制約

- `users.google_id` に UNIQUE 制約
- `users.email` に UNIQUE 制約（ログイン用）
- `children.user_id` に FOREIGN KEY 制約（CASCADE DELETE）
- `challenges.child_id` に FOREIGN KEY 制約（CASCADE DELETE）
- UUID を主キーとして全テーブル共通採用
- パフォーマンス用インデックス：
  - `children.user_id`
  - `challenges.child_id`
  - `challenges.created_at`

---

## 5. 補足・注意点

- 録音データは DB に保存せず、クライアント側で処理。DB には文字起こし結果（transcription）のみ保存
- 親ユーザー 1 人に複数の子どもを登録可能（1:N）
- 子どもごとにチャレンジ履歴を管理（1:N）
- `birthdate` から年齢はクエリやアプリ側で動的に算出する設計
- チャレンジ記録には**AI レビュー内容（ai_review_content）**も保存可能

---
