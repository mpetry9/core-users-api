# Linting and Code Quality

This project uses **ESLint** and **Prettier** for code quality and consistent formatting.

## Tools Installed

- **ESLint** - TypeScript/JavaScript linter with industry-standard rules
- **Prettier** - Opinionated code formatter
- **Airbnb TypeScript Style Guide** - Base ruleset for best practices

## Available Commands

### Linting

```bash
# Check for linting errors across entire codebase
npm run lint

# Auto-fix linting errors where possible
npm run lint:fix
```

### Formatting

```bash
# Format all TypeScript, JSON, and Markdown files
npm run format

# Check if files are formatted correctly (without modifying)
npm run format:check
```

## Configuration Files

- [.eslintrc.json](.eslintrc.json) - ESLint rules and configuration
- [.prettierrc.json](.prettierrc.json) - Prettier formatting rules
- [.prettierignore](.prettierignore) - Files excluded from formatting
- [tsconfig.eslint.json](tsconfig.eslint.json) - TypeScript config for ESLint (includes test files)
- [.vscode/settings.json](.vscode/settings.json) - VS Code integration for auto-formatting

## Editor Integration

If you're using **VS Code**, the workspace is configured to:

- Auto-format files on save using Prettier
- Auto-fix ESLint issues on save
- Show linting errors inline

Make sure you have these VS Code extensions installed:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Code Style Rules

### General

- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **Indentation**: 2 spaces
- **Line width**: 80 characters
- **Trailing commas**: Always (where valid in ES5)

### Import Order

Imports are automatically organized in this order:

1. Built-in Node.js modules (`fs`, `path`, etc.)
2. External packages (`express`, `bcrypt`, etc.)
3. Internal modules (your project files)

### TypeScript

- Unused variables/parameters must be prefixed with `_`
- Avoid using `any` type - use specific types instead
- Use `Record<string, never>` for empty objects instead of `{}`
- Console statements generate warnings (use `console.warn` or `console.error`)

## Current Status

After setup, the linter found the following types of issues:

- Import order inconsistencies
- Some `{}` type usage (should use more specific types)
- Unused variables and imports
- Console statement warnings

### Quick Fix

Run this to automatically fix many issues:

```bash
npm run lint:fix && npm run format
```

This will:

1. Auto-fix import order, spacing, and other auto-fixable ESLint issues
2. Format all code consistently with Prettier

Some issues will need manual fixing:

- Type improvements (`{}` → `Record<string, never>` or proper types)
- Removing unused variables/imports
- Refactoring console statements

## CI/CD Integration (Optional)

To enforce code quality in your CI/CD pipeline, add these checks:

```yaml
# Example GitHub Actions
- name: Lint code
  run: npm run lint

- name: Check formatting
  run: npm run format:check
```

## Pre-commit Hooks (Optional)

To automatically lint and format code before each commit, you can install Git hooks:

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Create pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Troubleshooting

### ESLint TypeScript Version Warning

If you see warnings about TypeScript version compatibility, this is usually safe to ignore. ESLint supports TypeScript 4.7.4 - 5.5.x officially, but works fine with 5.9.x.

### Parsing Errors

If ESLint can't parse files, ensure:

- Files are included in `tsconfig.eslint.json`
- TypeScript syntax is valid
- All required dependencies are installed

### Conflicting Rules

Prettier and ESLint are configured to work together via `eslint-config-prettier`, which disables conflicting ESLint formatting rules.

## Resources

- [ESLint Documentation](https://eslint.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/)
- [Airbnb Style Guide](https://github.com/airbnb/javascript)
