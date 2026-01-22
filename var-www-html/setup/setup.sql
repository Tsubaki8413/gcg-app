/* setup.sql - データベースとテーブルの作成（要件定義書v2準拠） */

-- データベース作成（存在しない場合）
CREATE DATABASE IF NOT EXISTS gcg_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gcg_app;

-- 1. cards テーブル（カード情報）
CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(50) PRIMARY KEY COMMENT 'カード型番 (通常:ST01-001, パラレル:ST01-001_P)',
    name VARCHAR(255) NOT NULL COMMENT 'カード名',
    rarity VARCHAR(50),
    expansion_set VARCHAR(50),
    level INT DEFAULT 0,
    cost INT DEFAULT 0,
    color VARCHAR(50),
    type VARCHAR(50) COMMENT 'UNIT/PILOT/BASE/COMMAND/TOKEN',
    text TEXT COMMENT '効果テキスト(部分一致検索対象)',
    zone VARCHAR(50) COMMENT '地形適性',
    traits TEXT COMMENT '特徴(部分一致検索対象)',
    link TEXT COMMENT 'リンク/搭乗条件(要件定義書に合わせてカラム名変更)',
    ap VARCHAR(10) DEFAULT '0',
    hp VARCHAR(10) DEFAULT '0',
    image_url VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 検索・ソート高速化のためのインデックス
    INDEX idx_name (name),
    INDEX idx_color (color),
    INDEX idx_cost (cost),
    INDEX idx_type (type),
    INDEX idx_expansion (expansion_set), -- 追加
    INDEX idx_level (level),           -- 追加
    INDEX idx_ap (ap),                 -- 追加
    INDEX idx_hp (hp),                 -- 追加
    INDEX idx_zone (zone)              -- 追加
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. decks テーブル（デッキ情報）
CREATE TABLE IF NOT EXISTS decks (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID',
    user_id VARCHAR(50) NOT NULL DEFAULT '1' COMMENT '個人利用のため固定',
    title VARCHAR(255) NOT NULL DEFAULT '新規デッキ',
    cards JSON COMMENT '構成データ {"ST01-001": 4, "ST01-001_P": 1}',
    thumbnail_id VARCHAR(50) COMMENT 'サムネイル画像のカードID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
