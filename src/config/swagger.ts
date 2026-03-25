import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Core Users API",
    version: "1.0.0",
    description: "User management API with JWT and API Key authentication",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT access token obtained from /auth/login or /auth/signup",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description:
          "API Key authentication. Use the format: `ApiKey <your_api_key>`",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            example: "active",
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          status: { type: "string", example: "active" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string", description: "JWT access token" },
          refreshToken: { type: "string", description: "JWT refresh token" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      ApiKeyResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          name: { type: "string", example: "My API Key" },
          keyPreview: { type: "string", example: "sk_live_...xyz" },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          isActive: { type: "boolean", example: true },
        },
      },
      ApiKeyCreated: {
        allOf: [
          { $ref: "#/components/schemas/ApiKeyResponse" },
          {
            type: "object",
            properties: {
              key: {
                type: "string",
                description:
                  "Plaintext API key — only returned once at creation",
              },
              message: { type: "string" },
            },
          },
        ],
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 50 },
          totalPages: { type: "integer", example: 5 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          details: {
            type: "array",
            items: { type: "string" },
            description: "Validation error details (if applicable)",
          },
        },
      },
    },
  },
  paths: {
    // ── Auth ──────────────────────────────────────────
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                    example: "John Doe",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },
                  password: {
                    type: "string",
                    minLength: 8,
                    maxLength: 128,
                    description: "At least 1 letter and 1 digit",
                    example: "Secret123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokens" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user and get tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },
                  password: { type: "string", example: "Secret123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokens" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials or inactive user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token using a refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    description: "Valid refresh token",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokens" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user info",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUser" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ── Users ─────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Get paginated list of users",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
            description: "Items per page",
          },
        ],
        responses: {
          "200": {
            description: "Paginated users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid pagination parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a single user by ID",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "User found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ── API Keys ──────────────────────────────────────
    "/keys": {
      post: {
        tags: ["API Keys"],
        summary: "Create a new API key",
        description:
          "Requires JWT authentication — API Key auth is not accepted.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 3,
                    maxLength: 100,
                    example: "My API Key",
                  },
                  expiresInDays: {
                    type: "integer",
                    minimum: 1,
                    maximum: 3650,
                    description: "Optional expiration in days",
                    example: 90,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description:
              "API key created — the plaintext key is only returned once",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyCreated" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "API Key auth not accepted for this endpoint",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      get: {
        tags: ["API Keys"],
        summary: "List all API keys for the authenticated user",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "List of API keys",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    keys: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApiKeyResponse" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/keys/{id}": {
      get: {
        tags: ["API Keys"],
        summary: "Get details of a specific API key",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "API Key ID",
          },
        ],
        responses: {
          "200": {
            description: "API key details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyResponse" },
              },
            },
          },
          "400": {
            description: "Invalid ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "API key not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["API Keys"],
        summary: "Revoke an API key",
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
            description: "API Key ID",
          },
        ],
        responses: {
          "200": {
            description: "API key revoked",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "API key revoked successfully",
                    },
                    id: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "API key not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    // ── Public ────────────────────────────────────────
    "/": {
      get: {
        tags: ["Public"],
        summary: "Welcome message",
        responses: {
          "200": {
            description: "Welcome message",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Welcome to core-users-api",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Public"],
        summary: "Health check with client info",
        responses: {
          "200": {
            description: "Service health status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    client: {
                      type: "object",
                      properties: {
                        ip: { type: "string" },
                        country: { type: "string" },
                        language: { type: "string" },
                        os: { type: "string" },
                        browser: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: "Public", description: "Public endpoints (no authentication)" },
    { name: "Auth", description: "Authentication & token management" },
    { name: "Users", description: "User management" },
    { name: "API Keys", description: "API key management" },
  ],
};

export { swaggerUi, swaggerDocument };
