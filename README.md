# DeepGuide CLI


![Demo status](https://github.com/DeepGuide-Ai/dg/actions/workflows/dg-validate.yml/badge.svg) [![npm version](https://badge.fury.io/js/@deepguide-ai%2Fdg.svg)](https://www.npmjs.com/package/@deepguide-ai/dg) [![CI Status](https://github.com/deepguide-ai/dg/workflows/CI/badge.svg)](https://github.com/deepguide-ai/dg/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Transform your CLI documentation from static code blocks or heavy GIF/Video into **self-testing, interactive, lightweight demos** that stay current automatically.

## Use `dg` to capture your terminal session

> Captured using `dg`. We dogfood ourselves.

<!--Remove one image if your site handles dark-mode automatically-->
![Capture - light](/.dg/svg/capture-light.svg#gh-light-mode-only)
![Capture - dark](/.dg/svg/capture-dark.svg#gh-dark-mode-only)


**Quick Start** 

```bash
npx @deepguide-ai/dg init  # 30-second setup
dg capture                 # Record interactive demo
dg validate                # Test in CI - PR fails if broken
```

## Installation

### Via npm (recommended)

```bash
# Install globally
npm install -g @deepguide-ai/dg

# Or run without installing
npx @deepguide-ai/dg [command]
```

### Standalone Binary

Download the latest binary for your platform from the [releases page](https://github.com/DeepGuide-Ai/dg/releases).

### Verify Installation

```bash
dg doctor
```

This will check that all dependencies are properly installed.


## Core Commands

| Command | Purpose | Example |
|---------|---------|---------|
| **`dg init`** | Interactive setup wizard | `npx @deepguide-ai/dg init` |
| **`dg capture`** | Record CLI demos | `dg capture` |
| **`dg generate`** | Create SVG + markdown | `dg generate` |
| **`dg validate`** | Test demos in CI | `dg validate` |
| **`dg list`** | Show demo status | `dg list` |
| **`dg doctor`** | Environment diagnostics | `dg doctor` |


## FAQ

### **Q: What about GPL licensing concerns?**
**A:** asciinema is GPL3.0 license. Enterprise escape hatch available: `export DG_GPL_OFF=1` uses system asciinema installation instead of bundled binaries.

### **Q: How does validation work?**  
**A:** DG re-runs your original commands and compares exit codes + filtered output. Interactive demos are automatically skipped in CI.

### **Q: What platforms are supported?**
**A:** macOS (ARM64, x64), Linux (x64 glibc), Windows via WSL2. Platform-specific binaries auto-installed.

### **Q: How big are the generated assets?**
**A:** SVG demos are typically 50-100x smaller than equivalent GIFs.

## Examples in the Wild

See DG in action:
- **[Demo](https://github.com/deepguide-ai/dg-demo)** - Demo Project for dg

*Want your project listed? [Open a PR!](https://github.com/deepguide/dg/pulls)*

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md).

### Development Setup

```bash
git clone https://github.com/deepguide-ai/dg.git
cd dg
bun install
bun run dev
```

### Testing

```bash
bun test              # Unit tests
bun run test:e2e      # End-to-end tests  
bun run test:platforms # Cross-platform tests
```

## Support

- 🐛 **[Issues](https://github.com/deepguide/dg/issues)** - Bug reports and feature requests
- 💬 **[Discussions](https://github.com/deepguide/dg/discussions)** - Questions and community
- 📧 **[Email](mailto:support@deepguide.dev)** - Direct support

## License

**MIT** - The main CLI tool is MIT licensed for maximum compatibility.

Platform packages containing asciinema binaries are **GPL-3.0** licensed. Enterprise users can avoid GPL binaries with `DG_GPL_OFF=1`.

---

**Made with ❤️ by the [DeepGuide](https://deepguide.ai) team**

*Transform your CLI documentation from static to spectacular.* 