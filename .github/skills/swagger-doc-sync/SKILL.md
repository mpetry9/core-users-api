---
name: swagger-doc-sync
description: "Synchronize OpenAPI/Swagger documentation with codebase endpoints. Use when: adding new API endpoints, modifying existing endpoints, updating request/response schemas, changing validators, or when swagger.ts is out of sync with route files. Automatically generates OpenAPI specifications from routes, controllers, validators, and models."
argument-hint: "Optionally specify: 'full sync' (all endpoints), 'check only' (report missing docs), or a specific endpoint like '/api/products' or 'products resource'"
---

# Swagger Documentation Synchronizer

Automatically generate and update OpenAPI/Swagger documentation in `src/config/swagger.ts` by analyzing your codebase. Eliminates manual swagger updates and ensures documentation stays in sync with code.

## When to Use

- After adding new API endpoints (e.g., after using `api-endpoint-scaffolder` agent)
- After modifying existing endpoints (changing parameters, request/response schemas)
- After updating validators or models
- When the user asks to "update swagger", "sync API docs", or "add to swagger"
- When reviewing API documentation completeness
- During code reviews to ensure docs are current

## Core Principles

1. **Code is the source of truth** — Always read actual source files, never assume structure
2. **Infer from patterns** — Generate specs by analyzing routes, validators, types, and models
3. **Preserve manual edits** — Only update missing/changed endpoints, don't overwrite custom descriptions
4. **Follow existing conventions** — Match the style and structure of existing swagger.ts entries
5. **Validate everything** — Ensure TypeScript compiles and OpenAPI spec is valid

## Procedure

### Step 1 — Determine Scope

Ask or infer what needs to be updated:

- **Full sync** (default): Scan all routes and update all missing/changed endpoints
- **Check only**: Report which endpoints are missing from swagger.ts without making changes
- **Specific endpoint**: Update only the specified endpoint (e.g., `/api/products`)
- **Specific resource**: Update all endpoints for a resource (e.g., "products" → `/products`, `/products/:id`)

### Step 2 — Discover All Endpoints

Read and analyze these files to build a complete endpoint inventory:

#### 2.1 Route Files (`src/routes/*.routes.ts`)

For each route file, extract:

- HTTP method (GET, POST, PUT, DELETE, PATCH)
- Path pattern (e.g., `/`, `/:id`)
- Base path from route registration in `src/app.ts` (e.g., `/api/users`)
- Middleware chain (validators, auth middleware)
- Controller function being called

Example route file analysis:

```typescript
// src/routes/users.routes.ts
router.get("/", authenticate, paginationValidator, UsersController.getUsers);
// → GET /api/users with [authenticate, paginationValidator] middleware
```

#### 2.2 Middleware Analysis

For each endpoint, determine:

**Authentication level:**

- No auth middleware → Public endpoint
- `authenticate` → Supports both JWT and API Key (security: `[{ bearerAuth: [] }, { apiKeyAuth: [] }]`)
- `requireJWT` → JWT only (security: `[{ bearerAuth: [] }]`)
- Rate limiter → Note in description

**Validation middleware:**

- Extract parameter types from validator names and files:
  - `paginationValidator` → Query params: `page`, `limit`
  - `idValidator` → Path param: `id` (integer)
  - `createUserValidator` → Request body with required fields
  - Read the actual validator file to extract schema details

#### 2.3 Controller Analysis (`src/controllers/*.controller.ts`)

For each controller function:

- Identify the model methods being called (e.g., `UserModel.findById()`)
- Infer response structure from TypeScript return types
- Note any error responses (try-catch blocks, thrown errors)

#### 2.4 Model Analysis (`src/models/*.model.ts`)

For each model:

- Extract the TypeScript interface or type
- Map to existing schemas in `components.schemas` or create new ones
- Note database table name (for schema generation)

#### 2.5 Type Analysis (`src/types/*.types.ts`)

Read TypeScript interfaces to:

- Generate accurate OpenAPI schemas
- Ensure request/response body schemas match actual types
- Identify enum values and constraints

### Step 3 — Read Current Swagger Configuration

Parse `src/config/swagger.ts`:

1. Extract all existing paths from the `paths` object
2. Extract all existing schemas from `components.schemas`
3. Extract all tags from the `tags` array
4. Note the overall structure and formatting style

### Step 4 — Compare and Identify Changes

For each discovered endpoint:

**If missing from swagger.ts:**

- Mark for generation

**If exists but differs:**

- Compare middleware chains (auth level changed?)
- Compare validator schemas (new parameters?)
- Compare response types (model changed?)
- Mark for update if differences found

**Generate a report:**

