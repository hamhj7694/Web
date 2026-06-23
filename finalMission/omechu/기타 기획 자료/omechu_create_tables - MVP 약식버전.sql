-- 회원 정보

CREATE TABLE omechu_users (
    no INT AUTO_INCREMENT PRIMARY KEY,

    login_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL UNIQUE,

    status ENUM('active', 'blocked', 'deleted') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 음식 메인 정보 + 추천 수 + 태그 JSON.
CREATE TABLE omechu_wiki_foods (
    no INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,

    image_url VARCHAR(255),
    description TEXT,
    summary TEXT,

    tags_json JSON,
    situations_json JSON,
    times_json JSON,

    likes_json JSON,

    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    photo_count INT DEFAULT 0,

    created_by INT NULL,

    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_food_name_category (normalized_name, category)
);

-- 댓글/코멘트
CREATE TABLE omechu_wiki_comments (
    no INT AUTO_INCREMENT PRIMARY KEY,

    food_no INT NOT NULL,
    user_no INT NOT NULL,

    content TEXT NOT NULL,
    meal_time VARCHAR(20),

    tags_json JSON,
    replies_json JSON,

    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 사진
CREATE TABLE omechu_wiki_food_photos (
    no INT AUTO_INCREMENT PRIMARY KEY,

    food_no INT NOT NULL,
    user_no INT NOT NULL,

    image_url VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),

    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);