<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# FreeCastNotes

## Purpose
FreeCastNotes is a hybrid macOS desktop app that recreates the Raycast Notes workflow using a native Swift/AppKit shell and a React + TipTap editor loaded in `WKWebView`. Notes are stored locally in a vault folder as Markdown files with YAML frontmatter.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | Product overview, install/build instructions, shortcuts, architecture. |
| `Makefile` | Primary dev/build/release entrypoints (`make dev`, `make check`, `make build`, `make dmg`). |
| `package.json` | Frontend dependencies and scripts (Vite + TypeScript). |
| `src/App.tsx` | Main UI composition and editor lifecycle wiring. |
| `src/stores/appStore.ts` | Zustand app state and note actions. |
| `src/lib/bridge.ts` | Typed React-to-Swift bridge API surface. |
| `src/lib/vaultDb.ts` | Vault-backed note storage implementation (frontmatter + attachments). |
| `swift-app/Package.swift` | Swift package manifest (macOS target + HotKey dependency). |
| `swift-app/Sources/FreeCastNotes/WebViewController.swift` | WKWebView host + bridge message dispatcher. |
| `.github/workflows/build.yml` | CI build and release artifact workflow for DMG. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Frontend app source code (see `src/AGENTS.md`). |
| `swift-app/` | Native macOS shell and packaging resources (see `swift-app/AGENTS.md`). |
| `.github/workflows/` | CI pipeline definitions. |
| `FreeCast.iconset/` | Source icon assets for app icon generation. |
| `build/` | Generated app bundle and DMG artifacts (do not hand-edit). |
| `dist/` | Generated frontend build output (do not hand-edit). |
| `node_modules/` | Installed dependencies (do not hand-edit). |

## For AI Agents

### Working In This Repository
- Use `make` targets as the default interface for local workflows.
- When changing bridge behavior, update both sides of the contract:
  - TypeScript API in `src/lib/bridge.ts`
  - Swift handlers in `swift-app/Sources/FreeCastNotes/WebViewController.swift`
  - If preferences bridge is affected, also update `swift-app/Sources/FreeCastNotes/PreferencesWindowController.swift`
- Preserve vault file format compatibility (YAML frontmatter + markdown body) when touching note persistence.
- Keep macOS assumptions intact (`macOS 13+`, `WKWebView`, `NSStatusItem`, global shortcuts via HotKey).

### Testing Requirements
- Minimum frontend validation: `make check`
- For native or bridge changes: `make build`
- For packaging script changes: `make bundle` or `make dmg`

### Common Patterns
- Frontend state is centralized in Zustand (`src/stores/appStore.ts`).
- Note content is edited as TipTap JSON in-memory and persisted as Markdown.
- Swift runtime falls back from dev server (`http://localhost:1420`) to bundled `dist/` in production.

## Dependencies

### Internal
- `src/lib/` provides bridge, import/export, storage, migration, and utility helpers used by UI/store layers.
- `swift-app/Sources/FreeCastNotes/` provides native window, tray, shortcut, and bridge runtime.

### External
- React 19, TypeScript 5, Vite 7, Tailwind CSS v4
- TipTap 3 (rich text editor extensions)
- Zustand 5 (state management)
- HotKey (Swift global shortcut registration)

<!-- MANUAL: Add persistent project-specific notes below this line. -->
