# FreeCastNotes

**The Raycast Notes experience, free and open source. Unlimited notes, zero cost.**

A fast, minimal, always-on-top notes app for macOS — inspired by [Raycast Notes](https://www.raycast.com/).

> Disclaimer: FreeCastNotes is **not affiliated with Raycast**. “Raycast” is a trademark of its respective owner.

## Why?

Raycast Notes is a beautifully designed scratchpad. But it's limited to **5 notes** on the free plan. FreeCastNotes removes that limit — giving you unlimited notes with the same keyboard-driven workflow, completely free and open source.

## Features

- **Instant access** — Global hotkey (`Option+N`, customizable) to show/hide from anywhere
- **Always on top** — Stays above other windows while you work
- **Space-aware** — Always appears on your *current* macOS Space (Spotlight-like)
- **Rich text editing** — Headings, bold, italic, code blocks, lists, task lists, blockquotes, links, images
- **Unlimited notes** — No artificial limits, all stored locally in a vault folder (Markdown files)
- **Command palette** (`Cmd+K`) — Search and execute any action
- **Browse notes** (`Cmd+P`) — Quick switcher with fuzzy search
- **Find & replace** (`Cmd+F`) — Search within notes with match highlighting
- **Pin notes** — Pin important notes to the top, access with `Cmd+1-9`
- **Images** — Insert via format bar, paste, or drag & drop; resize with corner handles
- **Import** — Import Markdown files as new notes
- **Export** — Copy as Markdown, HTML, or plain text; export current note to file (`Shift+Cmd+E` opens export options)
- **Preferences** (`Cmd+,`) — Dedicated Preferences window: vault location, layout, sort order, global shortcut, panel resize shortcuts, launch at login
- **Launch at login** — Option in Preferences to start FreeCast Notes when you log in
- **Split layout** (`Cmd+S`) — Toggle between single editor and sidebar + editor view
- **Keyboard panel resizing** — Resize focused panel/window with configurable shortcuts (defaults: `Option+Cmd+Arrow keys`)
- **System tray** — Menu bar icon with quick actions (Preferences, New Note, View, Quit)
- **Auto-sizing window** — Window grows/shrinks with content (toggle with `Shift+Cmd+/`)
- **Format bar** — Toggle visibility with `Option+Cmd+,`
- **Dark theme** — Native macOS dark appearance
- **Fully local** — All data stored on your machine, no cloud, no accounts

## Releases

See [CHANGELOG.md](CHANGELOG.md) for version history. **Current: v1.1.0.**

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

### Publishing a release (e.g. v1.1.0)

1. Update version in `package.json` if needed (e.g. `"version": "1.1.0"`).
2. Update [CHANGELOG.md](CHANGELOG.md) with the release date and any last-minute notes.
3. Build the DMG: `make dmg`
4. Commit and tag:
   ```bash
   git add -A && git commit -m "Release v1.1.0"
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin main && git push origin v1.1.0
   ```
5. On GitHub: [Releases](https://github.com/gastonmichelotti/FreeCastNotes/releases) → **Draft a new release** → choose tag `v1.1.0`, paste the changelog for that version, attach `build/FreeCastNotes.dmg`, and publish.

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
| `Option+N` | Show/Hide window (global, customizable in Preferences) |
| `Cmd+,` | Open Preferences |
| `Cmd+K` | Open command palette |
| `Cmd+P` | Browse notes |
| `Cmd+F` | Find in note |
| `Cmd+N` | New note |
| `Cmd+D` | Duplicate note |
| `Cmd+S` | Toggle split layout (single / sidebar + editor) |
| `Shift+Cmd+P` | Toggle pin |
| `Cmd+[` | Navigate back |
| `Cmd+]` | Navigate forward |
| `Cmd+1-9` | Jump to pinned note |
| `Shift+Cmd+/` | Toggle auto-sizing |
| `Option+Cmd+,` | Toggle format bar |
| `Option+Cmd+← / →` | Resize focused panel horizontally |
| `Option+Cmd+↑ / ↓` | Resize panel/window vertically |
| `Esc` | Hide window |

### Export
| Shortcut | Action |
|----------|--------|
| `Shift+Cmd+C` | Copy as Markdown |
| `Shift+Cmd+E` | Open command palette with Export submenu |

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

## Support

If FreeCastNotes saves you time, consider supporting development (pay what you want, suggested **$3**):

- Gumroad tip jar: https://michelotti2.gumroad.com/l/freecast

Downloads are always free on GitHub Releases:
- https://github.com/gastonmichelotti/FreeCastNotes/releases

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE)
