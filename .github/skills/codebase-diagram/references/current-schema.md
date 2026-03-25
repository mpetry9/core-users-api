# Current Database Schema

Reference for the current database tables, columns, and relationships. Update this file when migrations are applied.

**Last updated:** 2026-03-25

## Tables

### users

| Column        | Type         | Constraints               |
| ------------- | ------------ | ------------------------- |
| id            | SERIAL       | PRIMARY KEY               |
| name          | VARCHAR(255) | NOT NULL                  |
| email         | VARCHAR(255) | UNIQUE NOT NULL           |
| password_hash | VARCHAR(255) | NULL                      |
| status        | VARCHAR(50)  | DEFAULT 'active'          |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |
| updated_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** `idx_users_email` (email), `idx_users_created_at` (created_at)

### api_keys

| Column       | Type         | Constraints                               |
| ------------ | ------------ | ----------------------------------------- |
| id           | SERIAL       | PRIMARY KEY                               |
| user_id      | INTEGER      | NOT NULL, FK → users.id ON DELETE CASCADE |
| key_hash     | VARCHAR(255) | UNIQUE NOT NULL                           |
| name         | VARCHAR(100) | NOT NULL                                  |
| created_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                 |
| last_used_at | TIMESTAMP    | NULL                                      |
| expires_at   | TIMESTAMP    | NULL                                      |
| is_active    | BOOLEAN      | DEFAULT true                              |

**Indexes:** `idx_api_keys_user_id` (user_id), `idx_api_keys_key_hash` (key_hash), `idx_api_keys_expires_at` (expires_at)

## Relationships

```
users.id  ──< api_keys.user_id  (one-to-many, CASCADE delete)
```

## Current Route-to-Model Mapping

| Route Group        | Auth Level   | Controller                    | Model       | Table    |
| ------------------ | ------------ | ----------------------------- | ----------- | -------- |
| GET /              | public       | inline                        | —           | —        |
| GET /health        | public       | inline                        | —           | —        |
| POST /auth/signup  | rateLimited  | authController.signup         | UserModel   | users    |
| POST /auth/login   | rateLimited  | authController.login          | UserModel   | users    |
| POST /auth/refresh | rateLimited  | authController.refresh        | —           | —        |
| GET /auth/me       | authenticate | authController.getCurrentUser | —           | —        |
| GET /users         | authenticate | getUsers                      | UserModel   | users    |
| GET /users/:id     | authenticate | getUserById                   | UserModel   | users    |
| POST /keys         | requireJWT   | apiKeysController.create      | ApiKeyModel | api_keys |
| GET /keys          | authenticate | apiKeysController.list        | ApiKeyModel | api_keys |
| GET /keys/:id      | authenticate | apiKeysController.getById     | ApiKeyModel | api_keys |
| DELETE /keys/:id   | authenticate | apiKeysController.revoke      | ApiKeyModel | api_keys |
