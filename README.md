# FreeCastNotes

**The Raycast Notes experience, free and open source. Unlimited notes, zero cost.**

A fast, minimal, always-on-top notes app for macOS — inspired by [Raycast Notes](https://www.raycast.com/).

## Why?

Raycast Notes is a beautifully designed scratchpad. But it's limited to **5 notes** on the free plan. FreeCastNotes removes that limit — giving you unlimited notes with the same keyboard-driven workflow, completely free and open source.

## Features

- **Instant access** — Global hotkey (`Option+N`) to show/hide from anywhere
- **Always on top** — Stays above other windows while you work
- **Rich text editing** — Headings, bold, italic, code blocks, lists, task lists, blockquotes, links
- **Unlimited notes** — No artificial limits, all stored locally
- **Command palette** (`Cmd+K`) — Search and execute any action
- **Browse notes** (`Cmd+P`) — Quick switcher with fuzzy search
- **Find & replace** (`Cmd+F`) — Search within notes with match highlighting
- **Pin notes** — Pin important notes to the top, access with `Cmd+1-9`
- **Export** — Copy as Markdown, HTML, or plain text; export to file
- **Deeplinks** — `freecastnotes://note/{id}` to open specific notes
- **System tray** — Menu bar icon with quick actions
- **Auto-sizing window** — Window grows/shrinks with content
- **Dark theme** — Native macOS dark appearance
- **Fully local** — All data stored on your machine, no cloud, no accounts

## Installation

### Download

Download the latest `.dmg` from the [Releases](https://github.com/nicobistolfi/FreeCastNotes/releases) page.

### Build from source

**Prerequisites:**
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (latest stable)
- macOS 11+

```bash
# Clone the repo
git clone https://github.com/nicobistolfi/FreeCastNotes.git
cd FreeCastNotes

# Install dependencies
npm install

# Run in development
npx tauri dev

# Build for production
npx tauri build
```

The built `.app` and `.dmg` will be in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

### General
| Shortcut | Action |
|----------|--------|
| `Option+N` | Show/Hide window (global) |
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
| `Shift+Cmd+D` | Copy deeplink |

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

- **[Tauri v2](https://tauri.app/)** — Lightweight native app framework
- **[React 19](https://react.dev/)** — UI library
- **[TipTap](https://tiptap.dev/)** — Rich text editor (ProseMirror-based)
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Zustand](https://zustand.docs.pmnd.rs/)** — State management
- **SQLite** — Local persistence (via tauri-plugin-sql)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE)
