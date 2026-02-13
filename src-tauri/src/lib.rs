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

// CGS Private API declarations (macOS only)
#[cfg(target_os = "macos")]
mod cgs {
    pub type CGSConnectionID = i32;
    pub type CGSSpaceID = i32;
    pub type CGWindowID = u32;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        // Get connection to Window Server
        pub fn CGSMainConnectionID() -> CGSConnectionID;

        // Get current active space ID
        pub fn CGSGetActiveSpace(cid: CGSConnectionID) -> CGSSpaceID;

        // Add windows to specific spaces
        pub fn CGSAddWindowsToSpaces(
            cid: CGSConnectionID,
            windows: *const std::ffi::c_void,
            spaces: *const std::ffi::c_void,
        );

        // Remove windows from spaces (for future use)
        #[allow(dead_code)]
        pub fn CGSRemoveWindowsFromSpaces(
            cid: CGSConnectionID,
            windows: *const std::ffi::c_void,
            spaces: *const std::ffi::c_void,
        );
    }
}

// Helper function to get CGWindowID from Tauri WebviewWindow
#[cfg(target_os = "macos")]
fn get_window_id(webview_window: &tauri::WebviewWindow) -> Option<cgs::CGWindowID> {
    use std::sync::{Arc, Mutex};

    let window_id = Arc::new(Mutex::new(0u32));
    let window_id_clone = window_id.clone();

    let _ = webview_window.with_webview(move |webview| unsafe {
        let raw_window = webview.ns_window();
        if !raw_window.is_null() {
            let ns_window: &NSWindow = &*raw_window.cast();
            // NSWindow.windowNumber corresponds directly to CGWindowID
            let window_number = ns_window.windowNumber();
            *window_id_clone.lock().unwrap() = window_number as u32;
        }
    });

    let id = *window_id.lock().unwrap();
    if id != 0 {
        Some(id)
    } else {
        None
    }
}

// Helper function to create CFArray from i32 values
#[cfg(target_os = "macos")]
fn create_cf_array_from_i32(values: &[i32]) -> core_foundation::array::CFArray<core_foundation::number::CFNumber> {
    use core_foundation::number::CFNumber;
    use core_foundation::array::CFArray;

    let numbers: Vec<CFNumber> = values
        .iter()
        .map(|&value| CFNumber::from(value))
        .collect();

    CFArray::from_CFTypes(&numbers)
}

// Add window to the current active space using CGS APIs
#[cfg(target_os = "macos")]
fn add_window_to_current_space(window_id: cgs::CGWindowID) -> Result<(), String> {
    use core_foundation::base::TCFType;

    unsafe {
        // Get connection to Window Server
        let connection = cgs::CGSMainConnectionID();

        // Get currently active space
        let active_space = cgs::CGSGetActiveSpace(connection);

        if active_space <= 0 {
            return Err("Failed to get active space".to_string());
        }

        // Create CFArrays for windows and spaces
        let window_array = create_cf_array_from_i32(&[window_id as i32]);
        let space_array = create_cf_array_from_i32(&[active_space]);

        // Add window to the active space
        cgs::CGSAddWindowsToSpaces(
            connection,
            window_array.as_concrete_TypeRef() as *const std::ffi::c_void,
            space_array.as_concrete_TypeRef() as *const std::ffi::c_void,
        );

        Ok(())
    }
}

#[cfg(not(target_os = "macos"))]
fn add_window_to_current_space(_window_id: u32) -> Result<(), String> {
    Ok(())
}

fn clamp_f64(value: f64, min: f64, max: f64) -> f64 {
    if max < min {
        min
    } else {
        value.clamp(min, max)
    }
}

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
        // Hide window first to reset its state
        let _ = window.hide();

        // Position window near cursor (determines target screen)
        position_window_near_cursor(app, &window);

        // Configure window for overlay behavior
        #[cfg(target_os = "macos")]
        {
            let _ = window.with_webview(|webview| unsafe {
                let raw_window = webview.ns_window();
                if raw_window.is_null() {
                    return;
                }

                let ns_window: &NSWindow = &*raw_window.cast();

                // Set high window level (NSPopUpMenuWindowLevel)
                ns_window.setLevel(101);

                // Set collection behavior for fullscreen compatibility
                let behavior = NSWindowCollectionBehavior::FullScreenAuxiliary
                    | NSWindowCollectionBehavior::FullScreenAllowsTiling;
                ns_window.setCollectionBehavior(behavior);

                // Order window to front
                ns_window.orderFrontRegardless();
                ns_window.makeKeyAndOrderFront(None);
            });
        }

        // Show window
        let _ = window.set_always_on_top(true);
        let _ = window.show();
        let _ = window.set_focus();

        // CRITICAL: Use CGS to force window into current space
        #[cfg(target_os = "macos")]
        {
            if let Some(window_id) = get_window_id(&window) {
                if let Err(e) = add_window_to_current_space(window_id) {
                    log::warn!("Failed to add window to current space: {}", e);
                }
            }
        }
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
