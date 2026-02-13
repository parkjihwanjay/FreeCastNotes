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
            // Use template image so it adapts to light/dark menu bar
            if let icon = NSImage(named: "AppIcon") {
                icon.size = NSSize(width: 16, height: 16)
                icon.isTemplate = true
                button.image = icon
            } else {
                // Fallback: use text
                button.title = "📝"
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
}
