import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var mainWindow: MainWindow!
    var webViewController: WebViewController!
    var trayManager: TrayManager!
    var shortcutManager: ShortcutManager!

    func applicationDidFinishLaunching(_ notification: Notification) {
        print("[FreeCastNotes] App launching...")

        // Edit menu — required for Cmd+C/V/X/A to work in WKWebView
        setupEditMenu()

        mainWindow = MainWindow()
        webViewController = WebViewController(window: mainWindow)
        mainWindow.contentViewController = webViewController

        trayManager = TrayManager(window: mainWindow, webViewController: webViewController)
        shortcutManager = ShortcutManager(window: mainWindow)

        // Connect shortcut manager to web view controller for IPC
        webViewController.setShortcutManager(shortcutManager)

        // Show window on launch
        mainWindow.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        print("[FreeCastNotes] Window shown. Frame: \(mainWindow.frame)")
    }

    private func setupEditMenu() {
        let mainMenu = NSMenu()

        // App menu (required as first item)
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)

        // Edit menu — connects Cut/Copy/Paste/SelectAll to the responder chain
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        NSApp.mainMenu = mainMenu
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false // Keep running in tray
    }
}
