/**
 * Unified bridge for React ↔ Swift communication.
 * Uses WKWebView's postMessage / CustomEvent pattern.
 */

declare global {
  interface Window {
    swiftBridge?: {
      postMessage: (type: string, payload?: Record<string, unknown>) => void;
      call: (
        type: string,
        payload?: Record<string, unknown>,
        timeout?: number,
      ) => Promise<unknown>;
    };
  }
}

function isSwiftAvailable(): boolean {
  return typeof window.swiftBridge !== "undefined";
}

export const bridge = {
  // Window management
  hideWindow: () => {
    if (isSwiftAvailable()) {
      window.swiftBridge!.postMessage("hideWindow");
    }
  },

  getWindowSize: (): Promise<{ width: number; height: number }> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("getWindowSize") as Promise<{
        width: number;
        height: number;
      }>;
    }
    return Promise.resolve({ width: 650, height: 600 });
  },

  setWindowSize: (width: number, height: number): Promise<void> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("setWindowSize", {
        width,
        height,
      }) as Promise<void>;
    }
    return Promise.resolve();
  },

  getWindowPosition: (): Promise<{ x: number; y: number }> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("getWindowPosition") as Promise<{
        x: number;
        y: number;
      }>;
    }
    return Promise.resolve({ x: 0, y: 0 });
  },

  setWindowPosition: (x: number, y: number): Promise<void> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("setWindowPosition", {
        x,
        y,
      }) as Promise<void>;
    }
    return Promise.resolve();
  },

  // Global shortcuts
  getGlobalShortcut: (): Promise<string> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("getGlobalShortcut") as Promise<string>;
    }
    return Promise.resolve("Alt+N");
  },

  setGlobalShortcut: (shortcut: string): Promise<boolean> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("setGlobalShortcut", {
        shortcut,
      }) as Promise<boolean>;
    }
    return Promise.resolve(false);
  },

  // File export (native save dialog)
  exportFile: (
    content: string,
    extension: string,
    filterName: string,
  ): Promise<boolean> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("exportFile", {
        content,
        extension: extension,
        filterName,
      }, 120000) as Promise<boolean>;
    }
    return Promise.resolve(false);
  },

  // Batch export: user picks a folder, Swift writes all files into it
  exportBatch: (
    files: Array<{ path: string; content: string; encoding?: "utf8" | "base64" }>,
  ): Promise<{ success: boolean; folder: string }> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("exportBatch", { files }, 120000).then(
        (result) => {
          if (result && typeof result === "object") {
            return result as { success: boolean; folder: string };
          }
          return { success: false, folder: "" };
        },
      );
    }
    return Promise.resolve({ success: false, folder: "" });
  },

  // File import (native open dialog)
  importFile: (): Promise<string | null> => {
    if (isSwiftAvailable()) {
      return window.swiftBridge!.call("importFile", {}, 120000).then((result) =>
        typeof result === "string" ? result : null,
      );
    }
    return Promise.resolve(null);
  },

  // Notify Swift of layout mode change (for tray menu checkmarks)
  notifyLayoutMode: (mode: string): void => {
    if (isSwiftAvailable()) {
      window.swiftBridge!.postMessage("notifyLayoutMode", { mode });
    }
  },

  // Event listeners (Swift → React via CustomEvent)
  on: (event: string, callback: () => void): (() => void) => {
    const handler = () => callback();
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  },
};