```
Missing endpoints:
- GET /api/products
- GET /api/products/:id
- POST /api/products
- DELETE /api/products/:id

Changed endpoints:
- PUT /api/users/:id (added status validator)

Missing schemas:
- Product (referenced by products endpoints)
- ProductCreateRequest
- ProductUpdateRequest

Missing tags:
- Products
```

If scope is "check only", stop here and show the report to the user.

### Step 5 — Generate OpenAPI Specifications

For each missing or changed endpoint, generate the OpenAPI spec following [./references/openapi-patterns.md](./references/openapi-patterns.md).

#### Path Generation

Convert Express route patterns to OpenAPI paths:

```
/:id → /{id}
/:userId/posts/:postId → /{userId}/posts/{postId}
```

#### Parameter Generation

**Path parameters:**

```typescript
// From route: /users/:id
{
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
  description: "User ID"
}
```

**Query parameters:**

```typescript
// From paginationValidator middleware
{
  name: "page",
  in: "query",
  schema: { type: "integer", minimum: 1, default: 1 },
  description: "Page number"
}
```

#### Request Body Generation

Analyze validator middleware to generate request body schema:

```typescript
// From createProductValidator in validators/product.validator.ts
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["name", "price"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 100 },
          price: { type: "number", minimum: 0 },
          description: { type: "string", maxLength: 500 }
        }
      }
    }
  }
}
```

Prefer referencing existing schemas:

```typescript
schema: {
  $ref: "#/components/schemas/ProductCreateRequest";
}
```

#### Response Generation

Generate response schemas based on:

1. Model return types (from TypeScript interfaces)
2. Existing similar endpoints (follow patterns)
3. Standard response wrappers (`{ data: ..., pagination: ... }`)

**GET list endpoint:**

```typescript
"200": {
  description: "Paginated products list",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Product" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      }
    }
  }
}
```

**GET by ID endpoint:**

```typescript
"200": {
  description: "Product found",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Product" }
        }
      }
    }
  }
}
```

**Error responses:**

Always include standard error responses:

- `400` - Validation error or invalid parameters
- `401` - Unauthorized (if auth middleware present)
- `404` - Not found (for GET/PUT/DELETE by ID)
- `409` - Conflict (for POST/PUT with unique constraints)

#### Security Scheme Assignment

Based on middleware:

- `authenticate` → `security: [{ bearerAuth: [] }, { apiKeyAuth: [] }]`
- `requireJWT` → `security: [{ bearerAuth: [] }]`
- API key endpoint (POST /api/keys) → JWT only with note in description
- No auth middleware → No security field (public)

#### Tag Assignment

Assign tags based on resource:

- `/users*` → tag: `Users`
- `/keys*` → tag: `API Keys`
- `/auth/*` → tag: `Auth`
- `/products*` → tag: `Products`

Ensure the tag exists in the `tags` array at the bottom of swagger.ts.

### Step 6 — Generate Missing Schemas

For each missing schema referenced in the generated paths:

#### From TypeScript Interfaces

Read the interface from `src/types/*.types.ts`:

```typescript
// src/types/product.types.ts
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  created_at: Date;
  updated_at: Date;
}

// Generate OpenAPI schema:
Product: {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Widget" },
    description: { type: "string", example: "A useful widget" },
    price: { type: "number", format: "float", example: 29.99 },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" }
  }
}
```

#### From Model Methods

Analyze model method signatures to infer response types:

```typescript
// src/models/product.model.ts
static async findAll(): Promise<Product[]>
static async findById(id: number): Promise<Product | null>
static async create(data: ProductCreateData): Promise<Product>
```

#### For Request Bodies

Generate schemas for create/update requests:

```typescript
ProductCreateRequest: {
  type: "object",
  required: ["name", "price"],
  properties: {
    name: { type: "string", minLength: 3, maxLength: 100 },
    price: { type: "number", minimum: 0 },
    description: { type: "string", maxLength: 500 }
  }
}
```

### Step 7 — Update swagger.ts

Update `src/config/swagger.ts` with the generated specifications:

#### Add Missing Schemas

Insert new schemas in the `components.schemas` object, maintaining alphabetical order:

```typescript
components: {
  schemas: {
    ApiKeyCreated: { ... },
    // ... existing schemas ...
    Product: { ... },  // NEW
    ProductCreateRequest: { ... },  // NEW
    User: { ... }
  }
}
```

#### Add Missing Paths

Insert new paths in the `paths` object, grouped by category with comment headers:

```typescript
paths: {
  // ── Auth ──────────────────────────────────────────
  "/auth/signup": { ... },

  // ── Users ─────────────────────────────────────────
  "/users": { ... },

  // ── Products ──────────────────────────────────────  // NEW SECTION
  "/products": { ... },  // NEW
  "/products/{id}": { ... },  // NEW

  // ── API Keys ──────────────────────────────────────
  "/keys": { ... }
}
```

