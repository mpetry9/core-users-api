# Testing Suite for Core Users API

## Overview

This document describes the comprehensive testing implementation for the core-users-API project using Jest and Supertest.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── teardown.ts                 # Global test teardown
├── helpers/                    # Test utilities
│   ├── database.ts            # DB connection & cleanup utilities
│   ├── auth.ts                # JWT & API key generation helpers
│   └── factories.ts           # Test data factories
├── unit/                       # Unit tests (isolated, mocked)
│   ├── utils/
│   │   ├── auth.util.test.ts          # ✓ Password, JWT, API key utils
│   │   └── pagination.util.test.ts     # ✓ Pagination calculations
│   ├── middleware/
│   │   ├── auth.middleware.test.ts     # ✓ JWT & API key authentication
│   │   └── errorHandler.test.ts        # ✓ Error handling middleware
│   └── validators/
│       ├── auth.validator.test.ts      # ✓ Signup/login validation
│       ├── apiKey.validator.test.ts    # ✓ API key creation validation
│       └── pagination.validator.test.ts # ✓ Pagination param validation
├── integration/                # Integration tests (real DB)
│   ├── models/
│   │   ├── user.model.test.ts         # User model DB operations
│   │   └── apiKey.model.test.ts       # API key model DB operations
│   └── controllers/
│       ├── auth.controller.test.ts     # Auth business logic
│       ├── users.controller.test.ts    # User business logic
│       └── apiKeys.controller.test.ts  # API key business logic
└── e2e/                        # End-to-end tests (full stack)
    ├── auth.routes.test.ts             # Authentication endpoints
    ├── users.routes.test.ts            # User management endpoints
    ├── apiKeys.routes.test.ts          # API key management endpoints
    └── public.routes.test.ts           # Public/health endpoints
```

## Running Tests

### All Tests

```bash
npm test
```

### By Type

```bash
npm run test:unit          # Fast isolated tests
npm run test:integration   # DB integration tests
npm run test:e2e           # Full API tests
```

### With Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## Test Database Setup

### Requirements

- PostgreSQL instance running locally
- Separate test database: `core_users_test`

### Setup Commands

```bash
# Create test database
createdb core_users_test

