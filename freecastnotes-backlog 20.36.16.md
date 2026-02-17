# FreeCastNotes — Prioritized Backlog (based on r/raycastapp research)

Decisions locked in (per Gato):
- Hotkey/window focus behavior: **last window used** by default, but **configurable**.
- Markdown export images: **Option A** — export images to an `attachments/` folder and reference them from Markdown.
- Organization: **tags only** (no folders for now).

Labels suggested: `P0`, `P1`, `P2`, plus `area:swift`, `area:react`, `area:data`, `ux`, `export`, `integration`, `writer-mode`.

---

## P0 — Core UX & workflow (make it feel “Raycast-level”)

### 1) Multi-window notes (multiple notes open at the same time)
**Why:** Users explicitly want 2–3 floating notes visible simultaneously.

**Scope:**
- Support **multiple windows**, each bound to a specific note id.
- Actions:
  - `New Window`
  - `Open Note in New Window`
  - `Detach Current Note to New Window`
- Window menu: list open windows (by note title).

**Hotkey behavior (locked decision):**
- Global hotkey toggles **last window used** (LWU).
- Preferences option: `Hotkey targets: Last window used | Main window only`.

**Acceptance criteria:**
- Can open 2+ windows, each on different notes, editing independently.
- Closing a window doesn’t quit app (menu bar stays).
- Global hotkey shows/hides LWU window reliably.

**Implementation notes:**
- Swift/AppKit: one `NSWindow` per note. Persist `windowId -> noteId` mapping.
- React/WKWebView: simplest is 1 WKWebView per window.

---

### 2) Configurable Split Layout (Single vs Split) + Preferences entry in menu bar
**Why:** People want AI-like UI: list + editor. Others want a minimal single-note view.

**Scope:**
- Add **two UI modes**:
  - `Single` (editor only)
  - `Split` (left list + right editor)
- Make it configurable via:
  - Menu bar: `Preferences…` + `View → Layout → Single/Split`
  - Command Palette: `Toggle Split Layout`
- Remember split ratio.

**Acceptance criteria:**
- Switching layout is instant and does not lose editor state.
- Split divider is draggable and persists.
- List shows pinned + recent + search.

**Implementation notes:**
- Add preferences window/panel via menu bar `NSStatusItem`.
- Persist setting in UserDefaults and expose to React through the bridge.

---

### 3) Always-on-top control per window (Sticky/Normal) + minimize behavior
**Why:** Users want to turn off always-on-top, and they want to minimize/hide reliably.

**Scope:**
- Per-window toggle: `Always on Top`.
- Preferences: default for new windows.
- Command Palette: `Toggle Always on Top`.

**Acceptance criteria:**
- Toggling always-on-top updates live without recreating the window.
- Minimize/restore works without focus bugs.
- Setting persists per-window for the session; optional persist per-note.

---

### 4) Resizable windows + remember size/position (global default + optional per-note)
**Why:** Raycast users ask for resizing/layout control and remembering it.

**Scope:**
- Allow resize in all modes.
- Preferences:
  - `Remember window frame: Off/On`
  - `When On: remember per-note frame`
- Menu bar: `Reset Window Size/Position`.

**Acceptance criteria:**
- Frame persists across relaunch.
- If remember-per-note is enabled: reopening a note restores its frame.
- If disabled: windows use global default frame.

---

### 5) Sort notes by Last Modified (default)
**Why:** Requested explicitly; keeps “active” notes at top.

**Scope:**
- Default ordering: `updatedAt desc`.
- Preferences option: `Sort by: Last Modified | Last Opened | Title`.
- Pinned always above.

**Acceptance criteria:**
- Editing a note bumps it to top (unless pinned rules override).
- Cmd+P / quick switcher respects sort.

---

### 6) Deep links per note + “Copy Deep Link”
**Why:** Enables Quicklinks + hotkeys workflows.

