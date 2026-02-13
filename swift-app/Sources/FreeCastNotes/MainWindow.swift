import AppKit

class MainWindow: NSWindow {

    init() {
        super.init(
            contentRect: NSRect(x: 0, y: 0, width: 650, height: 600),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )

        // Window appearance
        isOpaque = false
        backgroundColor = .clear
        hasShadow = true
        isMovableByWindowBackground = false

        // Size constraints (fixed width, variable height)
        minSize = NSSize(width: 650, height: 200)
        maxSize = NSSize(width: 650, height: NSScreen.main?.frame.height ?? 1200)

        // Floating behavior
        level = .floating
        hidesOnDeactivate = false

        // ✅ THE FIX — This is why we're migrating to Swift!
        collectionBehavior = [
            .canJoinAllSpaces,       // Visible on ALL macOS spaces
            .fullScreenAuxiliary,    // Works alongside fullscreen apps
            .stationary              // Stays when switching spaces
        ]

        // Center on screen initially
        center()
    }

    // Allow the window to become key (receive keyboard input)
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }

    // Handle mouse events for custom drag region
    // The toolbar area (top 48px) acts as a drag handle
    override func mouseDown(with event: NSEvent) {
        let location = event.locationInWindow
        let windowHeight = frame.height

        // If click is in the top 48px (toolbar region), start drag
        if location.y >= windowHeight - 48 {
            performDrag(with: event)
        } else {
            super.mouseDown(with: event)
        }
    }
}
