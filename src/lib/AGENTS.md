<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# lib

## Purpose
Core application logic shared by UI and state layers: native bridge messaging, vault-backed storage, migration, markdown/html conversion, export/import, and utility helpers.

## Key Files
| File | Description |
|------|-------------|
| `bridge.ts` | Typed bridge methods from React to Swift (`postMessage` / `call`). |
| `db.ts` | Storage entrypoint re-export (currently `vaultDb`). |
| `vaultDb.ts` | Note CRUD, sorting, frontmatter parsing, attachment extraction, deleted note handling. |
| `migration.ts` | One-time migration from legacy localStorage blob to vault markdown files. |
| `import.ts` | Markdown-to-HTML conversion for TipTap input. |
| `export.ts` | TipTap JSON-to-Markdown and export/copy utilities. |
| `imageUtils.ts` | Image validation/compression helpers. |
| `utils.ts` | Shared helpers like title extraction, character counting, relative time formatting. |

## For AI Agents

### Working In This Directory
- Treat `bridge.ts` and Swift handlers as a versioned contract; keep message names/payload shapes synchronized.
- Preserve frontmatter compatibility in `vaultDb.ts` (`id`, timestamps, tags, pin metadata).
- Be conservative when changing markdown conversion logic; round-trip regressions are easy to introduce.
- Keep migration logic idempotent and non-destructive.

### Testing Requirements
- Always run `make check`.
- Run `make build` for bridge, storage, migration, or import/export changes.
- Manually validate core flows in dev mode for risky changes:
  - load existing notes
  - create/edit/save note
  - image insert and reopen
  - import/export

### Common Patterns
- Fallback behavior is explicit when Swift bridge is unavailable (browser/dev context).
- Async bridge calls include explicit timeouts for native dialogs and file operations.
- Sorting keeps pinned notes first and applies configured order for the remainder.

## Dependencies

### Internal
- Used heavily by `src/stores/appStore.ts` and `src/App.tsx`.
- Bridge contracts terminate in `swift-app/Sources/FreeCastNotes/WebViewController.swift`.

### External
- Browser APIs (`localStorage`, clipboard, FileReader, canvas).
- TipTap editor JSON schema through `export.ts`.

<!-- MANUAL: -->