**Scope:**
- Scheme: `freecastnotes://note/<id>`
- Actions:
  - `Copy Note Deep Link`
  - `Open Deep Link…` (optional)
- On deep link open: focus app and open note (use LWU window, or new window based on preference).

**Acceptance criteria:**
- Deep link opens correct note when app is running.
- Deep link launches app and opens note when closed.
- Note ids are stable.

---

### 7) Paste image via Cmd+V (robust) + consistent image insertion
**Why:** Users ask specifically for Cmd+V image in notes.

**Scope:**
- If clipboard has image: insert inline image at cursor.
- If clipboard has image files: import/copy and insert.
- Preserve current behavior for text/URLs.

**Acceptance criteria:**
- Screenshot paste works 100%.
- Drag & drop still works.
- Undo/redo works around image inserts.

---

## P1 — Organization + writing modes + portability

### 8) Tags (tags-only) + filter/search integration
**Why:** Organization is the next pain once notes scale.

**Scope (MVP):**
- `tags: string[]` on note model.
- Commands:
  - `Add Tag…`, `Remove Tag…`
  - `Filter by Tag…`
- In Split mode: show Tag list in sidebar section.

**Acceptance criteria:**
- Assign/remove tags quickly via Cmd+K.
- Search considers tags.
- Export includes tags in frontmatter.

---

### 9) Fullscreen / Distraction-free writing mode
**Why:** Explicit request; makes Notes usable for long-form.

**Scope:**
- Toggle `Fullscreen Writing Mode`.
- Hide side chrome; optionally hide toolbar.

**Acceptance criteria:**
- Fullscreen toggles smoothly.
- Cursor/scroll position preserved.

---

### 10) Typewriter scrolling (optional)
**Why:** Explicit request for writer comfort.

**Scope:**
- Preference toggle + Cmd+K action.
- Keep active line near center while typing.

**Acceptance criteria:**
- No jank while typing.
- Doesn’t break selection or images.

---

### 11) Fleeting Notes mode (auto-archive / cleanup)
**Why:** Many use notes for 1–2 days; need cleanup.

**Scope (safe MVP):**
- Preference: `Fleeting mode: Off/On`.
- Notes created when On get `fleeting=true`.
- Command: `Archive Fleeting Notes Older Than… (N days)`.
- Filter: `All | Fleeting | Archived`.

**Acceptance criteria:**
- Batch archive works.
- Nothing is deleted silently.

---

### 12) Batch export all notes to Markdown (+ attachments)
**Why:** Requested directly; builds trust.

**Locked decision for images:**
- Export images into `attachments/` and reference from Markdown with relative paths.

**Scope:**
- Command: `Export All Notes…`
- Options:
  - Destination folder
  - Filename strategy to avoid collisions (include note id)
  - Include frontmatter: id, createdAt, updatedAt, tags, pinned

**Acceptance criteria:**
- Exports all notes in one operation.
- No filename collisions.
- Images exported and referenced correctly.

---

### 13) Storage transparency: reveal location + backup guidance
**Why:** Users ask “where is it stored?” and want backups.

**Scope:**
- Menu/Preferences:
  - `Reveal Notes Storage in Finder`
  - `Copy Storage Path`
- Docs: short “Backup & Restore” section.

**Acceptance criteria:**
- User can find storage folder instantly.
- Migration/backups documented.

---

## P2 — Big win, bigger scope

### 14) Vault mode (file-backed notes folder, each note = .md) + migration
**Why:** Local-first purists want `.md` storage and sync via iCloud/Dropbox/Git.

**Scope:**
- Preference: `Storage Mode: Internal | Vault Folder`.
- Vault mode:
  - each note stored as `.md` with frontmatter
  - images stored in per-note attachments folder, referenced relatively
- Migration tool: Internal → Vault.
- Best-effort reload if files change externally.

**Acceptance criteria:**
- Create/edit note updates file.
- Migration is one-shot and non-destructive.
- Works with hundreds of notes without becoming slow.
