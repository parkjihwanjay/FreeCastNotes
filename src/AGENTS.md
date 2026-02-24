<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# src

## Purpose
Frontend application loaded inside `WKWebView`. It contains UI composition, editor behavior, state management, bridge calls to native Swift, and packaging helper scripts.

## Key Files
| File | Description |
|------|-------------|
| `main.tsx` | Frontend entrypoint. |
| `App.tsx` | Main app container and keyboard/action wiring. |
| `PreferencesApp.tsx` | Preferences window frontend. |
| `hooks/useEditor.ts` | TipTap editor initialization and extensions. |
| `stores/appStore.ts` | Zustand state and note lifecycle actions. |
| `lib/bridge.ts` | React-to-Swift bridge methods. |
| `styles/globals.css` | Global styles for the app shell and editor. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `components/` | UI feature components (see `components/AGENTS.md`). |
| `hooks/` | Reusable React hooks. |
| `lib/` | Storage, bridge, import/export, and utility functions (see `lib/AGENTS.md`). |
| `stores/` | Zustand store definitions. |
| `styles/` | Global CSS and shared styling rules. |
| `types/` | Shared TypeScript type definitions. |
| `scripts/` | Build/package helper scripts invoked from Makefile. |

## For AI Agents

### Working In This Directory
- Keep state transitions in `stores/appStore.ts` deterministic; avoid hidden side effects in components.
- Keep Markdown import/export and TipTap conversion logic symmetrical when possible.
- Prefer extending existing `lib/` helpers over duplicating parsing or serialization logic.
- If adding a new native capability, define it in `lib/bridge.ts` first and then implement matching Swift handlers.

### Testing Requirements
- Run `make check` for any TypeScript change.
- Run `make build` when `lib/bridge.ts` or note persistence behavior is modified.

### Common Patterns
- Debounced note persistence is managed in `App.tsx` + store actions.
- Sort/layout preferences are persisted in localStorage via `freecastnotes.prefs.v1`.
- Storage implementation is re-exported through `lib/db.ts` (currently vault mode).

## Dependencies

### Internal
- Depends on native bridge contracts in `swift-app/Sources/FreeCastNotes/`.

### External
- React, TipTap, Zustand, Tailwind, Vite runtime APIs.

<!-- MANUAL: -->
