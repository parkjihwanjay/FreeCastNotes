import AppKit
import WebKit

class WebViewController: NSViewController, WKScriptMessageHandler, WKNavigationDelegate {
    var webView: WKWebView!
    weak var hostWindow: MainWindow?
    private var shortcutManager: ShortcutManager?
    private weak var trayManager: TrayManager?
    private weak var preferencesWindowController: PreferencesWindowController?

    init(window: MainWindow) {
        self.hostWindow = window
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    func setShortcutManager(_ manager: ShortcutManager) {
        self.shortcutManager = manager
    }

    func setTrayManager(_ manager: TrayManager) {
        self.trayManager = manager
    }

    func setPreferencesWindowController(_ controller: PreferencesWindowController) {
        self.preferencesWindowController = controller
    }

    override func loadView() {
        let config = WKWebViewConfiguration()

        // Use default (persistent) data store so localStorage survives restarts
        config.websiteDataStore = WKWebsiteDataStore.default()

        // Register JS→Swift bridge
        let contentController = WKUserContentController()
        contentController.add(self, name: "swiftBridge")

        // Inject the swiftBridge API into the page before any JS runs
        let bridgeScript = WKUserScript(
            source: Self.bridgeJavaScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(bridgeScript)

        config.userContentController = contentController

        // Allow localhost in dev
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self

        // Transparent background to match app
        webView.setValue(false, forKey: "drawsBackground")

        self.view = webView
        loadApp()
    }

    private func loadApp() {
        // Dev mode: load from Vite dev server
        let devURL = "http://localhost:1420"
        print("[FreeCastNotes] Loading React app from \(devURL)")

        if let url = URL(string: devURL) {
            let request = URLRequest(url: url, timeoutInterval: 5)
            webView.load(request)
        }
    }

    func loadBundledApp() {
        // Production mode: load from bundled dist/ folder
        let bundlePath = Bundle.main.resourcePath ?? ""
        let distPath = (bundlePath as NSString).appendingPathComponent("dist")
        let indexPath = (distPath as NSString).appendingPathComponent("index.html")
        let indexURL = URL(fileURLWithPath: indexPath)
        let distURL = URL(fileURLWithPath: distPath)
        print("[FreeCastNotes] Loading bundled app from \(indexPath)")
        webView.loadFileURL(indexURL, allowingReadAccessTo: distURL)
    }

    // If dev server fails, try bundled files
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[FreeCastNotes] Dev server failed: \(error.localizedDescription)")
        loadBundledApp()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("[FreeCastNotes] Page loaded successfully!")
    }

    // MARK: - JS → Swift Bridge

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else { return }

        let payload = body["payload"] as? [String: Any]
        let callId = payload?["_callId"] as? String

        switch type {
        case "hideWindow":
            hostWindow?.orderOut(nil)

        case "getWindowSize":
            if let window = hostWindow {
                let size = window.frame.size
                respond(callId: callId, type: type, result: ["width": size.width, "height": size.height])
            }

        case "setWindowSize":
            if let w = payload?["width"] as? CGFloat, let h = payload?["height"] as? CGFloat {
                hostWindow?.setContentSize(NSSize(width: w, height: h))
                respond(callId: callId, type: type, result: true)
            }

        case "getWindowPosition":
            if let window = hostWindow {
                let origin = window.frame.origin
                respond(callId: callId, type: type, result: ["x": origin.x, "y": origin.y])
            }

        case "setWindowPosition":
            if let x = payload?["x"] as? CGFloat, let y = payload?["y"] as? CGFloat {
                hostWindow?.setFrameOrigin(NSPoint(x: x, y: y))
                respond(callId: callId, type: type, result: true)
            }

        case "getGlobalShortcut":
            let shortcut = shortcutManager?.currentShortcut ?? "Alt+N"
            respond(callId: callId, type: type, result: shortcut)

        case "setGlobalShortcut":
            if let shortcut = payload?["shortcut"] as? String {
                let success = shortcutManager?.register(shortcut: shortcut) ?? false
                respond(callId: callId, type: type, result: success)
            }

        case "exportFile":
            if let content = payload?["content"] as? String,
               let ext = payload?["extension"] as? String,
               let filterName = payload?["filterName"] as? String {
                handleExportFile(content: content, extension: ext, filterName: filterName, callId: callId)
            }

        case "exportBatch":
            if let files = payload?["files"] as? [[String: Any]] {
                handleExportBatch(files: files, callId: callId)
            }

        case "startWindowDrag":
            if let event = NSApp.currentEvent {
                hostWindow?.performDrag(with: event)
            }

        case "importFile":
            handleImportFile(callId: callId)

        case "importImage":
            handleImportImage(callId: callId)

        case "openPreferences":
            DispatchQueue.main.async { [weak self] in
                self?.preferencesWindowController?.show()
            }

        case "notifyLayoutMode":
            if let mode = payload?["mode"] as? String {
                DispatchQueue.main.async { [weak self] in
                    self?.trayManager?.updateLayoutCheckmark(mode: mode)
                }
            }

        case "vaultGetFolder":
            handleVaultGetFolder(callId: callId)

        case "vaultSetFolder":
            handleVaultSetFolder(callId: callId)

        case "vaultLoadAll":
            handleVaultLoadAll(callId: callId)

        case "vaultReadNote":
            if let filename = payload?["filename"] as? String {
                handleVaultReadNote(filename: filename, callId: callId)
            }

        case "vaultWriteNote":
            if let filename = payload?["filename"] as? String,
               let content = payload?["content"] as? String {
                let attachments = payload?["attachments"] as? [[String: Any]] ?? []
                let subfolder = payload?["subfolder"] as? String
                handleVaultWriteNote(filename: filename, content: content,
                                     attachments: attachments, subfolder: subfolder,
                                     callId: callId)
            }

        case "vaultDeleteNote":
            if let filename = payload?["filename"] as? String {
                handleVaultDeleteNote(filename: filename, callId: callId)
            }

        case "vaultRestoreNote":
            if let filename = payload?["filename"] as? String {
                handleVaultRestoreNote(filename: filename, callId: callId)
            }

        case "vaultPurgeDeleted":
            handleVaultPurgeDeleted(callId: callId)

        case "vaultGetChanges":
            if let since = payload?["since"] as? Double {
                handleVaultGetChanges(since: since, callId: callId)
            }

        default:
            print("Unknown bridge message: \(type)")
        }
    }

