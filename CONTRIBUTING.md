# Contributing

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. **Fork and clone the repository**

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Install git hooks**
   ```bash
   pnpm lefthook install
   ```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure code quality:
   ```bash
   pnpm check        # Run linter
   pnpm check-types  # Type check
   pnpm test         # Run tests
   ```

3. **Create a changeset** (if applicable)
   ```bash
   pnpm changeset
   ```
   Follow the prompts to describe your changes.

### Code Standards

- **Linting**: We use Biome for code formatting and linting
- **Type Safety**: All code must pass TypeScript type checking
- **Testing**: Add tests for new features or bug fixes
- **Commit Messages**: Use clear, descriptive commit messages

### Pre-commit Hooks

Git hooks will automatically run on commit:
- **Lint**: Auto-fix code style issues
- **Type check**: Verify TypeScript types

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Pull Request Process

1. **Update documentation** if needed
2. **Ensure all tests pass** and linting is clean
3. **Create a changeset** for your changes
4. **Open a pull request** with a clear description
5. **Address review feedback** if any

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Changeset created (if applicable)
- [ ] No new warnings or errors

## Questions?

Feel free to open an issue for any questions or concerns!
