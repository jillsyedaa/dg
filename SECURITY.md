# Security Policy

## Vulnerability Management

### SVG Generation Dependencies

**Status**: ✅ Security vulnerabilities resolved

**Solution**: 
- Replaced vulnerable `svg-term-cli` (Node.js package) with modern `termsvg` (Go binary)
- [termsvg](https://github.com/MrMarble/termsvg) is actively maintained and has no npm dependencies
- SVG generation now uses system binary instead of vulnerable JavaScript packages

**Implementation**:
- No vulnerable npm packages in dependency tree

## Reporting Security Issues

Please report security vulnerabilities to the maintainers privately via GitHub security advisories or email. 