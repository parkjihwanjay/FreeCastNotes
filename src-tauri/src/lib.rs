use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[cfg(target_os = "macos")]
use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};
use tauri::Emitter;
use tauri::Manager;
use tauri::PhysicalPosition;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};

const DEFAULT_GLOBAL_SHORTCUT: &str = "Alt+N";
const SHORTCUT_FILE_NAME: &str = "global-shortcut.txt";

struct ShortcutConfigState {
    current: Mutex<String>,
}

fn clamp_f64(value: f64, min: f64, max: f64) -> f64 {
    if max < min {
        min
    } else {
        value.clamp(min, max)
    }
}

#[cfg(target_os = "macos")]
fn configure_macos_overlay_behavior(window: &tauri::WebviewWindow) {
    let _ = window.with_webview(|webview| unsafe {
        let raw_window = webview.ns_window();
        if raw_window.is_null() {
            return;
        }

        let ns_window: &NSWindow = &*raw_window.cast();
        let mut behavior = ns_window.collectionBehavior();

        // REMOVED: CanJoinAllSpaces (conflicted with MoveToActiveSpace)
        behavior &= !NSWindowCollectionBehavior::CanJoinAllSpaces;

        // KEEP: These two work together for Raycast-like behavior
        behavior |= NSWindowCollectionBehavior::MoveToActiveSpace;
        behavior |= NSWindowCollectionBehavior::FullScreenAuxiliary;

        ns_window.setCollectionBehavior(behavior);
    });
}

#[cfg(not(target_os = "macos"))]
fn configure_macos_overlay_behavior(_window: &tauri::WebviewWindow) {}

fn position_window_near_cursor(app: &tauri::AppHandle, window: &tauri::WebviewWindow) {
    let Ok(cursor) = app.cursor_position() else {
        return;
    };

    let size = window
        .outer_size()
        .or_else(|_| window.inner_size())
        .ok();
    let Some(size) = size else {
        return;
    };

    let width = size.width as f64;
    let height = size.height as f64;
    let desired_x = cursor.x - (width / 2.0);
    let desired_y = cursor.y - 56.0;

    let monitor = window
        .monitor_from_point(cursor.x, cursor.y)
        .ok()
        .flatten()
        .or_else(|| window.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten());

    let (x, y) = if let Some(monitor) = monitor {
        let work_area = monitor.work_area();
        let work_x = work_area.position.x as f64;
        let work_y = work_area.position.y as f64;
        let work_w = work_area.size.width as f64;
        let work_h = work_area.size.height as f64;
        let margin = 14.0;

        let min_x = work_x + margin;
        let max_x = work_x + work_w - width - margin;
        let min_y = work_y + margin;
        let max_y = work_y + work_h - height - margin;

        (
            clamp_f64(desired_x, min_x, max_x),
            clamp_f64(desired_y, min_y, max_y),
        )
    } else {
        (desired_x, desired_y)
    };

    let _ = window.set_position(PhysicalPosition::new(
        x.round() as i32,
        y.round() as i32,
    ));
}

fn show_window_on_top(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        configure_macos_overlay_behavior(&window);
        let _ = window.set_always_on_top(true);
        let _ = window.set_visible_on_all_workspaces(true);
        let _ = window.unminimize();
        position_window_near_cursor(app, &window);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        let is_focused = window.is_focused().unwrap_or(false);
        if is_visible && is_focused {
            let _ = window.hide();
        } else {
            show_window_on_top(app);
        }
    }
}

fn shortcut_file_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join(SHORTCUT_FILE_NAME))
}

fn load_shortcut_from_disk(app: &tauri::AppHandle) -> Option<String> {
    let path = shortcut_file_path(app)?;
    let raw = fs::read_to_string(path).ok()?;
    let value = raw.trim().to_string();
    if value.is_empty() { None } else { Some(value) }
}

fn save_shortcut_to_disk(app: &tauri::AppHandle, shortcut: &str) -> Result<(), String> {
    let path = shortcut_file_path(app)
        .ok_or_else(|| "Could not resolve app config directory".to_string())?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Could not create config directory: {e}"))?;
    }

    fs::write(&path, shortcut).map_err(|e| format!("Could not save shortcut: {e}"))
}

