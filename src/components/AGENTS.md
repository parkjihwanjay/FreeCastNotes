<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# components

## Purpose
Feature-focused React UI modules for editing notes, navigation, actions, preferences, and app chrome.

## Key Files
| File | Description |
|------|-------------|
| `Editor/Editor.tsx` | TipTap editor host and editing surface. |
| `Editor/FormatBar.tsx` | Formatting controls for rich text actions. |
| `Editor/FindBar.tsx` | In-note find/replace UI. |
| `ActionPanel/ActionPanel.tsx` | Command/action palette UI. |
| `NotesBrowser/NotesBrowser.tsx` | Note quick-switch browser. |
| `NotesSidebar/NotesSidebar.tsx` | Split-layout note list sidebar. |
| `PreferencesPanel/PreferencesPanel.tsx` | Preferences UI content. |
| `ShortcutSettings/ShortcutSettings.tsx` | Global shortcut capture/edit flow. |
| `Toolbar/Toolbar.tsx` | Top toolbar and primary actions. |
| `TagBar/TagBar.tsx` | Tag management UI for notes. |
| `Toast/Toast.tsx` | Ephemeral notification UI. |
| `SplitLayout/SplitLayout.tsx` | Single/split layout wrapper. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `Editor/extensions/` | Custom TipTap extensions and extension styles. |

## For AI Agents

### Working In This Directory
- Keep keyboard shortcuts and command behavior consistent with `README.md` expectations.
- Avoid moving data/state logic into UI components when store or `lib/` is the better home.
- If editor behavior changes, verify extension interoperability in `Editor/extensions/`.

### Testing Requirements
- Run `make check` after any component or extension change.
- For editing behavior changes, run `make dev` and manually verify basic flows: create note, edit, search, export.

### Common Patterns
- Components are grouped by feature folder with local single-file entry components.
- App-level orchestration stays in `src/App.tsx`; components stay presentation/interaction focused.

## Dependencies

### Internal
- Uses shared state from `src/stores/appStore.ts`.
- Uses editor/bridge/storage helpers via `src/lib/`.

### External
- TipTap React APIs and extension ecosystem.

<!-- MANUAL: -->
