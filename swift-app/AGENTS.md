<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-24 21:49 KST | Updated: 2026-02-24 21:49 KST -->

# swift-app

## Purpose
Native macOS host application implemented with Swift/AppKit. It owns window lifecycle, tray integration, global shortcut registration, native file dialogs, and React bridge handling through `WKWebView`.

## Key Files
| File | Description |
|------|-------------|
| `Package.swift` | SwiftPM manifest (target, platform, dependencies). |
| `Info.plist` | App bundle metadata and version values used in release flow. |
| `Package.resolved` | Locked Swift dependency versions. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `Sources/FreeCastNotes/` | Main app source (see `Sources/FreeCastNotes/AGENTS.md`). |
| `Resources/` | Runtime assets copied into app bundle (icons, tray images). |
| `.build/` | SwiftPM build artifacts (generated; do not hand-edit). |

## For AI Agents

### Working In This Directory
- Keep Swift and frontend bridge APIs aligned; mismatches break runtime features silently.
- Preserve dev/prod load behavior in web view controllers:
  - dev URL: `http://localhost:1420`
  - fallback/bundled `dist` load path for packaged app
- Version updates for releases should keep `Info.plist` and tags consistent (`src/scripts/update-version.sh` + Make targets).

### Testing Requirements
- Run `cd swift-app && swift build` for native-only changes.
- Run `make build` for bridge or end-to-end behavior changes.
- Run `make dmg` after packaging-related script or plist/resource changes.

### Common Patterns
- App stays resident after window close via tray behavior.
- Global shortcut registration persists in `UserDefaults`.
- Preferences window has its own web view controller and bridge surface.

## Dependencies

### Internal
- Interacts with frontend contracts defined in `src/lib/bridge.ts`.

### External
- AppKit, WebKit, ServiceManagement.
- HotKey package for global shortcut registration.

<!-- MANUAL: -->
