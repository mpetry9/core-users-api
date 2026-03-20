# Authentication Setup Guide

This guide explains how to set up and use the dual authentication system (JWT + API Keys) for the core-users-api.

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Database Migration](#database-migration)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Testing the API](#testing-the-api)
6. [Usage with React Frontend](#usage-with-react-frontend)

## Setup Instructions

### 1. Install Dependencies

All dependencies have been installed. Verify with:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

**Important:** Update the following in your `.env` file:

```env
# Generate a secure JWT secret (minimum 32 characters)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update with your actual database URL
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Update CORS origins when you deploy your React frontend
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Run Database Migration

Apply the authentication migration to your PostgreSQL database:

```bash
# Using psql command
psql $DATABASE_URL -f migrations/001_add_authentication.sql

# Or if you need to specify connection details separately
psql -h hostname -U username -d database -f migrations/001_add_authentication.sql
```

This migration adds:

- `password_hash` column to `users` table
- `api_keys` table for storing API keys
- Necessary indexes for performance

### 4. Start the Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or the PORT you specified).

## Database Migration

### What the Migration Does

The migration script (`migrations/001_add_authentication.sql`) performs the following changes:

1. **Adds password_hash column** to users table (nullable for existing users)
2. **Creates api_keys table** with columns:
   - `id` - Primary key
   - `user_id` - Foreign key to users table
   - `key_hash` - SHA-256 hash of the API key
   - `name` - User-friendly name for the key
   - `created_at`, `last_used_at`, `expires_at` - Timestamps
   - `is_active` - Boolean flag for soft deletion

3. **Creates indexes** for better query performance

### Rollback

If you need to rollback the migration:

```bash
psql $DATABASE_URL -f migrations/001_add_authentication_rollback.sql
```

## Environment Configuration

### Required Variables

| Variable                  | Description                                      | Example                                       |
| ------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `JWT_SECRET`              | Secret key for signing JWT tokens (min 32 chars) | `your-secret-key-here`                        |
| `JWT_ACCESS_EXPIRES_IN`   | Access token expiration                          | `1h`                                          |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token expiration                         | `7d`                                          |
| `BCRYPT_ROUNDS`           | Number of bcrypt hashing rounds                  | `10`                                          |
| `API_KEY_PREFIX`          | Prefix for generated API keys                    | `sk_live_`                                    |
| `CORS_ORIGINS`            | Comma-separated list of allowed origins          | `http://localhost:3000,http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window in milliseconds                | `900000` (15 minutes)                         |
| `RATE_LIMIT_MAX_REQUESTS` | Max login attempts per window                    | `5`                                           |

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint  | Description                   |
| ------ | --------- | ----------------------------- |
| GET    | `/`       | Welcome message               |
| GET    | `/health` | Health check with client info |

### Authentication Endpoints

| Method | Endpoint        | Description             | Rate Limited |
| ------ | --------------- | ----------------------- | ------------ |
| POST   | `/auth/signup`  | Create new user account | Yes          |
| POST   | `/auth/login`   | Login and get tokens    | Yes          |
| POST   | `/auth/refresh` | Refresh access token    | Yes          |
| GET    | `/auth/me`      | Get current user info   | No           |

### Protected User Endpoints (Requires Authentication)

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| GET    | `/api/users`     | Get paginated list of users |
| GET    | `/api/users/:id` | Get specific user by ID     |

### API Key Management Endpoints (Requires Authentication)

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| POST   | `/api/keys`     | Create new API key (JWT only) |
| GET    | `/api/keys`     | List all user's API keys      |
| GET    | `/api/keys/:id` | Get specific API key details  |
| DELETE | `/api/keys/:id` | Revoke an API key             |

## Testing the API

### 1. Signup (Create Account)

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Get Current User (with JWT)

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Access Protected Users Endpoint (with JWT)

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create an API Key (JWT required)

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key",
    "expiresInDays": 90
  }'
```

**Response:**

```json
{
  "id": 1,
  "userId": 1,
  "name": "My API Key",
  "key": "sk_live_aBcD1234XyZ...",
  "keyPreview": "sk_live_aBcD...",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "lastUsedAt": null,
  "expiresAt": "2026-06-18T10:00:00.000Z",
  "isActive": true,
  "message": "API key created successfully. Save it securely - it will not be shown again."
}
```

**⚠️ Important:** Save the `key` value! It will only be shown once.

### 6. Access Protected Endpoint with API Key

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: ApiKey sk_live_aBcD1234XyZ..."
```

### 7. List API Keys

```bash
curl http://localhost:3000/api/keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Revoke an API Key

```bash
curl -X DELETE http://localhost:3000/api/keys/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 9. Refresh Access Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Usage with React Frontend

### 1. Installation

Install axios or your preferred HTTP client:

```bash
npm install axios
```

### 2. Create an Auth Service

```typescript
// services/authService.ts
import axios from "axios";

const API_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const authService = {
  async signup(name: string, email: string, password: string) {
    const { data } = await api.post("/auth/signup", { name, email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  async getCurrentUser() {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

export const usersService = {
  async getUsers(page = 1, limit = 10) {
    const { data } = await api.get("/api/users", { params: { page, limit } });
    return data;
  },

  async getUserById(id: number) {
    const { data } = await api.get(`/api/users/${id}`);
    return data;
  },
};

export default api;
```

### 3. Usage in Components

```typescript
// Login component example
import { useState } from 'react';
import { authService } from './services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await authService.login(email, password);
      console.log('Logged in:', data.user);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Security Best Practices

### For Production

1. **JWT Secret**
   - Use a strong, random secret (minimum 32 characters)
   - Never commit secrets to version control
   - Rotate secrets periodically

2. **HTTPS**
   - Always use HTTPS in production
   - Never send tokens over HTTP

3. **Token Storage**
   - Store access tokens in memory or httpOnly cookies
   - Avoid localStorage for sensitive tokens (XSS vulnerability)
   - Consider using secure, httpOnly cookies with SameSite=Strict

4. **API Keys**
   - Treat API keys like passwords
   - Never expose them in client-side code
   - Rotate keys regularly
   - Set expiration dates

5. **Rate Limiting**
   - Configure appropriate rate limits
   - Consider using Redis for distributed rate limiting

6. **Database**
   - Use SSL connections to database
   - Keep database credentials secure
   - Regular backups

## Troubleshooting

### "Invalid token" errors

- Check if JWT_SECRET matches between requests
- Verify token hasn't expired
- Ensure Authorization header format is correct: `Bearer <token>`

### CORS errors

- Update CORS_ORIGINS in .env
- Ensure frontend origin is included
- Check that credentials are enabled

### Database connection issues

- Verify DATABASE_URL is correct
- Check database is running and accessible
- Ensure SSL mode is configured correctly

### Rate limiting issues

- Wait for the rate limit window to pass
- Adjust RATE_LIMIT_MAX_REQUESTS if needed
- Consider implementing account lockout policies

## Support

For issues or questions, refer to:

- API source code in `src/` directory
- Migration files in `migrations/` directory
- Environment configuration in `.env.example`
