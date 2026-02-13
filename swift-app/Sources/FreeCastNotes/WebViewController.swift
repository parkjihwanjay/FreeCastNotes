import AppKit
import WebKit

class WebViewController: NSViewController, WKScriptMessageHandler, WKNavigationDelegate {
    var webView: WKWebView!
    weak var hostWindow: MainWindow?
    private var shortcutManager: ShortcutManager?

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

        case "startWindowDrag":
            if let event = NSApp.currentEvent {
                hostWindow?.performDrag(with: event)
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

    // MARK: - File Export

    private func handleExportFile(content: String, extension ext: String, filterName: String, callId: String?) {
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.init(filenameExtension: ext) ?? .plainText]
        panel.nameFieldStringValue = "note.\(ext)"
        panel.title = "Export Note"

        panel.begin { [weak self] response in
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

            call: function(type, payload) {
                return new Promise(function(resolve) {
                    const id = crypto.randomUUID();
                    const eventName = 'swift-response-' + type;

                    function handler(e) {
                        if (e.detail && e.detail.id === id) {
                            window.removeEventListener(eventName, handler);
                            resolve(e.detail.result);
                        }
                    }

                    window.addEventListener(eventName, handler);
                    window.webkit.messageHandlers.swiftBridge.postMessage({
                        type: type,
                        payload: Object.assign({}, payload || {}, { _callId: id })
                    });

                    // Timeout after 5 seconds
                    setTimeout(function() {
                        window.removeEventListener(eventName, handler);
                        resolve(null);
                    }, 5000);
                });
            }
        };
    })();
    """
}
