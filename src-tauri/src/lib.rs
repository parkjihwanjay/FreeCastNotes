use tauri::Manager;
use tauri::Emitter;
use tauri::tray::TrayIconBuilder;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState, GlobalShortcutExt};

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            if window.is_focused().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.set_focus();
            }
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
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
        },
    ];

    tauri::Builder::default()
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
        .setup(|app| {
            // Hide app from Dock on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Register global shortcut ⌥N
            let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::KeyN);
            match app.global_shortcut().register(shortcut) {
                Ok(_) => log::info!("Global shortcut ⌥N registered"),
                Err(e) => log::warn!("Failed to register global shortcut ⌥N: {}", e),
            }

            // System tray
            let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide Notes", true, None::<&str>)?;
            let new_note = MenuItem::with_id(app, "new_note", "New Note", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let about = MenuItem::with_id(app, "about", "About FreeCastNotes", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit FreeCastNotes", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[
                &show_hide,
                &new_note,
                &sep1,
                &about,
                &sep2,
                &quit,
            ])?;

            let _tray = TrayIconBuilder::new()
                .tooltip("FreeCastNotes")
                .icon(app.default_window_icon().expect("missing default window icon").clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show_hide" => toggle_window(app),
                        "new_note" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            let _ = app.emit("tray-new-note", ());
                        }
                        "about" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
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
