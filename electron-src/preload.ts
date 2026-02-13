import { contextBridge, ipcRenderer } from 'electron';

// Expose safe IPC methods to React (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {
  // Global shortcut management
  getGlobalShortcut: () => ipcRenderer.invoke('get-global-shortcut'),
  setGlobalShortcut: (shortcut: string) => ipcRenderer.invoke('set-global-shortcut', shortcut),

  // Window management
  hideWindow: () => ipcRenderer.send('hide-window'),
  getWindowSize: () => ipcRenderer.invoke('get-window-size'),
  setWindowSize: (width: number, height: number) => ipcRenderer.invoke('set-window-size', width, height),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x: number, y: number) => ipcRenderer.invoke('set-window-position', x, y),
  onWindowMoved: (callback: (position: { x: number; y: number }) => void) => {
    ipcRenderer.on('window-moved', (_, position) => callback(position));
  },

  // Event listeners from tray
  onTrayNewNote: (callback: () => void) => ipcRenderer.on('tray-new-note', callback),
  onTrayOpenShortcutSettings: (callback: () => void) => ipcRenderer.on('tray-open-shortcut-settings', callback),
});
