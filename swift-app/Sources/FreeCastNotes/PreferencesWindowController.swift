import AppKit
import WebKit

class PreferencesWindowController: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private weak var shortcutManager: ShortcutManager?

    init(shortcutManager: ShortcutManager) {
        self.shortcutManager = shortcutManager
        super.init()
        setupWindow()
        setupWebView()
    }

    private func setupWindow() {
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 460, height: 660),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = ""
        window.titleVisibility = .hidden
        window.level = .floating
        window.hidesOnDeactivate = false
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.backgroundColor = NSColor(red: 44/255, green: 44/255, blue: 46/255, alpha: 1)
        window.isReleasedWhenClosed = false
        window.center()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        // Share the same data store so localStorage (Zustand store) is consistent
        config.websiteDataStore = WKWebsiteDataStore.default()

        let contentController = WKUserContentController()
        contentController.add(self, name: "swiftBridge")

        let bridgeScript = WKUserScript(
            source: WebViewController.bridgeJavaScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(bridgeScript)
        config.userContentController = contentController
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")
        window.contentView?.addSubview(webView)

        loadApp()
    }

    private func loadApp() {
        if let url = URL(string: "http://localhost:1420/#preferences") {
            webView.load(URLRequest(url: url, timeoutInterval: 5))
        }
    }

    func show() {
        window.standardWindowButton(.closeButton)?.isHidden = true
        window.standardWindowButton(.miniaturizeButton)?.isHidden = true
        window.standardWindowButton(.zoomButton)?.isHidden = true
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else { return }

        let payload = body["payload"] as? [String: Any]
        let callId = payload?["_callId"] as? String

        switch type {
        case "hideWindow":
            DispatchQueue.main.async { [weak self] in
                self?.window.orderOut(nil)
            }

        case "getGlobalShortcut":
            let shortcut = shortcutManager?.currentShortcut ?? "Alt+N"
            respond(callId: callId, type: type, result: shortcut)

        case "setGlobalShortcut":
            if let shortcut = payload?["shortcut"] as? String {
                let success = shortcutManager?.register(shortcut: shortcut) ?? false
                respond(callId: callId, type: type, result: success)
            }

        case "vaultGetFolder":
            respond(callId: callId, type: type, result: vaultFolderURL.path)

        case "vaultSetFolder":
            handleVaultSetFolder(callId: callId)

        default:
            break
        }
    }

    private func respond(callId: String?, type: String, result: Any) {
        guard let callId = callId else { return }
        let detail: [String: Any] = ["id": callId, "result": result]
        if let data = try? JSONSerialization.data(withJSONObject: detail),
           let json = String(data: data, encoding: .utf8) {
            let js = "window.dispatchEvent(new CustomEvent('swift-response-\(type)', {detail: \(json)}))"
            DispatchQueue.main.async { [weak self] in
                self?.webView.evaluateJavaScript(js)
            }
        }
    }

    private var vaultFolderURL: URL {
        if let p = UserDefaults.standard.string(forKey: "vaultFolderPath"), !p.isEmpty {
            return URL(fileURLWithPath: p)
        }
        return FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Documents/FreeCastNotes")
    }

    private func handleVaultSetFolder(callId: String?) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Vault Folder"
        panel.title = "Choose Vault Location"

        window.level = .normal

        panel.begin { [weak self] response in
            self?.window.level = .floating
            guard response == .OK, let newURL = panel.url, let self = self else {
                self?.respond(callId: callId, type: "vaultSetFolder", result: "")
                return
            }

            let fm = FileManager.default
            let oldURL = self.vaultFolderURL
            try? fm.createDirectory(at: newURL, withIntermediateDirectories: true)
            if let items = try? fm.contentsOfDirectory(at: oldURL, includingPropertiesForKeys: nil) {
                for item in items {
                    let dest = newURL.appendingPathComponent(item.lastPathComponent)
                    try? fm.copyItem(at: item, to: dest)
                }
            }
            UserDefaults.standard.set(newURL.path, forKey: "vaultFolderPath")
            self.respond(callId: callId, type: "vaultSetFolder", result: newURL.path)
        }
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        // Dev server unreachable → load bundled app
        let bundlePath = Bundle.main.resourcePath ?? ""
        let distPath = (bundlePath as NSString).appendingPathComponent("dist")
        let indexURL = URL(fileURLWithPath: (distPath as NSString).appendingPathComponent("index.html"))
        var comps = URLComponents(url: indexURL, resolvingAgainstBaseURL: false)
        comps?.fragment = "preferences"
        if let url = comps?.url {
            webView.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: distPath))
        }
    }
}