    // MARK: - Swift → React

    func sendToReact(event: String, detail: Any? = nil) {
        let json: String
        if let detail = detail {
            if let data = try? JSONSerialization.data(withJSONObject: detail),
               let str = String(data: data, encoding: .utf8) {
                json = str
            } else {
                json = "null"
            }
        } else {
            json = "null"
        }

        let js = "window.dispatchEvent(new CustomEvent('\(event)', {detail: \(json)}))"
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(js)
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

    // MARK: - File Import

    private func handleImportFile(callId: String?) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.init(filenameExtension: "md") ?? .plainText, .plainText]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.title = "Import Markdown"

        // Temporarily lower window level so the panel appears in front
        hostWindow?.level = .normal

        panel.begin { [weak self] response in
            self?.hostWindow?.level = .floating
            if response == .OK, let url = panel.url {
                do {
                    let content = try String(contentsOf: url, encoding: .utf8)
                    self?.respond(callId: callId, type: "importFile", result: content)
                } catch {
                    print("Import failed: \(error)")
                    self?.respond(callId: callId, type: "importFile", result: false)
                }
            } else {
                self?.respond(callId: callId, type: "importFile", result: false)
            }
        }
    }

    // MARK: - Image Import

    private func handleImportImage(callId: String?) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.png, .jpeg, .gif, .webP, .heic, .tiff, .bmp]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.title = "Insert Image"
        panel.prompt = "Insert"

        hostWindow?.level = .normal

        panel.begin { [weak self] response in
            self?.hostWindow?.level = .floating
            guard response == .OK, let url = panel.url else {
                self?.respond(callId: callId, type: "importImage", result: false)
                return
            }
            do {
                let data = try Data(contentsOf: url)
                let ext = url.pathExtension.lowercased()
                let mime: String
                switch ext {
                case "jpg", "jpeg": mime = "image/jpeg"
                case "gif":         mime = "image/gif"
                case "webp":        mime = "image/webp"
                case "heic":        mime = "image/heic"
                case "tiff", "tif": mime = "image/tiff"
                case "bmp":         mime = "image/bmp"
                default:            mime = "image/png"
                }
                let dataURL = "data:\(mime);base64,\(data.base64EncodedString())"
                self?.respond(callId: callId, type: "importImage", result: dataURL)
            } catch {
                print("[FreeCastNotes] importImage failed: \(error)")
                self?.respond(callId: callId, type: "importImage", result: false)
            }
        }
    }

    // MARK: - File Export

    private func handleExportFile(content: String, extension ext: String, filterName: String, callId: String?) {
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.init(filenameExtension: ext) ?? .plainText]
        panel.nameFieldStringValue = "note.\(ext)"
        panel.title = "Export Note"

        // Temporarily lower window level so the panel appears in front
        hostWindow?.level = .normal

        panel.begin { [weak self] response in
            self?.hostWindow?.level = .floating
            if response == .OK, let url = panel.url {
                do {
                    try content.write(to: url, atomically: true, encoding: .utf8)
                    self?.respond(callId: callId, type: "exportFile", result: true)
                } catch {
                    print("Export failed: \(error)")
                    self?.respond(callId: callId, type: "exportFile", result: false)
                }
            } else {
                self?.respond(callId: callId, type: "exportFile", result: false)
            }
        }
    }

    // MARK: - Batch Export

    private func handleExportBatch(files: [[String: Any]], callId: String?) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Export Here"
        panel.title = "Choose Export Folder"

        hostWindow?.level = .normal

        panel.begin { [weak self] response in
            self?.hostWindow?.level = .floating

            guard response == .OK, let baseURL = panel.url else {
                self?.respond(callId: callId, type: "exportBatch",
                              result: ["success": false, "folder": ""])
                return
            }

            // Create a uniquely-named subfolder so nothing is dumped loose
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd HH-mm"
            let timestamp = formatter.string(from: Date())
            let folderURL = baseURL.appendingPathComponent("FreeCastNotes Export \(timestamp)")

            let fm = FileManager.default
            var failedPaths: [String] = []

            for file in files {
                guard let relativePath = file["path"] as? String,
                      let content = file["content"] as? String else { continue }

                let fileURL = folderURL.appendingPathComponent(relativePath)
                let dirURL = fileURL.deletingLastPathComponent()

                do {
                    try fm.createDirectory(at: dirURL, withIntermediateDirectories: true)
                    let encoding = file["encoding"] as? String ?? "utf8"
                    if encoding == "base64",
                       let data = Data(base64Encoded: content, options: .ignoreUnknownCharacters) {
                        try data.write(to: fileURL)
                    } else {
                        try content.write(to: fileURL, atomically: true, encoding: .utf8)
                    }
                } catch {
                    print("[FreeCastNotes] exportBatch failed for \(relativePath): \(error)")
                    failedPaths.append(relativePath)
                }
            }

            self?.respond(callId: callId, type: "exportBatch",
                          result: ["success": failedPaths.isEmpty, "folder": folderURL.path])
        }
    }

    // MARK: - Vault Storage

    var vaultFolderURL: URL {
        if let p = UserDefaults.standard.string(forKey: "vaultFolderPath"), !p.isEmpty {
            return URL(fileURLWithPath: p)
        }
        return FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Documents/FreeCastNotes")
    }

    private func handleVaultGetFolder(callId: String?) {
        respond(callId: callId, type: "vaultGetFolder", result: vaultFolderURL.path)
    }

    private func handleVaultSetFolder(callId: String?) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Vault Folder"
        panel.title = "Choose Vault Location"

        hostWindow?.level = .normal

        panel.begin { [weak self] response in
            self?.hostWindow?.level = .floating

            guard response == .OK, let newURL = panel.url, let self = self else {
                self?.respond(callId: callId, type: "vaultSetFolder", result: "")
                return
            }

            let fm = FileManager.default
            let oldURL = self.vaultFolderURL

            // Create destination
            try? fm.createDirectory(at: newURL, withIntermediateDirectories: true)

            // Copy vault contents to new location
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

    private func handleVaultLoadAll(callId: String?) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let fm = FileManager.default
            let vaultURL = self.vaultFolderURL
            let deletedURL = vaultURL.appendingPathComponent("_deleted")

            try? fm.createDirectory(at: vaultURL, withIntermediateDirectories: true)

            var notes: [[String: Any]] = []
            var deleted: [[String: Any]] = []

            let modKey = URLResourceKey.contentModificationDateKey

            if let items = try? fm.contentsOfDirectory(at: vaultURL,
                                                        includingPropertiesForKeys: [modKey]) {
                for item in items where item.pathExtension == "md" {
                    if let content = try? String(contentsOf: item, encoding: .utf8) {
                        let mtime = (try? item.resourceValues(forKeys: [modKey]))?
                            .contentModificationDate?.timeIntervalSince1970 ?? 0
                        notes.append(["filename": item.lastPathComponent,
                                      "content": content,
                                      "mtime": mtime])
                    }
                }
            }

            if let items = try? fm.contentsOfDirectory(at: deletedURL,
                                                        includingPropertiesForKeys: [modKey]) {
                for item in items where item.pathExtension == "md" {
                    if let content = try? String(contentsOf: item, encoding: .utf8) {
                        let mtime = (try? item.resourceValues(forKeys: [modKey]))?
                            .contentModificationDate?.timeIntervalSince1970 ?? 0
                        deleted.append(["filename": item.lastPathComponent,
                                        "content": content,
                                        "mtime": mtime])
                    }
                }
            }

            self.respond(callId: callId, type: "vaultLoadAll",
                         result: ["notes": notes, "deleted": deleted])
        }
    }

    private func handleVaultReadNote(filename: String, callId: String?) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let fileURL = self.vaultFolderURL.appendingPathComponent(filename)

            guard var content = try? String(contentsOf: fileURL, encoding: .utf8) else {
                self.respond(callId: callId, type: "vaultReadNote", result: "")
                return
            }

            // Inline attachment images as base64 data URLs
            let pattern = #"!\[([^\]]*)\]\((attachments/[^)]+)\)"#
            if let regex = try? NSRegularExpression(pattern: pattern) {
                var result = ""
                var lastEnd = content.startIndex
                let nsRange = NSRange(content.startIndex..., in: content)

                for match in regex.matches(in: content, range: nsRange) {
                    guard let altRange = Range(match.range(at: 1), in: content),
                          let pathRange = Range(match.range(at: 2), in: content),
                          let fullRange = Range(match.range, in: content) else { continue }

                    let alt = String(content[altRange])
                    let relPath = String(content[pathRange])
                    let attachmentURL = self.vaultFolderURL.appendingPathComponent(relPath)

                    result += content[lastEnd..<fullRange.lowerBound]

                    if let data = try? Data(contentsOf: attachmentURL) {
                        let ext = attachmentURL.pathExtension.lowercased()
                        let mime: String
                        switch ext {
                        case "jpg", "jpeg": mime = "image/jpeg"
                        case "gif": mime = "image/gif"
                        case "webp": mime = "image/webp"
                        default: mime = "image/png"
                        }
                        result += "![\(alt)](data:\(mime);base64,\(data.base64EncodedString()))"
                    } else {
                        result += content[fullRange]
                    }

                    lastEnd = fullRange.upperBound
                }

                result += content[lastEnd...]
                content = result
            }

            self.respond(callId: callId, type: "vaultReadNote", result: content)
        }
    }

    private func handleVaultWriteNote(filename: String, content: String,
                                       attachments: [[String: Any]],
                                       subfolder: String?, callId: String?) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let fm = FileManager.default
            let baseURL = subfolder != nil
                ? self.vaultFolderURL.appendingPathComponent(subfolder!)
                : self.vaultFolderURL

            do {
                try fm.createDirectory(at: baseURL, withIntermediateDirectories: true)
                let fileURL = baseURL.appendingPathComponent(filename)
                try content.write(to: fileURL, atomically: true, encoding: .utf8)
            } catch {
                print("[FreeCastNotes] vaultWriteNote failed: \(error)")
                self.respond(callId: callId, type: "vaultWriteNote", result: false)
                return
            }

            if !attachments.isEmpty {
                let attachmentsURL = self.vaultFolderURL.appendingPathComponent("attachments")
                try? fm.createDirectory(at: attachmentsURL, withIntermediateDirectories: true)

                for attachment in attachments {
                    guard let path = attachment["path"] as? String,
                          let base64 = attachment["base64"] as? String,
                          let data = Data(base64Encoded: base64,
                                          options: .ignoreUnknownCharacters) else { continue }
                    let attachFilename = (path as NSString).lastPathComponent
                    let attachURL = attachmentsURL.appendingPathComponent(attachFilename)
                    try? data.write(to: attachURL)
                }
            }

            self.respond(callId: callId, type: "vaultWriteNote", result: true)
        }
    }

    private func handleVaultDeleteNote(filename: String, callId: String?) {
        let fm = FileManager.default
        let sourceURL = vaultFolderURL.appendingPathComponent(filename)
        let deletedURL = vaultFolderURL.appendingPathComponent("_deleted")

        do {
            try fm.createDirectory(at: deletedURL, withIntermediateDirectories: true)
            let destURL = deletedURL.appendingPathComponent(filename)
            try fm.moveItem(at: sourceURL, to: destURL)
            respond(callId: callId, type: "vaultDeleteNote", result: true)
        } catch {
            print("[FreeCastNotes] vaultDeleteNote failed: \(error)")
            respond(callId: callId, type: "vaultDeleteNote", result: false)
        }
    }

    private func handleVaultRestoreNote(filename: String, callId: String?) {
        let fm = FileManager.default
        let sourceURL = vaultFolderURL.appendingPathComponent("_deleted")
            .appendingPathComponent(filename)
        let destURL = vaultFolderURL.appendingPathComponent(filename)

        do {
            try fm.moveItem(at: sourceURL, to: destURL)
            respond(callId: callId, type: "vaultRestoreNote", result: true)
        } catch {
            print("[FreeCastNotes] vaultRestoreNote failed: \(error)")
            respond(callId: callId, type: "vaultRestoreNote", result: false)
        }
    }

    private func handleVaultPurgeDeleted(callId: String?) {
        let fm = FileManager.default
        let deletedURL = vaultFolderURL.appendingPathComponent("_deleted")
        let cutoff = Date().addingTimeInterval(-30 * 24 * 60 * 60)

        let modKey = URLResourceKey.contentModificationDateKey
        if let items = try? fm.contentsOfDirectory(at: deletedURL,
                                                    includingPropertiesForKeys: [modKey]) {
            for item in items where item.pathExtension == "md" {
                if let mtime = (try? item.resourceValues(forKeys: [modKey]))?
                    .contentModificationDate, mtime < cutoff {
                    try? fm.removeItem(at: item)
                }
            }
        }

        respond(callId: callId, type: "vaultPurgeDeleted", result: true)
    }

    private func handleVaultGetChanges(since: Double, callId: String?) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let fm = FileManager.default
            let vaultURL = self.vaultFolderURL
            // since is in milliseconds (JS Date.now())
            let sinceDate = Date(timeIntervalSince1970: since / 1000.0)
            var changes: [[String: Any]] = []

            let modKey = URLResourceKey.contentModificationDateKey
            if let items = try? fm.contentsOfDirectory(at: vaultURL,
                                                        includingPropertiesForKeys: [modKey]) {
                for item in items where item.pathExtension == "md" {
                    if let mtime = (try? item.resourceValues(forKeys: [modKey]))?
                        .contentModificationDate,
                       mtime > sinceDate,
                       let content = try? String(contentsOf: item, encoding: .utf8) {
                        changes.append(["filename": item.lastPathComponent,
                                        "content": content])
                    }
                }
            }

            self.respond(callId: callId, type: "vaultGetChanges", result: changes)
        }
    }

    // MARK: - Bridge JavaScript

    static let bridgeJavaScript = """
    (function() {
        const pendingCalls = {};

        window.swiftBridge = {
            postMessage: function(type, payload) {
                window.webkit.messageHandlers.swiftBridge.postMessage({
                    type: type,
                    payload: payload || {}
                });
            },

            call: function(type, payload, timeout) {
                return new Promise(function(resolve) {
                    var resolved = false;
                    var id = crypto.randomUUID();
                    var eventName = 'swift-response-' + type;

                    function handler(e) {
                        if (e.detail && e.detail.id === id) {
                            resolved = true;
                            window.removeEventListener(eventName, handler);
                            resolve(e.detail.result);
                        }
                    }

                    window.addEventListener(eventName, handler);
                    window.webkit.messageHandlers.swiftBridge.postMessage({
                        type: type,
                        payload: Object.assign({}, payload || {}, { _callId: id })
                    });

                    setTimeout(function() {
                        if (!resolved) {
                            window.removeEventListener(eventName, handler);
                            resolve(null);
                        }
                    }, timeout || 5000);
                });
            }
        };
    })();
    """
}
