<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# FreeCastNotes (Swift Sources)

## Purpose
Native runtime source for the macOS app: app bootstrap, window behavior, tray menu, shortcut handling, preferences window, and JS bridge processing between `WKWebView` and frontend code.

## Key Files
| File | Description |
|------|-------------|
| `main.swift` | Application entrypoint and activation policy setup. |
| `AppDelegate.swift` | App composition and main object wiring. |
| `MainWindow.swift` | Floating borderless window config and Space behavior. |
| `WebViewController.swift` | Main web view lifecycle and bridge message handlers. |
| `PreferencesWindowController.swift` | Separate preferences window web view and subset bridge handlers. |
| `TrayManager.swift` | Status bar item and menu actions. |
| `ShortcutManager.swift` | Global hotkey parsing/registration/persistence. |
| `WindowPositioner.swift` | Show/hide/toggle positioning behavior. |

## For AI Agents

### Working In This Directory
- When adding bridge messages:
  - implement in `WebViewController.swift`
  - add corresponding API in `src/lib/bridge.ts`
  - if used by preferences window, mirror logic in `PreferencesWindowController.swift`
- Keep thread-sensitive UI operations on main queue where required.
- Avoid changing window behavior flags (`collectionBehavior`, floating level) unless intentionally altering UX semantics.
- Keep shortcut parsing backward compatible with existing stored values.

### Testing Requirements
- Run `cd swift-app && swift build`.
- For bridge-affecting changes, run `make build` and smoke test:
  - window show/hide toggle
  - global shortcut update
  - preferences open/close
  - vault load/write actions

### Common Patterns
- Bridge replies return results via call IDs for async request/response.
- Tray actions often call into web content via evaluated JavaScript.
- App is accessory-style (no dock icon) and intended to stay active in menu bar.

## Dependencies

### Internal
- Relies on frontend-side bridge consumers in `src/lib/bridge.ts`.

### External
- `HotKey` for keyboard hooks.
- AppKit/WebKit/ServiceManagement APIs.

<!-- MANUAL: -->
