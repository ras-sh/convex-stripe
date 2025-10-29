# @ras-sh/template-convex-component

⚡ Template for building Convex Components, sandboxed TypeScript modules that extend your backend safely.

## Features

- **TypeScript** - Full type safety with modern TS features
- **[Convex](https://convex.dev/)** - Realtime database and backend as a service
- **[Vitest](https://vitest.dev/)** - Fast unit testing with coverage reports
- **[Changesets](https://github.com/changesets/changesets)** - Automated version management and changelog generation
- **GitHub Actions** - Automated CI/CD workflows for testing and publishing

## Quick Start

```bash
pnpm install
pnpm dev:backend
```

## Building Your Component

1. Add component code in `src/component/`
2. Add client API in `src/client/`
3. Add tests in `src/test.ts`
4. Update `package.json` metadata (name, description, keywords, repository)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:backend` | Run Convex dev server with live component sources |
| `pnpm build:watch` | Watch and rebuild on changes |
| `pnpm build` | Build component with TypeScript |
| `pnpm test` | Run tests with vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm check-types` | Run TypeScript type checking |
| `pnpm check` | Run linter checks |
| `pnpm fix` | Auto-fix linting issues |
| `pnpm changeset` | Create a new changeset |
| `pnpm changeset:version` | Update versions based on changesets |
| `pnpm changeset:publish` | Build and publish to npm |

## Project Structure

```
src/
├── client/
│   ├── index.ts                # Public API (Component class)
│   └── types.ts                # Client types
├── component/
│   ├── convex.config.ts        # Component configuration
│   ├── schema.ts               # Database schema
│   ├── lib.ts                  # Queries and mutations
│   └── _generated/             # Generated types
├── react/
│   └── index.ts                # Optional React hooks
├── validators/
│   └── index.ts                # Optional shared validators
└── test.ts                     # Test utilities
.github/
├── workflows/
│   ├── ci.yml                  # CI workflow (lint, test, build)
│   └── release.yml             # Automated release workflow
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml          # Bug report template
│   └── feature_request.yml     # Feature request template
└── PULL_REQUEST_TEMPLATE.md   # PR template
```

## CI/CD

This template includes automated GitHub Actions workflows:

- **CI Workflow** - Runs on every PR and push to main
  - Linting with Biome
  - Type checking with TypeScript
  - Unit tests with Vitest
  - Build verification

- **Release Workflow** - Automated publishing with Changesets
  - Creates version bump PRs automatically
  - Publishes to npm when merged

### Setup for Automated Publishing

To enable automated npm publishing, add an `NPM_TOKEN` secret to your GitHub repository:

1. Create an npm access token at [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. Go to your GitHub repository settings → Secrets and variables → Actions
3. Add a new secret named `NPM_TOKEN` with your npm token

## Publishing

This template uses [Changesets](https://github.com/changesets/changesets) for version management.

### Manual Release

1. **Create a changeset** when you make changes:
   ```bash
   pnpm changeset
   ```
   Follow the prompts to describe your changes (patch, minor, or major).

2. **Commit and push your changes** including the changeset file

3. **Automated workflow will**:
   - Create a "Version Packages" PR with version bumps and changelog
   - When you merge that PR, automatically publish to npm

### Local Publishing (Alternative)

You can also publish manually:

```bash
pnpm changeset:version    # Update versions from changesets
pnpm changeset:publish    # Build and publish to npm
```

> **Note**: The `changeset:publish` script ensures all checks pass before publishing.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