fn register_global_shortcut(app: &tauri::AppHandle, shortcut: &str) -> Result<(), String> {
    let parsed: Shortcut = shortcut
        .parse()
        .map_err(|e| format!("Invalid shortcut '{shortcut}': {e}"))?;

    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to clear previous shortcut: {e}"))?;

    app.global_shortcut()
        .register(parsed)
        .map_err(|e| format!("Failed to register shortcut '{shortcut}': {e}"))
}

#[tauri::command]
fn get_global_shortcut(state: tauri::State<'_, ShortcutConfigState>) -> String {
    state.current.lock().unwrap().clone()
}

#[tauri::command]
fn set_global_shortcut(
    app: tauri::AppHandle,
    state: tauri::State<'_, ShortcutConfigState>,
    shortcut: String,
) -> Result<(), String> {
    let normalized = shortcut.trim().to_string();
    if normalized.is_empty() {
        return Err("Shortcut cannot be empty".to_string());
    }

    register_global_shortcut(&app, &normalized)?;
    save_shortcut_to_disk(&app, &normalized)?;
    *state.current.lock().unwrap() = normalized;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create notes tables",
        sql: "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                pin_order INTEGER NOT NULL DEFAULT -1
            );
            CREATE TABLE IF NOT EXISTS deleted_notes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                deleted_at TEXT NOT NULL,
                original_created_at TEXT NOT NULL
            );",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .manage(ShortcutConfigState {
            current: Mutex::new(DEFAULT_GLOBAL_SHORTCUT.to_string()),
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:notes.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_global_shortcut,
            set_global_shortcut
        ])
        .setup(|app| {
            // Hide app from Dock on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
                let _ = window.set_visible_on_all_workspaces(true);
            }

            // Register configured global shortcut (or fallback)
            let configured =
                load_shortcut_from_disk(app.handle()).unwrap_or_else(|| DEFAULT_GLOBAL_SHORTCUT.to_string());

            let state = app.state::<ShortcutConfigState>();
            match register_global_shortcut(app.handle(), &configured) {
                Ok(_) => {
                    *state.current.lock().unwrap() = configured.clone();
                    log::info!("Global shortcut registered: {}", configured);
                }
                Err(err) => {
                    log::warn!("Failed to register configured shortcut '{}': {}", configured, err);
                    if configured != DEFAULT_GLOBAL_SHORTCUT {
                        match register_global_shortcut(app.handle(), DEFAULT_GLOBAL_SHORTCUT) {
                            Ok(_) => {
                                *state.current.lock().unwrap() = DEFAULT_GLOBAL_SHORTCUT.to_string();
                                let _ = save_shortcut_to_disk(app.handle(), DEFAULT_GLOBAL_SHORTCUT);
                                log::info!("Fallback shortcut registered: {}", DEFAULT_GLOBAL_SHORTCUT);
                            }
                            Err(fallback_err) => {
                                log::warn!(
                                    "Failed to register fallback shortcut '{}': {}",
                                    DEFAULT_GLOBAL_SHORTCUT,
                                    fallback_err
                                );
                            }
                        }
                    }
                }
            }

            // System tray
            let show_hide =
                MenuItem::with_id(app, "show_hide", "Show/Hide Notes", true, None::<&str>)?;
            let new_note = MenuItem::with_id(app, "new_note", "New Note", true, None::<&str>)?;
            let set_shortcut = MenuItem::with_id(
                app,
                "set_shortcut",
                "Set Global Shortcut...",
                true,
                None::<&str>,
            )?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let about = MenuItem::with_id(app, "about", "About FreeCastNotes", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit FreeCastNotes", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[
                    &show_hide,
                    &new_note,
                    &set_shortcut,
                    &sep1,
                    &about,
                    &sep2,
                    &quit,
                ],
            )?;

            let _tray = TrayIconBuilder::new()
                .tooltip("FreeCastNotes")
                .icon(
                    app.default_window_icon()
                        .expect("missing default window icon")
                        .clone(),
                )
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show_hide" => toggle_window(app),
                    "new_note" => {
                        show_window_on_top(app);
                        let _ = app.emit("tray-new-note", ());
                    }
                    "set_shortcut" => {
                        show_window_on_top(app);
                        let _ = app.emit("tray-open-shortcut-settings", ());
                    }
                    "about" => {
                        show_window_on_top(app);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Logger (debug only)
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
