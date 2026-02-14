# FreeCastNotes

**The Raycast Notes experience, free and open source. Unlimited notes, zero cost.**

A fast, minimal, always-on-top notes app for macOS — inspired by [Raycast Notes](https://www.raycast.com/).

> Disclaimer: FreeCastNotes is **not affiliated with Raycast**. “Raycast” is a trademark of its respective owner.

## Why?

Raycast Notes is a beautifully designed scratchpad. But it's limited to **5 notes** on the free plan. FreeCastNotes removes that limit — giving you unlimited notes with the same keyboard-driven workflow, completely free and open source.

## Features

- **Instant access** — Global hotkey (`Option+N`) to show/hide from anywhere
- **Always on top** — Stays above other windows while you work
- **Space-aware** — Always appears on your *current* macOS Space (Spotlight-like)
- **Rich text editing** — Headings, bold, italic, code blocks, lists, task lists, blockquotes, links
- **Unlimited notes** — No artificial limits, all stored locally
- **Command palette** (`Cmd+K`) — Search and execute any action
- **Browse notes** (`Cmd+P`) — Quick switcher with fuzzy search
- **Find & replace** (`Cmd+F`) — Search within notes with match highlighting
- **Pin notes** — Pin important notes to the top, access with `Cmd+1-9`
- **Export** — Copy as Markdown, HTML, or plain text; export to file
- **System tray** — Menu bar icon with quick actions
- **Auto-sizing window** — Window grows/shrinks with content
- **Dark theme** — Native macOS dark appearance
- **Fully local** — All data stored on your machine, no cloud, no accounts

## Installation

### Download

Download the latest `FreeCastNotes-*.dmg` from the [Releases](https://github.com/gastonmichelotti/FreeCastNotes/releases) page.

Open the DMG and drag **FreeCastNotes** to your **Applications** folder.

> Note: the app is currently **not notarized/signed**, so macOS Gatekeeper may block the first launch. If that happens: right‑click the app → **Open** → **Open**.

### Build from source

**Prerequisites:**
- [Node.js](https://nodejs.org/) 18+
- Swift 5.9+ (included with Xcode or Xcode Command Line Tools)
- macOS 13+

```bash
# Clone the repo
git clone https://github.com/gastonmichelotti/FreeCastNotes.git
cd FreeCastNotes

# Install dependencies
make install

# Run in development (Vite + Swift)
make dev

# Build .app bundle
make bundle

# Build .dmg for distribution
make dmg
```

The `.app` and `.dmg` will be in the `build/` directory.

### Makefile commands

| Command | Description |
|---------|-------------|
| `make dev` | Run in dev mode (Vite HMR + Swift) |
| `make dev-front` | Run only the frontend (Vite on :1420) |
| `make dev-swift` | Run only the Swift app (needs Vite running) |
| `make build` | Production build (frontend + Swift release) |
| `make bundle` | Generate `FreeCastNotes.app` |
| `make dmg` | Generate `FreeCastNotes.dmg` |
| `make check` | Type-check frontend |
| `make install` | Install npm + Swift dependencies |
| `make clean` | Clean all build artifacts |
| `make kill` | Kill running processes |
| `make open` | Launch the built app |

## Keyboard Shortcuts

### General
| Shortcut | Action |
|----------|--------|
| `Option+N` | Show/Hide window (global, customizable) |
| `Cmd+K` | Open command palette |
| `Cmd+P` | Browse notes |
| `Cmd+F` | Find in note |
| `Cmd+N` | New note |
| `Cmd+D` | Duplicate note |
| `Shift+Cmd+P` | Toggle pin |
| `Cmd+[` | Navigate back |
| `Cmd+]` | Navigate forward |
| `Cmd+1-9` | Jump to pinned note |
| `Shift+Cmd+/` | Toggle auto-sizing |
| `Esc` | Hide window |

### Export
| Shortcut | Action |
|----------|--------|
| `Shift+Cmd+C` | Copy as Markdown |
| `Shift+Cmd+E` | Export to file |

### Formatting
| Shortcut | Action |
|----------|--------|
| `Cmd+B` | Bold |
| `Cmd+I` | Italic |
| `Cmd+U` | Underline |
| `Shift+Cmd+S` | Strikethrough |
| `Option+Cmd+1/2/3` | Heading 1/2/3 |
| `Option+Cmd+C` | Code block |
| `Shift+Cmd+B` | Blockquote |
| `Shift+Cmd+8` | Bullet list |
| `Shift+Cmd+7` | Ordered list |
| `Shift+Cmd+9` | Task list |

## Tech Stack

- **Swift + AppKit** — Native macOS shell with `NSWindow` and `WKWebView`
- **[React 19](https://react.dev/)** — UI rendered in WKWebView
- **[TipTap](https://tiptap.dev/)** — Rich text editor (ProseMirror-based)
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Zustand](https://zustand.docs.pmnd.rs/)** — State management
- **[Vite](https://vite.dev/)** — Frontend build tool
- **[HotKey](https://github.com/soffes/HotKey)** — Global keyboard shortcuts

### Architecture

FreeCastNotes uses a hybrid architecture: a native Swift shell provides the macOS window management, system tray, and global shortcuts, while the UI is a React app running inside a `WKWebView`. Communication between Swift and React happens through a bidirectional JavaScript bridge.

This approach gives us the best of both worlds: native macOS windowing behavior (Spotlight-like Space handling, tray, global hotkeys) with a modern, fast UI framework.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE)