#### Update Changed Paths

For endpoints that exist but need updates, replace only the changed parts:

- Add new parameters
- Update request/response schemas
- Modify security requirements
- Update descriptions

**IMPORTANT:** Preserve any manually written descriptions or examples that don't conflict with code.

#### Add Missing Tags

Add new tags to the `tags` array at the bottom:

```typescript
tags: [
  { name: "Public", description: "Public endpoints (no authentication)" },
  { name: "Auth", description: "Authentication & token management" },
  { name: "Users", description: "User management" },
  { name: "Products", description: "Product management" }, // NEW
  { name: "API Keys", description: "API key management" },
];
```

### Step 8 — Validate

Before finalizing:

#### TypeScript Validation

```bash
npx tsc --noEmit
```

If compilation fails, fix syntax errors in swagger.ts.

#### OpenAPI Schema Validation

Check for:

- All `$ref` references point to existing schemas
- All required schemas are defined in `components.schemas`
- All paths have at least one response
- Security schemes referenced actually exist
- All tags referenced are defined

#### Manual Verification

Instruct the user:

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000/api-docs`
3. Verify all endpoints appear correctly
4. Test an endpoint using the Swagger UI "Try it out" feature
5. Confirm request/response schemas match actual behavior

### Step 9 — Report Results

Provide a summary:

```
✅ Swagger documentation updated successfully!

Added:
- GET /products (paginated list)
- GET /products/{id} (single product)
- POST /products (create)
- PUT /products/{id} (update)
- DELETE /products/{id} (delete)

Schemas created:
- Product
- ProductCreateRequest
- ProductUpdateRequest

Tags added:
- Products

Next steps:
1. Review changes in src/config/swagger.ts
2. Visit http://localhost:3000/api-docs to see the updated documentation
3. Test the new endpoints in Swagger UI
4. Commit the changes
```

## Special Cases

### Nested Routes

For nested resource routes (e.g., `/users/:userId/posts`):

- Create separate path entries
- Use descriptive path parameters
- Reference parent resource in descriptions

### Optional Parameters

For optional query parameters:

```typescript
{
  name: "status",
  in: "query",
  required: false,
  schema: { type: "string", enum: ["active", "inactive"] }
}
```

### File Uploads

For multipart/form-data endpoints:

```typescript
requestBody: {
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        properties: {
          file: { type: "string", format: "binary" }
        }
      }
    }
  }
}
```

### Array Request Bodies

For endpoints accepting arrays:

```typescript
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "array",
        items: { $ref: "#/components/schemas/Product" }
      }
    }
  }
}
```

## Constraints

- **READ ONLY source code** — Never modify routes, controllers, or models
- **WRITE ONLY swagger.ts** — Only update `src/config/swagger.ts`
- **PRESERVE manual edits** — Don't overwrite custom descriptions unless they conflict with code changes
- **FOLLOW existing patterns** — Match the style of existing swagger.ts entries
- **VALIDATE before saving** — Always check TypeScript compilation
- **NO ASSUMPTIONS** — Always read actual files; never guess structure from memory

## Error Handling

If errors occur during the process:

- **Missing validator file** → Generate basic parameter schema from route pattern
- **Cannot infer response type** → Use generic object schema and add TODO comment
- **TypeScript compilation error** → Show error to user and ask for manual review
- **Conflicting manual edits** → Present both versions and ask user to choose

## Tips for Accuracy

1. **Read validator files completely** — Don't just look at imports; read the validation logic
2. **Check actual model return types** — TypeScript interfaces are the source of truth
3. **Follow the existing swagger.ts structure exactly** — Same indentation, same property order
4. **Use existing schemas when possible** — Don't duplicate `Pagination`, `ErrorResponse`, etc.
5. **Copy examples from similar endpoints** — If adding GET /products, reference GET /users
6. **Test the generated docs** — Always verify in Swagger UI

## Related Resources

- [OpenAPI Patterns Reference](./references/openapi-patterns.md) — Examples and templates
- [OpenAPI 3.0.3 Specification](https://swagger.io/specification/) — Official spec
- Express route pattern syntax — Used to generate path parameters
- Swagger UI — Visual testing interface at `/api-docs`

## Success Criteria

The update is successful when:

1. ✅ All endpoints from route files have corresponding paths in swagger.ts
2. ✅ All schemas referenced in paths exist in `components.schemas`
3. ✅ All tags referenced are defined in the `tags` array
4. ✅ TypeScript compilation succeeds (`npx tsc --noEmit`)
5. ✅ Swagger UI loads without errors at `/api-docs`
6. ✅ Generated specs accurately reflect code (validators, types, models)
7. ✅ Manual edits are preserved where they don't conflict
8. ✅ Code style matches existing swagger.ts entries
