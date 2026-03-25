---
name: github-actions-failure-debugging
description: Debug and fix failing GitHub Actions workflows. USE FOR: investigating workflow failures, fixing failing CI/CD pipelines, analyzing job logs, diagnosing build errors, troubleshooting test failures in Actions, fixing broken deployments. DO NOT USE FOR: local test failures (use default agent), general coding questions, or creating new workflows from scratch.
applyTo:
  - "**/.github/workflows/**"
  - "**/ci-cd-*.md"
  - "**/CI_CD_*.md"
---

# GitHub Actions Failure Debugging Workflow

## Prerequisites

Before debugging, ensure you have access to the GitHub MCP tools. Use `tool_search_tool_regex` to load:

- Search pattern: `^mcp_github_.*workflow|pull_request|commit`

## Systematic Debugging Process

### Phase 1: Gather Context

**Objective**: Understand what failed and when

1. **Identify the failing workflow(s)**
   - Use `mcp_github_list_pull_requests` to find the relevant PR (if applicable)
   - Use `mcp_github_pull_request_read` to get PR details and check statuses
   - Note which workflows are failing (test-suite, security-scan, code-quality, etc.)

2. **Get workflow run history**
   - Use `mcp_github_list_commits` to see recent commits
   - For each commit, check what workflows ran and their status
   - Identify if failure is consistent or intermittent

3. **Review recent changes**
   - Use `mcp_github_get_commit` to see what changed in the failing commit
   - Use `mcp_github_get_file_contents` to check workflow YAML files for recent modifications
   - Look for changes in: dependencies, configuration files, test files, workflow definitions

### Phase 2: Analyze Failures

**Objective**: Understand the root cause

4. **Get AI-powered failure summary** (most efficient approach)
   - Use `summarize_job_log_failures` tool to get intelligent analysis
   - This provides actionable insights without overwhelming context
   - Note: specific error messages, file names, line numbers, and failure patterns

5. **Retrieve detailed logs** (only if needed)
   - If summary is insufficient, use `get_job_logs` for specific job details
   - Use `get_workflow_run_logs` for complete workflow context
   - Focus on: error stack traces, exit codes, failed commands, timeout indicators

6. **Categorize the failure type**
   - **Test failures**: Which tests? New or existing? Flaky or consistent?
   - **Build/compilation errors**: Syntax errors, type errors, missing dependencies?
   - **Linting/formatting**: ESLint, TypeScript, Prettier violations?
   - **Timeout**: Job taking too long? Infinite loop? Slow tests?
   - **Environment issues**: Missing secrets, wrong Node version, DB connection?
   - **Dependency issues**: Package installation failures, version conflicts?

### Phase 3: Reproduce Locally

**Objective**: Confirm the issue in your environment

7. **Attempt local reproduction**
   - Check out the failing branch/commit
   - Run the exact commands from the workflow locally:
     - `npm install` or `npm ci` (check which one the workflow uses)
     - `npm run lint` (for linting failures)
     - `npm test` (for test failures)
     - `npm run build` (for build failures)
   - Use the same Node version as the workflow (check workflow YAML)
   - Set up the same environment variables and test database

8. **Document differences**
   - If it works locally but fails in CI: environment issue
   - If it fails locally too: code issue that needs fixing
   - If intermittent: potential race condition or timing issue

### Phase 4: Fix and Verify

**Objective**: Resolve the issue and prevent recurrence

9. **Implement the fix**
   - For test failures: fix the broken test or code
   - For linting: run `npm run lint:fix` and commit
   - For dependency issues: update package.json and package-lock.json
   - For environment issues: update workflow YAML or repository secrets
   - For flaky tests: add retries, increase timeouts, or mock sources of non-determinism

10. **Verify fix locally**
    - Run the full test suite: `npm test`
    - Run linting: `npm run lint`
    - Ensure all checks pass before pushing

11. **Push and monitor**
    - Push changes to the branch
    - Monitor workflow runs using `mcp_github_list_commits` and check status
    - If still failing, return to Phase 2 with new logs

12. **Update PR status** (if applicable)
    - Use `mcp_github_add_issue_comment` to document what was fixed
    - If fixing for someone else's PR, explain the issue and resolution

## Common Failure Patterns and Solutions

### Test Failures

- **Database state issues**: Check test isolation, fixtures, and cleanup
- **Timing/race conditions**: Add proper async/await, increase timeouts
- **Mock/stub issues**: Verify mocks are properly reset between tests
- **Environment differences**: Check environment variables, file paths

### Dependency Issues

- **Lock file mismatch**: Regenerate package-lock.json with `npm install`
- **Peer dependency conflicts**: Check npm warnings, update dependencies
- **Native module failures**: Verify Node version compatibility
- **Cache corruption**: Workflow may need cache invalidation

### Workflow Configuration

- **Wrong Node version**: Check `node-version` in workflow vs package.json `engines`
- **Missing secrets**: Verify all required secrets are configured in repository settings
- **Incorrect permissions**: Check workflow `permissions` block
- **Step dependencies**: Ensure steps run in correct order with proper conditionals

### Intermittent Failures

- **Network timeouts**: Add retries, increase timeout values
- **Parallel test conflicts**: Run tests serially or improve isolation
- **Resource contention**: Reduce concurrency, split into separate jobs
- **Flaky external dependencies**: Mock external services properly

## Preventive Measures

After fixing, consider:

- **Add workflow status badge** to README for visibility
- **Set up branch protection** to require passing workflows
- **Configure dependency updates** (Dependabot, Renovate)
- **Add retry logic** for flaky operations
- **Improve test isolation** to prevent state leakage
- **Document CI requirements** in CONTRIBUTING.md
- **Set up notifications** for workflow failures (Slack, email)

## Repository-Specific Notes

This repository has these workflows:

- `test-suite.yml` - Main test runner
- `test-coverage.yml` - Coverage reporting
- `code-quality.yml` - Linting and type checking
- `security-scan.yml` - Security vulnerability scanning

Common scripts (from package.json):

- `npm test` - Run all tests
- `npm run lint` - Check linting
- `npm run lint:fix` - Fix linting issues
- `npm run build` - Build TypeScript

Database setup for tests: `./setup-test-db.sh`

## Tool Reference

Required GitHub MCP tools:

- `mcp_github_list_pull_requests` - List PRs
- `mcp_github_pull_request_read` - Get PR details
- `mcp_github_list_commits` - List recent commits
- `mcp_github_get_commit` - Get commit details
- `mcp_github_get_file_contents` - Read workflow files
- `mcp_github_add_issue_comment` - Comment on PR
- `summarize_job_log_failures` - AI-powered log analysis (preferred)
- `get_job_logs` - Raw job logs (use sparingly)
- `get_workflow_run_logs` - Complete workflow logs (use sparingly)
