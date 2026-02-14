import AppKit
import Carbon.HIToolbox
import HotKey

class ShortcutManager {
    private var hotKey: HotKey?
    private weak var window: MainWindow?
    private(set) var currentShortcut: String

    private static let defaultShortcut = "Alt+N"
    private static let storageKey = "globalShortcut"

    init(window: MainWindow) {
        self.window = window
        self.currentShortcut = UserDefaults.standard.string(forKey: Self.storageKey) ?? Self.defaultShortcut

        let success = register(shortcut: currentShortcut)
        if !success && currentShortcut != Self.defaultShortcut {
            _ = register(shortcut: Self.defaultShortcut)
        }
    }

    @discardableResult
    func register(shortcut: String) -> Bool {
        // Unregister previous
        hotKey = nil

        guard let (key, modifiers) = Self.parseShortcut(shortcut) else {
            print("Failed to parse shortcut: \(shortcut)")
            return false
        }

        print("[ShortcutManager] Registering: \(shortcut) → key=\(key), modifiers=\(modifiers)")
        hotKey = HotKey(key: key, modifiers: modifiers)
        hotKey?.keyDownHandler = { [weak self] in
            guard let window = self?.window else { return }
            WindowPositioner.toggle(window)
        }

        currentShortcut = shortcut
        UserDefaults.standard.set(shortcut, forKey: Self.storageKey)
        return true
    }

    // Parse shortcut string like "Alt+N", "Cmd+Shift+P" into HotKey components
    static func parseShortcut(_ shortcut: String) -> (Key, NSEvent.ModifierFlags)? {
        let parts = shortcut.split(separator: "+").map { String($0).trimmingCharacters(in: .whitespaces) }
        guard parts.count >= 2 else { return nil }

        var modifiers: NSEvent.ModifierFlags = []
        var keyString = ""

        for part in parts {
            switch part.lowercased() {
            case "alt", "option", "opt":
                modifiers.insert(.option)
            case "cmd", "command", "meta", "cmdorctrl":
                modifiers.insert(.command)
            case "ctrl", "control":
                modifiers.insert(.control)
            case "shift":
                modifiers.insert(.shift)
            default:
                keyString = part
            }
        }

        guard !keyString.isEmpty, let key = Self.keyFromString(keyString) else { return nil }
        return (key, modifiers)
    }

    private static func keyFromString(_ raw: String) -> Key? {
        // Normalize: "KeyN" → "n", "Digit1" → "1", "Space" → "space"
        var str = raw
        if str.hasPrefix("Key") && str.count == 4 {
            str = String(str.last!).lowercased()
        } else if str.hasPrefix("Digit") && str.count == 6 {
            str = String(str.last!)
        } else {
            str = str.lowercased()
        }

        switch str {
        case "a": return .a
        case "b": return .b
        case "c": return .c
        case "d": return .d
        case "e": return .e
        case "f": return .f
        case "g": return .g
        case "h": return .h
        case "i": return .i
        case "j": return .j
        case "k": return .k
        case "l": return .l
        case "m": return .m
        case "n": return .n
        case "o": return .o
        case "p": return .p
        case "q": return .q
        case "r": return .r
        case "s": return .s
        case "t": return .t
        case "u": return .u
        case "v": return .v
        case "w": return .w
        case "x": return .x
        case "y": return .y
        case "z": return .z
        case "0": return .zero
        case "1": return .one
        case "2": return .two
        case "3": return .three
        case "4": return .four
        case "5": return .five
        case "6": return .six
        case "7": return .seven
        case "8": return .eight
        case "9": return .nine
        case "space": return .space
        case "escape", "esc": return .escape
        case "return", "enter": return .return
        case "tab": return .tab
        case "f1": return .f1
        case "f2": return .f2
        case "f3": return .f3
        case "f4": return .f4
        case "f5": return .f5
        case "f6": return .f6
        case "f7": return .f7
        case "f8": return .f8
        case "f9": return .f9
        case "f10": return .f10
        case "f11": return .f11
        case "f12": return .f12
        case "arrowup": return .upArrow
        case "arrowdown": return .downArrow
        case "arrowleft": return .leftArrow
        case "arrowright": return .rightArrow
        case "backspace": return .delete
        case "delete": return .forwardDelete
        case "home": return .home
        case "end": return .end
        case "pageup": return .pageUp
        case "pagedown": return .pageDown
        default: return nil
        }
    }
}
