import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var mainWindow: MainWindow!
    var webViewController: WebViewController!
    var trayManager: TrayManager!
    var shortcutManager: ShortcutManager!

    func applicationDidFinishLaunching(_ notification: Notification) {
        print("[FreeCastNotes] App launching...")

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

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false // Keep running in tray
    }
}
