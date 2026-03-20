# Core Users API

A RESTful API built with Node.js, Express, TypeScript, and PostgreSQL (Neon) following best practices and SOLID principles.

## Features

- ✅ User management with pagination
- ✅ PostgreSQL database with Neon (serverless)
- ✅ TypeScript for type safety
- ✅ MVC architecture (Models, Controllers, Routes)
- ✅ Centralized error handling
- ✅ Request validation middleware
- ✅ Database connection pooling
- ✅ Environment-based configuration
- ✅ DRY principle with reusable utilities

## Project Structure

```
src/
├── config/
│   └── database.ts          # Database connection configuration
├── controllers/
│   └── users.controller.ts  # User business logic
├── middleware/
│   ├── errorHandler.ts      # Global error handling
│   └── validators/
│       └── pagination.validator.ts  # Query parameter validation
├── models/
│   └── user.model.ts        # User data access layer
├── routes/
│   └── users.routes.ts      # User routes definition
├── types/
│   ├── pagination.types.ts  # Pagination interfaces
│   └── user.types.ts        # User interfaces
├── utils/
│   └── pagination.util.ts   # Pagination helper functions
├── app.ts                   # Express app configuration
└── index.ts                 # Application entry point
```

## Database Schema

**Users Table:**

- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `email` - VARCHAR(255) UNIQUE NOT NULL (indexed)
- `status` - VARCHAR(50) DEFAULT 'active'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (indexed)
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## API Endpoints

### Get Users (Paginated)

```http
GET /api/users?page=1&limit=10
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

### Get User by ID

```http
GET /api/users/:id
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

### Health Check

```http
GET /health
```

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
# Edit .env with your Neon database connection string
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Build for production:**

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
