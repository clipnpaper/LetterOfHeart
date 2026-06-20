# 마음의 편지함: 데이터베이스 스키마 설계

이 문서는 "마음의 편지함" 서비스의 제품 요구사항 정의서(PRD)를 기반으로 설계된 데이터베이스 스키마를 설명합니다. 사용자, 게시글, 시즌, 추천, 관리자 답변 등의 핵심 요소들을 효율적으로 관리하기 위한 테이블 구조와 필드 정의를 포함합니다.

## 1. 테이블 정의

### 1.1. `users` - 사용자 정보
사용자의 고유 식별자(UUID), 익명 닉네임, 권한 등을 관리합니다.

```sql
CREATE TABLE users (
    user_uuid UUID PRIMARY KEY,
    nickname VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    status ENUM('active', 'banned') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

-   **`user_uuid`**: 사용자를 식별하는 고유한 UUID (Universally Unique Identifier)입니다. 브라우저의 `LocalStorage` 또는 `Cookie`에 저장될 식별자와 매핑됩니다.
-   **`nickname`**: 시스템이 자동으로 생성하는 익명 닉네임입니다. 중복될 수 없습니다.
-   **`role`**: 사용자의 역할을 정의합니다 (`user` 또는 `admin`). 기본값은 `user`입니다.
-   **`status`**: 사용자의 계정 상태를 나타냅니다 (`active` 또는 `banned`). 기본값은 `active`입니다.
-   **`created_at`**: 사용자 계정이 생성된 시각입니다.

### 1.2. `seasons` - 주차(시즌) 정보
"주차별 운영" 규칙에 따라 각 시즌의 정보를 관리합니다.

```sql
CREATE TABLE seasons (
    season_id INT PRIMARY KEY AUTO_INCREMENT,
    season_number INT UNIQUE NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

-   **`season_id`**: 각 시즌의 고유 식별자입니다.
-   **`season_number`**: '1주차', '2주차'와 같은 시즌 번호입니다. 중복될 수 없습니다.
-   **`start_date`**: 해당 시즌이 시작되는 날짜와 시간입니다.
-   **`end_date`**: 해당 시즌이 종료되는 날짜와 시간입니다.
-   **`created_at`**: 시즌 정보가 생성된 시각입니다.

### 1.3. `posts` - 게시글 정보
사용자가 작성하는 편지(게시글)의 데이터를 저장합니다.

```sql
CREATE TABLE posts (
    post_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    author_uuid UUID NOT NULL,
    season_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_uuid) REFERENCES users