# Run migrations on test DB
DATABASE_URL=postgresql://localhost:5432/core_users_test npm run migrate
```

### Configuration

Test database connection configured in `.env.test`:

- Uses reduced bcrypt rounds (4 vs 10) for faster tests
- Higher rate limits to prevent test flakiness
- Test-specific API key prefix: `sk_test_`

## Test Coverage Goals

| Category   | Target | Current |
| ---------- | ------ | ------- |
| Lines      | 80%    | TBD     |
| Branches   | 70%    | TBD     |
| Functions  | 80%    | TBD     |
| Statements | 80%    | TBD     |

## Key Testing Patterns

### Unit Tests

- **Mock all external dependencies** (DB, external services)
- Test business logic in isolation
- Fast execution (< 2s total)

### Integration Tests

- **Real database** for model/controller tests
- Clean DB before each test suite
- Test actual data flow

### E2E Tests

- **Real app instance** with Supertest
- Test complete request/response cycles
- Verify authentication, validation, error handling

## Test Utilities

### Database Helpers (`tests/helpers/database.ts`)

- `getTestPool()` - Get test DB connection pool
- `cleanDatabase()` - Remove all test data
- `closeTestPool()` - Close connections
- `testConnection()` - Verify DB connectivity

### Auth Helpers (`tests/helpers/auth.ts`)

- `generateTestJWT()` - Create valid test tokens
- `generateExpiredJWT()` - Create expired tokens
- `generateMalformedJWT()` - Invalid token strings
- `createAuthUser()` - Create user + return tokens
- `createTestApiKeyInDb()` - Create API key in DB

### Factories (`tests/helpers/factories.ts`)

- `createTestUserData()` - Generate user payload
- `createTestUsers()` - Bulk user data
- `invalidSignupData` - Collection of invalid inputs
- `invalidLoginData` - Invalid login payloads
- `invalidApiKeyData` - Invalid API key payloads

## Current Implementation Status

### ✅ Phase 1: Foundation (Complete)

- Jest + Supertest + ts-jest installed
- Jest config with TypeScript support
- Test scripts in package.json
- `.env.test` configuration created
- Global setup/teardown files
- Test helper utilities (database, auth, factories)

### ✅ Phase 2: Unit Tests (Complete)

- ✓ Utils: auth.util.ts, pagination.util.ts (50+ tests)
- ✓ Validators: auth, apiKey, pagination (70+ tests)
- ✓ Middleware: auth, errorHandler (50+ tests)
- **Total: ~170 unit tests**

### 🚧 Phase 3: Integration

Tests (In Progress)
_Note: Some test failures exist due to type mismatches that need to be resolved_

- Model tests for User and ApiKey models
- Controller tests with DB integration

### ⏳ Phase 4: E2E Tests (Pending)

- Authentication routes (signup, login, refresh, me)
- User routes (list, get by ID)
- API key routes (create, list, get, revoke)
- Public routes (health, welcome)
- Rate limiting verification

## Known Issues & TODOs

### Immediate Fixes Needed

1. **Auth middleware tests**: Add `email` field to all `DecodedToken` mocks
2. **Pagination util tests**: Fix NaN expectations (Math.max with NaN returns NaN, not 1)
3. **Auth validator tests**:
   - Password > 128 chars validation may not be working
   - Empty refresh token handling
4. **Error handler test**: Error without message has default "Internal Server Error"

### Integration Tests TODO

- Create model tests for User (9 methods)
- Create model tests for ApiKey (9 methods)
- Create controller tests for auth (4 methods)
- Create controller tests for users (2 methods)
- Create controller tests for apiKeys (4 methods)

### E2E Tests TODO

- Test all 10 API endpoints with Supertest
- Verify dual authentication (JWT + API Key)
- Test rate limiting on auth endpoints
- Verify error responses match expected format
- Test pagination on user list endpoint

## Best Practices

### Test Organization

- **One describe block per function/method**
- **Group related tests** (e.g., "email validation", "error cases")
- **Clear test names**: "should [expected behavior] when [condition]"

### Mock Management

- **Reset mocks** between tests: `jest.clearAllMocks()` in `beforeEach`
- **Spy on functions** rather than replacing modules when possible
- **Verify mock calls** with specific assertions, not just "was called"

### Database Testing

- **Clean between suites**, not between individual tests (faster)
- **Use transactions** for rollback if implementing (future enhancement)
- **Seed minimum data** needed for each test

### Assertion Patterns

```typescript
// Good: Specific assertions
expect(mockRes.status).toHaveBeenCalledWith(401);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    error: "Unauthorized",
    message: expect.stringContaining("required"),
  }),
);

// Avoid: Vague assertions
expect(mockNext).toHaveBeenCalled(); // Without checking it wasn't called with error
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in jest.config.ts: `testTimeout: 10000`
- Check for unclosed database connections
- Verify async/await usage is correct

### Database Connection Errors

- Ensure test database exists: `createdb core_users_test`
- Check DATABASE_URL in .env.test
- Verify PostgreSQL is running

### Rate Limit Issues

- Tests use higher limits (100 vs 5) in .env.test
- Run tests with `--runInBand` to prevent parallel request collisions

### Module Resolution Errors

- Check tsconfig.json paths configuration
- Verify jest.config.ts moduleNameMapper matches

## Future Enhancements

### Performance

- [ ] Add test database transactions for faster cleanup
- [ ] Implement parallel test execution for E2E tests
- [ ] Cache test data setup for repeated use

### Coverage

- [ ] Add snapshot tests for API response formats
- [ ] Implement mutation testing (Stryker)
- [ ] Add contract testing for API versioning

### CI/CD

- [ ] GitHub Actions workflow for running tests
- [ ] Automated coverage reporting (Codecov/Coveralls)
- [ ] Pre-commit hooks to run unit tests

### Load Testing

- [ ] Add Artillery or k6 scripts for performance tests
- [ ] Stress test authentication endpoints
- [ ] Benchmark database query performance

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated**: March 23, 2026
**Test Framework**: Jest 30.3.0, Supertest 7.2.2
**Test Count**: ~170 unit tests (Phase 2 complete)
