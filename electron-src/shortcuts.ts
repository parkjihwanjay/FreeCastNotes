import { app, globalShortcut, BrowserWindow, ipcMain } from 'electron';
import { toggleWindow } from './window';
import { loadShortcutFromDisk, saveShortcutToDisk } from './storage';

const DEFAULT_SHORTCUT = 'Alt+N';
let currentShortcut = DEFAULT_SHORTCUT;

export function registerGlobalShortcut(window: BrowserWindow, shortcut: string): boolean {
  try {
    // Unregister all previous shortcuts
    globalShortcut.unregisterAll();

    // Register new shortcut
    const success = globalShortcut.register(shortcut, () => {
      toggleWindow(window);
    });

    if (success) {
      currentShortcut = shortcut;
      saveShortcutToDisk(shortcut);
    }
    return success;
  } catch (error) {
    console.error('Failed to register shortcut:', error);
    return false;
  }
}

export function initGlobalShortcut(window: BrowserWindow) {
  app.whenReady().then(() => {
    const saved = loadShortcutFromDisk() || DEFAULT_SHORTCUT;
    const success = registerGlobalShortcut(window, saved);

    if (!success && saved !== DEFAULT_SHORTCUT) {
      // Fallback to default if saved shortcut fails
      registerGlobalShortcut(window, DEFAULT_SHORTCUT);
    }
  });

  // IPC handlers for ShortcutSettings component
  ipcMain.handle('get-global-shortcut', () => currentShortcut);
  ipcMain.handle('set-global-shortcut', (_, shortcut: string) => {
    return registerGlobalShortcut(window, shortcut);
  });

  // Handler for hiding window from React
  ipcMain.on('hide-window', () => {
    window.hide();
  });
}
