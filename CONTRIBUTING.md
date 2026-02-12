# Contributing to FreeCastNotes

Thank you for your interest in contributing! This guide will help you get started.

## Reporting Bugs

1. Check [existing issues](https://github.com/nicobistolfi/FreeCastNotes/issues) to avoid duplicates
2. Open a new issue with:
   - macOS version
   - FreeCastNotes version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

## Proposing Features

1. Open an issue with the `feature` label
2. Describe the use case and expected behavior
3. If possible, reference how Raycast Notes or similar apps handle it

## Development Setup

### Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org/))
- **Rust** latest stable ([rustup.rs](https://rustup.rs/))
- **macOS** 11+ (Big Sur or later)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/FreeCastNotes.git
cd FreeCastNotes

# Install dependencies
npm install

# Start development server
npx tauri dev
```

This opens the app in development mode with hot-reload for the frontend.

### Project Structure

```
FreeCastNotes/
  src/                    # React frontend
    components/           # UI components
    hooks/                # Custom React hooks
    lib/                  # Utilities (db, export, utils)
    stores/               # Zustand state management
    styles/               # Global CSS
  src-tauri/              # Rust backend
    src/lib.rs            # Tauri app setup
    Cargo.toml            # Rust dependencies
    tauri.conf.json       # Tauri configuration
    capabilities/         # Tauri permission capabilities
```

### Build for Production

```bash
npx tauri build
```

Output is in `src-tauri/target/release/bundle/`.

## Coding Guidelines

- **TypeScript** for all frontend code — no `any` unless absolutely necessary
- **Tailwind CSS** for styling — avoid custom CSS when Tailwind classes suffice
- **Functional components** with hooks — no class components
- **Zustand** for shared state — keep component-local state in `useState`
- Keep files focused and small — split large components
- No unnecessary dependencies — prefer built-in APIs

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes with clear, focused commits
3. Ensure `npx tauri build` succeeds
4. Open a PR with:
   - Description of what changed and why
   - Screenshots for UI changes
   - Link to related issue (if any)
5. Wait for review — maintainers may request changes

## Code of Conduct

Be respectful and constructive. We're all here to build something great.
