# OpenAPI Patterns Reference

Common patterns and templates for generating OpenAPI specifications in this project.

## Table of Contents

1. [Path Patterns](#path-patterns)
2. [Parameter Patterns](#parameter-patterns)
3. [Request Body Patterns](#request-body-patterns)
4. [Response Patterns](#response-patterns)
5. [Schema Patterns](#schema-patterns)
6. [Security Patterns](#security-patterns)
7. [Error Response Patterns](#error-response-patterns)

---

## Path Patterns

### GET List (Paginated)

```javascript
"/resources": {
  get: {
    tags: ["Resources"],
    summary: "Get paginated list of resources",
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        schema: { type: "integer", minimum: 1, default: 1 },
        description: "Page number"
      },
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        description: "Items per page"
      }
    ],
    responses: {
      "200": {
        description: "Paginated resources list",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Resource" }
                },
                pagination: { $ref: "#/components/schemas/Pagination" }
              }
            }
          }
        }
      },
      "400": {
        description: "Invalid pagination parameters",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
}
```

### GET by ID

```javascript
"/resources/{id}": {
  get: {
    tags: ["Resources"],
    summary: "Get a single resource by ID",
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer", minimum: 1 },
        description: "Resource ID"
      }
    ],
    responses: {
      "200": {
        description: "Resource found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { $ref: "#/components/schemas/Resource" }
              }
            }
          }
        }
      },
      "400": {
        description: "Invalid ID",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "404": {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
}
```

### POST (Create)

```javascript
"/resources": {
  post: {
    tags: ["Resources"],
    summary: "Create a new resource",
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ResourceCreateRequest" }
        }
      }
    },
    responses: {
      "201": {
        description: "Resource created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { $ref: "#/components/schemas/Resource" },
                message: { type: "string", example: "Resource created successfully" }
              }
            }
          }
        }
      },
      "400": {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "409": {
        description: "Resource already exists",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
}
```

### PUT (Update)

```javascript
"/resources/{id}": {
  put: {
    tags: ["Resources"],
    summary: "Update a resource",
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer", minimum: 1 },
        description: "Resource ID"
      }
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ResourceUpdateRequest" }
        }
      }
    },
    responses: {
      "200": {
        description: "Resource updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { $ref: "#/components/schemas/Resource" },
                message: { type: "string", example: "Resource updated successfully" }
              }
            }
          }
        }
      },
      "400": {
        description: "Validation error or invalid ID",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "404": {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
}
```

### DELETE

```javascript
"/resources/{id}": {
  delete: {
    tags: ["Resources"],
    summary: "Delete a resource",
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer", minimum: 1 },
        description: "Resource ID"
      }
    ],
    responses: {
      "200": {
        description: "Resource deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "Resource deleted successfully" },
                id: { type: "integer" }
              }
            }
          }
        }
      },
      "400": {
        description: "Invalid ID",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      "404": {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
}
```

---

## Parameter Patterns

### Path Parameters

```javascript
// Integer ID
{
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
  description: "Resource ID"
}

// String slug
{
  name: "slug",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-z0-9-]+$" },
  description: "Resource slug"
}

// UUID
{
  name: "uuid",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "Resource UUID"
}
```

### Query Parameters

```javascript
// Pagination
{
  name: "page",
  in: "query",
  schema: { type: "integer", minimum: 1, default: 1 },
  description: "Page number"
},
{
  name: "limit",
  in: "query",
  schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  description: "Items per page"
}

// Filter by status
{
  name: "status",
  in: "query",
  schema: { type: "string", enum: ["active", "inactive", "pending"] },
  description: "Filter by status"
}

// Search query
{
  name: "q",
  in: "query",
  schema: { type: "string", maxLength: 100 },
  description: "Search query"
}

// Sort
{
  name: "sort",
  in: "query",
  schema: { type: "string", enum: ["name", "-name", "created_at", "-created_at"] },
  description: "Sort field (prefix with - for descending)"
}

// Boolean flag
{
  name: "includeDeleted",
  in: "query",
  schema: { type: "boolean", default: false },
  description: "Include soft-deleted records"
}
```

---

## Request Body Patterns

### Simple Object

```javascript
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "John Doe"
          },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com"
          },
          age: {
            type: "integer",
            minimum: 18,
            maximum: 120,
            example: 30
          }
        }
      }
    }
  }
}
```

### With Schema Reference

```javascript
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ResourceCreateRequest" }
    }
  }
}
```

### Array of Objects

```javascript
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "array",
        minItems: 1,
        maxItems: 100,
        items: { $ref: "#/components/schemas/Resource" }
      }
    }
  }
}
```

### File Upload

```javascript
requestBody: {
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "File to upload"
          },
          description: {
            type: "string",
            maxLength: 500
          }
        }
      }
    }
  }
}
```

---

## Response Patterns

### Success with Data Object

```javascript
"200": {
  description: "Success",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Resource" }
        }
      }
    }
  }
}
```

### Success with Data Array (Paginated)

```javascript
"200": {
  description: "Success",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Resource" }
          },
          pagination: { $ref: "#/components/schemas/Pagination" }
        }
      }
    }
  }
}
```

### Success with Message

```javascript
"200": {
  description: "Success",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation completed successfully" },
          id: { type: "integer", example: 123 }
        }
      }
    }
  }
}
```

### Created (201)

```javascript
"201": {
  description: "Resource created",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Resource" },
          message: { type: "string", example: "Resource created successfully" }
        }
      }
    }
  }
}
```

### No Content (204)

```javascript
"204": {
  description: "No content"
}
```

---

## Schema Patterns

### Basic Entity

```javascript
Resource: {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Resource Name" },
    description: { type: "string", example: "Resource description" },
    status: { type: "string", enum: ["active", "inactive"], example: "active" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" }
  }
}
```

### Create Request Schema

```javascript
ResourceCreateRequest: {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 100,
      example: "New Resource"
    },
    description: {
      type: "string",
      maxLength: 500,
      example: "Optional description"
    },
    status: {
      type: "string",
      enum: ["active", "inactive"],
      default: "active"
    }
  }
}
```

### Update Request Schema

```javascript
ResourceUpdateRequest: {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 100
    },
    description: {
      type: "string",
      maxLength: 500
    },
    status: {
      type: "string",
      enum: ["active", "inactive"]
    }
  }
}
```

### Nested Object

```javascript
Resource: {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    owner: { $ref: "#/components/schemas/User" },
    metadata: {
      type: "object",
      properties: {
        color: { type: "string" },
        priority: { type: "integer" }
      }
    }
  }
}
```

### With Enum

```javascript
Resource: {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["draft", "published", "archived"],
      example: "published"
    },
    visibility: {
      type: "string",
      enum: ["public", "private", "unlisted"],
      default: "private"
    }
  }
}
```

---

## Security Patterns

### Dual Authentication (JWT or API Key)

```javascript
security: [{ bearerAuth: [] }, { apiKeyAuth: [] }];
```

### JWT Only

```javascript
security: [{ bearerAuth: [] }];
```

### Public Endpoint

```javascript
// No security field
```

### JWT Required with Note

```javascript
security: [{ bearerAuth: [] }],
description: "Requires JWT authentication — API Key auth is not accepted."
```

---

## Error Response Patterns

### Standard Error Responses

Always include these for protected endpoints:

```javascript
responses: {
  "200": { /* success response */ },
  "400": {
    description: "Validation error or bad request",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  },
  "401": {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  }
}
```

### For GET/PUT/DELETE by ID

Add:

```javascript
"404": {
  description: "Resource not found",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" }
    }
  }
}
```

### For POST/PUT with Unique Constraints

Add:

```javascript
"409": {
  description: "Resource already exists",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" }
    }
  }
}
```

### For Rate-Limited Endpoints

Add:

```javascript
"429": {
  description: "Too many requests",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" }
    }
  }
}
```

---

## Express to OpenAPI Conversion Rules

### Path Parameters

| Express Pattern    | OpenAPI Path         |
| ------------------ | -------------------- |
| `/:id`             | `/{id}`              |
| `/:userId/posts`   | `/{userId}/posts`    |
| `/:category/:slug` | `/{category}/{slug}` |

### Route Registration

| Registration in app.ts               | Base Path |
| ------------------------------------ | --------- |
| `app.use('/api/users', usersRouter)` | `/users`  |
| `app.use('/auth', authRouter)`       | `/auth`   |
| `app.use('/api/keys', keysRouter)`   | `/keys`   |

### Middleware to Security

| Middleware         | Security Scheme                            |
| ------------------ | ------------------------------------------ |
| No auth middleware | None (public)                              |
| `authenticate`     | `[{ bearerAuth: [] }, { apiKeyAuth: [] }]` |
| `requireJWT`       | `[{ bearerAuth: [] }]`                     |
| Rate limiter       | Note in `description`                      |

### Validator to Parameters

| Validator                 | Parameters              |
| ------------------------- | ----------------------- |
| `paginationValidator`     | `page`, `limit` (query) |
| `idValidator`             | `id` (path, integer)    |
| `createResourceValidator` | Request body            |
| `updateResourceValidator` | Request body            |

---

## Naming Conventions

### Tags

- Plural form: "Users", "Products", "API Keys"
- Title case
- Match resource names

### Schemas

- Entity: `Product`, `User`, `ApiKey`
- Create request: `ProductCreateRequest`
- Update request: `ProductUpdateRequest`
- Response wrapper: `AuthTokens`, `ApiKeyCreated`

### Operation IDs (if used)

- `getProducts` (GET list)
- `getProductById` (GET by ID)
- `createProduct` (POST)
- `updateProduct` (PUT)
- `deleteProduct` (DELETE)

### Summary Guidelines

- Verb + object: "Get paginated list of products"
- "Get a single product by ID"
- "Create a new product"
- "Update a product"
- "Delete a product"
- Keep concise (under 80 chars)

---

## Common Pitfalls to Avoid

1. **Missing required schemas** — Always check that `$ref` paths exist
2. **Inconsistent response wrappers** — Follow the `{ data: ..., pagination: ... }` pattern
3. **Wrong security schemes** — Match the middleware in the route file
4. **Missing error responses** — Include 400, 401, 404 as appropriate
5. **Path parameter mismatch** — Express `:id` must become `{id}` in OpenAPI
6. **Forgetting to add tags** — Define the tag in the `tags` array
7. **Inconsistent property order** — Match existing swagger.ts structure
8. **Missing examples** — Add realistic examples for better documentation

---

## Testing Your Generated Specs

1. **Syntax validation**: `npx tsc --noEmit`
2. **Visual validation**: Visit `/api-docs` in browser
3. **Functional testing**: Use "Try it out" in Swagger UI
4. **Schema validation**: Check that requests validate correctly
5. **Response validation**: Verify responses match the spec
