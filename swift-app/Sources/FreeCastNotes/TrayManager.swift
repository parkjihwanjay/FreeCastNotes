import AppKit

class TrayManager {
    private var statusItem: NSStatusItem!
    private weak var window: MainWindow?
    private weak var webViewController: WebViewController?

    init(window: MainWindow, webViewController: WebViewController) {
        self.window = window
        self.webViewController = webViewController

        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem.button {
            // Load tray icon from bundle Resources or adjacent Resources folder
            let icon = Self.loadTrayIcon()
            if let icon = icon {
                icon.size = NSSize(width: 18, height: 18)
                icon.isTemplate = true
                button.image = icon
            } else {
                button.title = "FCN"
            }
            button.action = #selector(trayClicked)
            button.target = self
        }

        buildMenu()
    }

    private func buildMenu() {
        let menu = NSMenu()

        let showItem = NSMenuItem(title: "Show/Hide Notes", action: #selector(toggleWindow), keyEquivalent: "")
        showItem.target = self
        menu.addItem(showItem)

        let newNoteItem = NSMenuItem(title: "New Note", action: #selector(newNote), keyEquivalent: "")
        newNoteItem.target = self
        menu.addItem(newNoteItem)

        let shortcutItem = NSMenuItem(title: "Set Global Shortcut...", action: #selector(openShortcutSettings), keyEquivalent: "")
        shortcutItem.target = self
        menu.addItem(shortcutItem)

        menu.addItem(NSMenuItem.separator())

        let aboutItem = NSMenuItem(title: "About FreeCastNotes", action: #selector(showAbout), keyEquivalent: "")
        aboutItem.target = self
        menu.addItem(aboutItem)

        menu.addItem(NSMenuItem.separator())

        let quitItem = NSMenuItem(title: "Quit FreeCastNotes", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)

        statusItem.menu = menu
    }

    @objc private func trayClicked() {
        toggleWindow()
    }

    @objc private func toggleWindow() {
        guard let window = window else { return }
        WindowPositioner.toggle(window)
    }

    @objc private func newNote() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-new-note")
    }

    @objc private func openShortcutSettings() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-open-shortcut-settings")
    }

    @objc private func showAbout() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
    }

    @objc private func quitApp() {
        NSApp.terminate(nil)
    }

    /// Load tray icon from .app bundle Resources or from dev Resources folder
    private static func loadTrayIcon() -> NSImage? {
        // 1. Try .app bundle (production): Contents/Resources/tray-icon@2x.png
        if let bundlePath = Bundle.main.resourcePath {
            let retina = (bundlePath as NSString).appendingPathComponent("tray-icon@2x.png")
            if let img = NSImage(contentsOfFile: retina) { return img }
            let normal = (bundlePath as NSString).appendingPathComponent("tray-icon.png")
            if let img = NSImage(contentsOfFile: normal) { return img }
        }

        // 2. Try relative to binary (dev): ../Resources/tray-icon.png
        let binaryURL = URL(fileURLWithPath: ProcessInfo.processInfo.arguments[0])
        let devResources = binaryURL
            .deletingLastPathComponent() // .build/debug/
            .deletingLastPathComponent() // .build/
            .deletingLastPathComponent() // swift-app/
            .appendingPathComponent("Resources")
        let devRetina = devResources.appendingPathComponent("tray-icon@2x.png").path
        if let img = NSImage(contentsOfFile: devRetina) { return img }
        let devNormal = devResources.appendingPathComponent("tray-icon.png").path
        if let img = NSImage(contentsOfFile: devNormal) { return img }

        return nil
    }
}
