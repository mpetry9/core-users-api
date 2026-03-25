# GitHub Actions Failure Debugging Reference

> Comprehensive technical reference for debugging CI/CD pipeline failures. This document provides detailed examples, tool usage patterns, and troubleshooting strategies.

## Table of Contents

- [GitHub MCP Tools Usage](#github-mcp-tools-usage)
- [Common Error Patterns](#common-error-patterns)
- [Workflow YAML Issues](#workflow-yaml-issues)
- [Environment Debugging](#environment-debugging)
- [Log Analysis Strategies](#log-analysis-strategies)
- [Test Failure Diagnosis](#test-failure-diagnosis)
- [Dependency Resolution](#dependency-resolution)
- [Quick Reference Checklists](#quick-reference-checklists)

---

## GitHub MCP Tools Usage

### Loading GitHub MCP Tools

Before using any GitHub MCP tools, load them with:

```
tool_search_tool_regex with pattern: ^mcp_github_
```

### Pull Request Investigation

**Get all open PRs:**

```javascript
mcp_github_list_pull_requests({
  owner: "username",
  repo: "repo-name",
  state: "open",
});
```

**Get PR details including checks:**

```javascript
mcp_github_pull_request_read({
  owner: "username",
  repo: "repo-name",
  pull_number: 42,
});
// Returns: PR info, checks status, files changed, conversations
```

### Commit Analysis

**List recent commits:**

```javascript
mcp_github_list_commits({
  owner: "username",
  repo: "repo-name",
  per_page: 10,
  branch: "main", // or feature branch
});
```

**Get specific commit details:**

```javascript
mcp_github_get_commit({
  owner: "username",
  repo: "repo-name",
  ref: "abc123def", // commit SHA
});
// Returns: files changed, diff stats, commit message, author
```

### Workflow File Inspection

**Read workflow YAML:**

```javascript
mcp_github_get_file_contents({
  owner: "username",
  repo: "repo-name",
  path: ".github/workflows/test-suite.yml",
  ref: "main", // or branch/commit SHA
});
```

### Log Analysis (Most Important)

**AI-Powered Summary (USE THIS FIRST):**

```javascript
summarize_job_log_failures({
  owner: "username",
  repo: "repo-name",
  run_id: 123456789,
  job_id: 987654321, // optional, for specific job
});
// Returns: AI summary of failures, root causes, suggested fixes
```

**Raw logs (only if summary insufficient):**

```javascript
get_job_logs({
  owner: "username",
  repo: "repo-name",
  job_id: 987654321,
});
// WARNING: Can return thousands of lines

get_workflow_run_logs({
  owner: "username",
  repo: "repo-name",
  run_id: 123456789,
});
// WARNING: Returns logs for ALL jobs in the workflow
```

### Commenting on PRs

**Add diagnostic comment:**

```javascript
mcp_github_add_issue_comment({
  owner: "username",
  repo: "repo-name",
  issue_number: 42, // PR number works here
  body: "🔧 Fixed the failing test by correcting the mock setup in `auth.test.ts`",
});
```

---

## Common Error Patterns

### Node.js / npm Errors

#### Error: `npm ERR! Cannot find module`

**Symptoms:**

```
Error: Cannot find module '@types/jest'
    at Function.Module._resolveFilename
```

**Causes:**

- Dependencies not installed
- `package-lock.json` out of sync
- Missing devDependencies

**Solutions:**

1. Check if package is in `package.json`
2. Regenerate lock file: `rm package-lock.json && npm install`
3. Verify workflow uses `npm ci` (installs from lock file) not `npm install`
4. Check if `.npmrc` exists and is correct

#### Error: `npm ERR! peer dep missing`

**Symptoms:**

```
npm ERR! peer dep missing: typescript@>=4.5.0, required by @typescript-eslint/parser@5.0.0
```

**Solutions:**

1. Install the peer dependency explicitly
2. Update the requiring package to compatible version
3. Use `npm install --legacy-peer-deps` (last resort)

#### Error: `ENOENT: no such file or directory`

**Symptoms:**

```
ENOENT: no such file or directory, open 'dist/index.js'
```

**Causes:**

- Build step not run before test/deploy
- Wrong working directory
- File path case sensitivity (macOS vs Linux)

**Solutions:**

1. Ensure steps run in correct order in workflow
2. Add `npm run build` step before the failing step
3. Check file paths for case sensitivity
4. Verify `cwd` or `working-directory` in workflow

### Test Failures

#### Error: `Jest did not exit one second after the test run completed`

**Causes:**

- Open database connections
- Active timers/intervals
- Unresolved promises
- Event listeners not cleaned up

**Solutions:**

```typescript
// In test teardown
afterAll(async () => {
  await db.close(); // Close DB connections
  jest.clearAllTimers();
  jest.clearAllMocks();
});

// In beforeEach
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

#### Error: `Timeout - Async callback was not invoked within timeout`

**Symptoms:**

```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solutions:**

1. Increase timeout: `jest.setTimeout(10000);` in test file
2. Fix the actual timeout issue (waiting for response that never comes)
3. Check for missing `await` keywords
4. Verify mocks are properly configured

#### Error: `Expected 200, received 404`

**Causes:**

- Route not registered
- Middleware blocking request
- Database not seeded
- Wrong base URL in test

**Debugging steps:**

```typescript
// Add diagnostic logging
console.log("Registered routes:", app._router.stack);
console.log("Request URL:", request.url);
console.log("DB records:", await User.find({}));
```

### TypeScript Errors

#### Error: `Property 'x' does not exist on type 'Y'`

**Common in CI when works locally:**

- TypeScript version mismatch between local and CI
- `@types/*` packages missing or wrong version
- `tsconfig.json` not committed or different

**Solutions:**

1. Check `package.json` engines: `"typescript": "^5.0.0"`
2. Compare Node versions: local vs workflow `node-version`
3. Commit `tsconfig.json` if missing
4. Run `npm ci` locally to match exact CI versions

### Linting Errors

#### Error: `Parsing error: Cannot find module 'typescript'`

**Fix:**

```json
// Ensure these are in package.json devDependencies
{
  "typescript": "^5.0.0",
  "@typescript-eslint/parser": "^5.0.0",
  "@typescript-eslint/eslint-plugin": "^5.0.0"
}
```

#### Error: `Unexpected token` in ESLint

**Causes:**

- Parser not configured for TypeScript
- Wrong parser version

**Fix in `.eslintrc.json`:**

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  }
}
```

---

## Workflow YAML Issues

### Wrong Node Version

**Problem:**

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 16 # Wrong!
```

**Solution:**

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 20 # Match package.json engines
    cache: "npm"
```

**Verify package.json has:**

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Missing Environment Variables

**Problem:**

```yaml
- name: Run tests
  run: npm test
  # Missing DATABASE_URL, JWT_SECRET, etc.
```

**Solution:**

```yaml
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgres://user:pass@localhost:5432/test_db
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    NODE_ENV: test
```

**For PostgreSQL:**

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: test_db
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

# Then in test step:
env:
  DATABASE_URL: postgres://testuser:testpass@localhost:5432/test_db
```

### Cache Issues

**Problem: Stale cache causing failures**

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**Solutions:**

1. **Invalidate cache manually** - Change the cache key:

```yaml
key: ${{ runner.os }}-node-v2-${{ hashFiles('**/package-lock.json') }}
#                            ^^^ increment version
```

2. **Use setup-node built-in cache:**

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 20
    cache: "npm" # Automatically handles caching
```

### Step Dependencies

**Problem: Steps run in wrong order**

```yaml
- name: Run tests
  run: npm test # Fails because build didn't run

- name: Build
  run: npm run build
```

**Solution: Correct order**

```yaml
- name: Install dependencies
  run: npm ci

- name: Build
  run: npm run build

- name: Run tests
  run: npm test
```

### Conditional Execution

**Run only on specific branches:**

```yaml
name: Deploy
on:
  push:
    branches:
      - main
      - production
```

**Run only on PR:**

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

**Skip on certain conditions:**

```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main' && success()
  run: npm run deploy
```

---

## Environment Debugging

### Check Environment Variables

**In workflow, add diagnostic step:**

```yaml
- name: Debug Environment
  run: |
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "Working directory: $(pwd)"
    echo "DATABASE_URL is set: ${{ env.DATABASE_URL != '' }}"
    echo "NODE_ENV: $NODE_ENV"
    ls -la  # List files
```

### Database Connection Issues

**Problem: Tests can't connect to database**

**Check:**

1. Is database service running?
2. Is DATABASE_URL correct?
3. Do migrations run before tests?
4. Are ports exposed correctly?

**Example complete setup:**

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: test_db
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s

steps:
  - name: Checkout
    uses: actions/checkout@v3

  - name: Setup Node
    uses: actions/setup-node@v3
    with:
      node-version: 20
      cache: "npm"

  - name: Install dependencies
    run: npm ci

  - name: Wait for PostgreSQL
    run: |
      until pg_isready -h localhost -p 5432; do
        echo "Waiting for postgres..."
        sleep 2
      done

  - name: Run migrations
    run: npm run migrate
    env:
      DATABASE_URL: postgres://testuser:testpass@localhost:5432/test_db

  - name: Run tests
    run: npm test
    env:
      DATABASE_URL: postgres://testuser:testpass@localhost:5432/test_db
      NODE_ENV: test
```

### File Permission Issues

**Problem: `EACCES: permission denied`**

**Solution:**

```yaml
- name: Make script executable
  run: chmod +x ./scripts/deploy.sh

- name: Run script
  run: ./scripts/deploy.sh
```

---

## Log Analysis Strategies

### Reading Error Stack Traces

**Example error:**

```
Error: expected 200 "OK", got 401 "Unauthorized"
    at Test._assertStatus (node_modules/supertest/lib/test.js:268:12)
    at Test._assertFunction (node_modules/supertest/lib/test.js:283:11)
    at Test.assert (node_modules/supertest/lib/test.js:173:18)
    at localAssert (node_modules/supertest/lib/test.js:131:12)
    at /Users/project/tests/e2e/users.routes.test.ts:45:9
                                                          ^^^^^^
```

**Read from bottom up:**

1. **Line 45 in users.routes.test.ts** - This is YOUR code
2. Everything above is library code
3. Focus on the test file and line number

### Filtering Logs

**When logs are too verbose:**

```bash
# Locally, filter logs
npm test 2>&1 | grep -A 5 "Error:"

# In workflow, use grep
- name: Run tests
  run: npm test 2>&1 | tee test-output.txt

- name: Show errors only
  if: failure()
  run: grep -A 10 "Error:" test-output.txt
```

### Identifying Flaky Tests

**Signs of flaky test:**

- Passes sometimes, fails other times
- More likely to fail in CI than locally
- Timing-related failures
- Random assertion failures

**Investigate:**

```yaml
# Run tests multiple times to check for flakiness
- name: Run tests 5 times
  run: |
    for i in {1..5}; do
      echo "Run $i"
      npm test || {
        echo "Failed on run $i"
        exit 1
      }
    done
```

**Common flaky test causes:**

- Shared state between tests
- Reliance on external services
- Race conditions
- Insufficient timeouts
- Date/time dependencies

---

## Test Failure Diagnosis

### Isolate the Failing Test

**Run single test locally:**

```bash
# Jest
npm test -- users.routes.test.ts
npm test -- -t "should create a new user"

# With verbose output
npm test -- users.routes.test.ts --verbose

# With coverage
npm test -- users.routes.test.ts --coverage
```

### Common Test Patterns and Fixes

#### Pattern: "Connection already closed"

```typescript
// BAD: Closing connection in test
test("should fetch users", async () => {
  const users = await db.query("SELECT * FROM users");
  await db.close(); // Don't do this!
  expect(users).toBeDefined();
});

// GOOD: Close in afterAll
afterAll(async () => {
  await db.close();
});
```

#### Pattern: "Mock not being called"

```typescript
// BAD: Mock defined after import
import { sendEmail } from "./email";
jest.mock("./email");

// GOOD: Hoist mock before imports
jest.mock("./email");
import { sendEmail } from "./email";

// Or use factory
jest.mock("./email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
```

#### Pattern: "Test data bleeding between tests"

```typescript
// GOOD: Clear data before each test
beforeEach(async () => {
  await db.query("TRUNCATE TABLE users CASCADE");
  await db.query("TRUNCATE TABLE api_keys CASCADE");
  // Or use transactions:
  await db.query("BEGIN");
});

afterEach(async () => {
  await db.query("ROLLBACK");
});
```

---

## Dependency Resolution

### Lock File Issues

**Symptom: Works locally, fails in CI**

**Check:**

```bash
# Do you have uncommitted changes to lock file?
git status | grep package-lock.json

# Is lock file out of sync?
npm install --package-lock-only
git diff package-lock.json
```

**Fix:**

```bash
# Complete rebuild
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
```

### Version Conflicts

**Check for conflicts:**

```bash
npm ls typescript
# └─┬ multiple versions
#   ├── typescript@5.0.0
#   └── typescript@4.9.0  ← conflict!

# See which packages depend on conflicting versions
npm ls typescript
npm why typescript
```

**Resolution strategies:**

1. Update all to same version
2. Use `overrides` in package.json:

```json
{
  "overrides": {
    "typescript": "^5.0.0"
  }
}
```

### Native Module Failures

**Error: `node-pre-gyp install`**

**Common with packages:** bcrypt, sharp, sqlite3

**Solutions:**

1. **Use pure JavaScript alternative:**
   - bcrypt → bcryptjs
   - node-sass → sass (dart-sass)

2. **Ensure build tools in CI:**

```yaml
- name: Install dependencies
  run: |
    npm ci
    # For native modules
    npm rebuild
```

3. **Match Node version exactly:** Native modules are compiled for specific Node versions

---

## Quick Reference Checklists

### Pre-Push Checklist

- [ ] Run `npm install` and commit lock file changes
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run lint` - no linting errors
- [ ] Run `npm run build` - builds successfully
- [ ] Check `.env.example` matches required vars
- [ ] Review changed files for console.logs, debuggers

### CI Failure Checklist

- [ ] Read the error message completely
- [ ] Note which workflow and job failed
- [ ] Check if error is in test, lint, or build step
- [ ] Compare Node version: local vs CI
- [ ] Check for recent dependency changes
- [ ] Verify environment variables are set
- [ ] Try running the exact CI command locally
- [ ] Check if failure is on specific branch only

### Debugging Workflow Checklist

- [ ] Workflow file syntax valid (use YAML validator)
- [ ] Required secrets configured in repo settings
- [ ] Correct branch triggers configured
- [ ] Steps in logical order (install → build → test)
- [ ] Environment variables passed to all steps that need them
- [ ] Database service healthy before tests run
- [ ] Node version matches package.json engines
- [ ] Cache keys appropriate and not stale

### Test Failure Checklist

- [ ] Can you reproduce locally?
- [ ] Is it flaky or consistent?
- [ ] Check test isolation (beforeEach/afterEach)
- [ ] Verify mocks are set up correctly
- [ ] Check for timing issues (async/await)
- [ ] Ensure database is seeded properly
- [ ] Verify test data doesn't conflict
- [ ] Check for hardcoded values (dates, IDs)

---

## Real-World Examples

### Example 1: JWT Secret Missing

**Error in logs:**

```
Error: JWT secret is required
    at validateConfig (src/config/auth.ts:15:11)
```

**Investigation:**

1. Check `auth.ts` - requires `process.env.JWT_SECRET`
2. Check workflow - no `JWT_SECRET` in env
3. Check repo secrets - not configured

**Solution:**

```yaml
# Add to workflow
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}

# Add secret to GitHub:
# Settings → Secrets → Actions → New repository secret
# Name: JWT_SECRET
# Value: <your-secret>
```

### Example 2: Test Database Not Created

**Error:**

```
database "test_db" does not exist
```

**Investigation:**

1. Check workflow - postgres service exists
2. Check env var - DATABASE_URL points to test_db
3. Problem: database created as `postgres`, not `test_db`

**Solution:**

```yaml
services:
  postgres:
    env:
      POSTGRES_DB: test_db # Add this!
```

### Example 3: Flaky E2E Test

**Error (intermittent):**

```
Timeout: async callback was not invoked within 5000ms
```

**Investigation:**

1. Test creates user and immediately queries it
2. Sometimes query happens before write commits
3. Missing `await` keyword

**Solution:**

```typescript
// BAD
test("creates and retrieves user", async () => {
  const user = createUser({ name: "Test" }); // Missing await!
  const found = await findUser(user.id);
  expect(found).toBeDefined();
});

// GOOD
test("creates and retrieves user", async () => {
  const user = await createUser({ name: "Test" });
  const found = await findUser(user.id);
  expect(found).toBeDefined();
});
```

---

## Additional Resources

### Useful GitHub Actions

- **Debug with SSH:** `tmate-action` - SSH into runner
- **Annotate errors:** `action-junit-report` - Show test results in PR
- **Slack notifications:** `action-slack` - Alert on failures

### Monitoring Tools

- **GitHub Insights:** Actions tab → Workflow runs → Analytics
- **Third-party:** Datadog, New Relic, LogRocket

### Best Practices

1. **Keep workflows fast** - Use caching, run in parallel
2. **Fail fast** - Put fastest checks first (lint before tests)
3. **Use matrix builds** - Test multiple Node versions
4. **Separate concerns** - One workflow per purpose
5. **Version lock** - Pin action versions (`@v3.1.0` not `@v3`)

---

## Appendix: Command Reference

### npm Commands

```bash
npm ci                    # Clean install from lock file (CI)
npm install              # Install and update lock file (local)
npm test                 # Run tests
npm run lint             # Run linter
npm run lint:fix         # Auto-fix linting issues
npm run build            # Build TypeScript
npm outdated             # Check for outdated packages
npm audit                # Check for security vulnerabilities
npm ls <package>         # Show package version tree
```

### Git Commands

```bash
git log --oneline -10              # Last 10 commits
git show <commit>                  # Show commit details
git diff HEAD~1 package.json       # Compare with previous commit
git checkout <commit> -- file.txt  # Checkout file from commit
```

### Database Commands

```bash
# PostgreSQL
psql -U user -d dbname -c "SELECT * FROM users;"
pg_isready -h localhost            # Check if ready
createdb test_db                   # Create database
dropdb test_db                     # Drop database

# Run migration
npm run migrate

# Rollback migration
npm run migrate:rollback
```

---

_Last updated: March 2026_
