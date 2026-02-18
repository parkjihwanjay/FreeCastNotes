import AppKit

class TrayManager {
    private var statusItem: NSStatusItem!
    private weak var window: MainWindow?
    private weak var webViewController: WebViewController?

    private var currentLayoutMode = "single"
    private var singleLayoutItem: NSMenuItem?
    private var splitLayoutItem: NSMenuItem?

    init(window: MainWindow, webViewController: WebViewController) {
        self.window = window
        self.webViewController = webViewController

        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem.button {
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

        // Show/Hide
        let showItem = NSMenuItem(title: "Show/Hide Notes", action: #selector(toggleWindow), keyEquivalent: "")
        showItem.target = self
        menu.addItem(showItem)

        // New Note
        let newNoteItem = NSMenuItem(title: "New Note", action: #selector(newNote), keyEquivalent: "")
        newNoteItem.target = self
        menu.addItem(newNoteItem)

        menu.addItem(NSMenuItem.separator())

        // Preferences
        let prefsItem = NSMenuItem(title: "Preferences…", action: #selector(openPreferences), keyEquivalent: ",")
        prefsItem.target = self
        menu.addItem(prefsItem)

        menu.addItem(NSMenuItem.separator())

        // View → Layout submenu
        let viewItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
        let viewMenu = NSMenu(title: "View")

        let layoutItem = NSMenuItem(title: "Layout", action: nil, keyEquivalent: "")
        let layoutMenu = NSMenu(title: "Layout")

        let singleItem = NSMenuItem(title: "Single", action: #selector(setLayoutSingle), keyEquivalent: "")
        singleItem.target = self
        singleItem.state = currentLayoutMode == "single" ? .on : .off
        layoutMenu.addItem(singleItem)
        self.singleLayoutItem = singleItem

        let splitItem = NSMenuItem(title: "Split", action: #selector(setLayoutSplit), keyEquivalent: "")
        splitItem.target = self
        splitItem.state = currentLayoutMode == "split" ? .on : .off
        layoutMenu.addItem(splitItem)
        self.splitLayoutItem = splitItem

        layoutItem.submenu = layoutMenu
        viewMenu.addItem(layoutItem)
        viewItem.submenu = viewMenu
        menu.addItem(viewItem)

        menu.addItem(NSMenuItem.separator())

        // Set Global Shortcut (kept for backward compat)
        let shortcutItem = NSMenuItem(title: "Set Global Shortcut…", action: #selector(openShortcutSettings), keyEquivalent: "")
        shortcutItem.target = self
        menu.addItem(shortcutItem)

        menu.addItem(NSMenuItem.separator())

        // About
        let aboutItem = NSMenuItem(title: "About FreeCastNotes", action: #selector(showAbout), keyEquivalent: "")
        aboutItem.target = self
        menu.addItem(aboutItem)

        menu.addItem(NSMenuItem.separator())

        // Quit
        let quitItem = NSMenuItem(title: "Quit FreeCastNotes", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)

        statusItem.menu = menu
    }

    func updateLayoutCheckmark(mode: String) {
        currentLayoutMode = mode
        singleLayoutItem?.state = mode == "single" ? .on : .off
        splitLayoutItem?.state = mode == "split" ? .on : .off
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

    @objc private func openPreferences() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-open-preferences")
    }

    @objc private func openShortcutSettings() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-open-shortcut-settings")
    }

    @objc private func setLayoutSingle() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-set-layout", detail: ["mode": "single"])
    }

    @objc private func setLayoutSplit() {
        guard let window = window else { return }
        WindowPositioner.showOnTop(window)
        webViewController?.sendToReact(event: "tray-set-layout", detail: ["mode": "split"])
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
