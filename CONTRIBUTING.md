# Contributing to DeepGuide CLI (dg)

Thank you for your interest in contributing to dg! This document provides guidelines and information for contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, Node version, DG version)
- Output from `dg doctor --verbose`

### Suggesting Features

Feature suggestions are welcome! Please:

- Check existing feature requests first
- Clearly describe the problem and proposed solution
- Explain how this would benefit DG users
- Consider backward compatibility

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly** (see Testing section below)
5. **Commit with clear messages**: `git commit -m "Add amazing feature"`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Create a Pull Request**

## Development Setup

### Prerequisites

- Bun
- Git
- asciinema (for testing)

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/dg.git
cd dg

# Install dependencies
pnpm install

# Run in development mode
pnpm run dev init
pnpm run dev capture
pnpm run dev validate
```

### Testing Your Changes

#### Manual Testing
```bash
# Test all commands work
pnpm run dev init
pnpm run dev capture
pnpm run dev validate
pnpm run dev list
pnpm run dev doctor

# Test edge cases
pnpm run dev capture  # Try interactive commands
pnpm run dev validate # Test with failing commands
```

## Coding Standards

- Use TypeScript for all new code
- Provide proper type annotations
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions focused and small

## Testing Guidelines

Before submitting a PR, please test:

- [ ] `dg init` creates proper project structure
- [ ] `dg capture` records demos successfully  
- [ ] `dg validate` correctly validates demos
- [ ] `dg list` shows accurate status
- [ ] `dg doctor` provides useful diagnostics
- [ ] Error messages are helpful and actionable
- [ ] Works with both bundled and system asciinema

Thank you for making DeepGuide CLI better for everyone! 🎉
