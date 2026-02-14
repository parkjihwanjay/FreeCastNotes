# Contributing to FreeCastNotes

Thanks for your interest in contributing!

## Reporting Bugs

1. Check existing issues to avoid duplicates:
   - https://github.com/gastonmichelotti/FreeCastNotes/issues
2. Open a new issue with:
   - macOS version
   - FreeCastNotes version (from the app)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots / screen recording if helpful

## Proposing Features

1. Open an issue describing the use case and expected behavior
2. If relevant, reference how Raycast Notes (or similar apps) behave

## Development Setup

### Prerequisites

- **macOS 13+**
- **Node.js 18+**
- **Xcode** (or Xcode Command Line Tools)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/FreeCastNotes.git
cd FreeCastNotes

# Install dependencies
make install

# Run in development (Vite + Swift)
make dev
```

### Useful commands

```bash
make check   # type-check frontend
make build   # production build (frontend + Swift release)
make bundle  # create FreeCastNotes.app in build/
make dmg     # create FreeCastNotes.dmg in build/
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make focused commits with clear messages
3. Ensure:
   - `make check` passes
   - `make dmg` works locally
4. Open a PR with:
   - What changed and why
   - Screenshots for UI changes
   - Link to related issue (if any)

## Code of Conduct

Be respectful and constructive. We're all here to build something useful.
