# Core Users API

A RESTful API built with Node.js, Express, TypeScript, and PostgreSQL (Neon) following best practices and SOLID principles.

## Features

- ✅ User management with pagination
- ✅ **Dual Authentication System (JWT + API Keys)**
- ✅ **Secure password hashing with bcrypt**
- ✅ **Rate limiting for authentication endpoints**
- ✅ **CORS and security headers (Helmet)**
- ✅ PostgreSQL database with Neon (serverless)
- ✅ TypeScript for type safety
- ✅ MVC architecture (Models, Controllers, Routes)
- ✅ Centralized error handling
- ✅ Request validation middleware
- ✅ Database connection pooling
- ✅ Environment-based configuration
- ✅ DRY principle with reusable utilities

## 🔐 Authentication

This API supports **dual authentication**:

- **JWT (JSON Web Tokens)** - For web/mobile applications (recommended for React frontend)
- **API Keys** - For direct API access, testing, and documentation

**📖 Full Authentication Guide:** See [AUTHENTICATION.md](AUTHENTICATION.md) for:

- Setup instructions
- Database migration guide
- API endpoint documentation
- Testing examples
- React integration guide
- Security best practices

## Project Structure

```
src/
├── config/
│   ├── auth.ts              # Authentication configuration
│   └── database.ts          # Database connection configuration
├── controllers/
│   ├── apiKeys.controller.ts # API key CRUD operations
│   ├── auth.controller.ts   # Authentication endpoints
│   └── users.controller.ts  # User business logic
├── middleware/
│   ├── auth.middleware.ts   # JWT + API Key authentication
│   ├── errorHandler.ts      # Global error handling
│   └── validators/
│       ├── apiKey.validator.ts      # API key validation
│       ├── auth.validator.ts        # Auth input validation
│       └── pagination.validator.ts  # Query parameter validation
├── models/
│   ├── apiKey.model.ts      # API key data access layer
│   └── user.model.ts        # User data access layer
├── routes/
│   ├── apiKeys.routes.ts    # API key routes
│   ├── auth.routes.ts       # Authentication routes
│   └── users.routes.ts      # User routes definition
├── types/
│   ├── auth.types.ts        # Authentication interfaces
│   ├── pagination.types.ts  # Pagination interfaces
│   └── user.types.ts        # User interfaces
├── utils/
│   ├── auth.util.ts         # JWT, password, and API key utilities
│   └── pagination.util.ts   # Pagination helper functions
├── app.ts                   # Express app configuration
└── index.ts                 # Application entry point

migrations/
├── 001_add_authentication.sql            # Authentication schema migration
├── 001_add_authentication_rollback.sql  # Rollback migration
└── README.md                             # Migration documentation
```

## Database Schema

**Users Table:**

- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `email` - VARCHAR(255) UNIQUE NOT NULL (indexed)
- `password_hash` - VARCHAR(255) NULL (bcrypt hashed password)
- `status` - VARCHAR(50) DEFAULT 'active'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (indexed)
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**API Keys Table:**

- `id` - SERIAL PRIMARY KEY
- `user_id` - INTEGER NOT NULL (foreign key to users)
- `key_hash` - VARCHAR(255) UNIQUE NOT NULL (SHA-256 hashed API key)
- `name` - VARCHAR(100) NOT NULL (user-friendly identifier)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `last_used_at` - TIMESTAMP NULL (tracks usage)
- `expires_at` - TIMESTAMP NULL (optional expiration)
- `is_active` - BOOLEAN DEFAULT true (soft delete flag)

## API Endpoints

### 🔓 Public Endpoints

#### Health Check

```http
GET /health
```

Returns server status and client information (IP, country, browser, OS, language).

### 🔐 Authentication Endpoints

#### Signup

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 🔒 Protected Endpoints (Requires Authentication)

Use either JWT or API Key authentication:

- **JWT:** `Authorization: Bearer YOUR_ACCESS_TOKEN`
- **API Key:** `Authorization: ApiKey sk_live_...`

#### Get Users (Paginated)

```http
GET /api/users?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Results per page (default: 10, min: 1, max: 100)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john.smith@example.com",
      "status": "active",
      "created_at": "2026-03-20T17:07:34.014Z",
      "updated_at": "2026-03-20T17:07:34.014Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 30,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get User by ID

```http
GET /api/users/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john.smith@example.com",
    "status": "active",
    "created_at": "2026-03-20T17:07:34.014Z",
    "updated_at": "2026-03-20T17:07:34.014Z"
  }
}
```

### 🔑 API Key Management

#### Create API Key (JWT Required)

```http
POST /api/keys
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "My API Key",
  "expiresInDays": 90
}
```

Returns the API key **only once**. Save it securely!

#### List API Keys

```http
GET /api/keys
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Revoke API Key

```http
DELETE /api/keys/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**📖 For complete endpoint documentation and examples, see [AUTHENTICATION.md](AUTHENTICATION.md)**

## Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd core-users-api
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration:
# - Add your Neon database connection string
# - Generate a secure JWT_SECRET (min 32 characters)
# - Configure CORS origins for your React frontend
```

4. **✅ Database Setup (Already Complete)**

The database tables have been created with the correct schema. No migration needed!

5. **Seed users (Optional but recommended):**

```bash
# Edit scripts/seed-users.ts to add your test users
# Then run:
npm run seed
```

This will create test users with hashed passwords that you can use for testing.

6. **Run the development server:**

```bash
npm run dev
```

7. **Test the authentication system:**

```bash
# Make the test script executable (if needed)
chmod +x test-auth.sh

# Run the test script
./test-auth.sh
```

8. **Build for production:**

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

## Testing

Run the test script to verify all endpoints:

```bash
bash test-api.sh
```

## Technology Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js 5
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Neon)
- **Database Client:** node-postgres (pg)
- **Authentication:** jsonwebtoken, bcrypt
- **Security:** helmet, cors, express-rate-limit
- **Development:** ts-node, nodemon

## Best Practices Implemented

### 1. **MVC Architecture**

- Separation of concerns with distinct layers
- Models handle data access
- Controllers handle business logic
- Routes define endpoints

### 2. **DRY Principle**

- Reusable pagination utilities
- Centralized error handling
- Shared type definitions
- Single source of truth for database configuration

### 3. **Type Safety**

- TypeScript interfaces for all data structures
- Strict type checking enabled
- Typed request/response objects

### 4. **Error Handling**

- Centralized error handler middleware
- Consistent error response format
- Database error normalization
- Environment-aware error details

### 5. **Database Design**

- Indexed columns for performance
- Connection pooling
- Singleton pattern for database instance
- Prepared statements for security

### 6. **Code Organization**

- Feature-based folder structure
- Single responsibility principle
- Dependency injection
- Interface segregation

### 7. **Performance**

- Database connection pooling (max 20 connections)
- Indexed queries for pagination
- Efficient count and data queries in parallel
- Limited page size (max 100 items)

## Database Information

**Neon Project:** core-users-api

- **Project ID:** misty-dawn-58416880
- **Branch:** main
- **Database:** neondb
- **Test Data:** 30 fake users pre-populated

## License

ISC
