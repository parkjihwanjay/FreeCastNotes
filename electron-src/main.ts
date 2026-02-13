import * as electron from 'electron';
import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { initGlobalShortcut } from './shortcuts';
import { createTray } from './tray';

console.log('DEBUG: electron =', electron);
console.log('DEBUG: Object.keys(electron) =', Object.keys(electron));
console.log('DEBUG: app =', app);
console.log('DEBUG: typeof app =', typeof app);
console.log('DEBUG: BrowserWindow =', BrowserWindow);

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  // Hide from dock (macOS)
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  createWindow();
  initGlobalShortcut(mainWindow!);
  createTray(mainWindow!);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 600,
    minWidth: 650,
    maxWidth: 650,
    minHeight: 200,
    frame: false,              // frameless window
    transparent: true,
    alwaysOnTop: true,
    show: false,               // don't show until positioned
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // security
      nodeIntegration: false
    }
  });

  // CRITICAL: This is why we're migrating from Tauri!
  // setVisibleOnAllWorkspaces makes the window appear on all macOS spaces
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    });
  }

  // Load React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Listen for window move events and forward to renderer
  mainWindow.on('moved', () => {
    const [x, y] = mainWindow!.getPosition();
    mainWindow!.webContents.send('window-moved', { x, y });
  });
}

// Window management IPC handlers
ipcMain.handle('get-window-size', () => {
  if (!mainWindow) return { width: 0, height: 0 };
  const [width, height] = mainWindow.getSize();
  return { width, height };
});

ipcMain.handle('set-window-size', (_, width: number, height: number) => {
  if (mainWindow) {
    mainWindow.setSize(Math.round(width), Math.round(height));
  }
});

ipcMain.handle('get-window-position', () => {
  if (!mainWindow) return { x: 0, y: 0 };
  const [x, y] = mainWindow.getPosition();
  return { x, y };
});

ipcMain.handle('set-window-position', (_, x: number, y: number) => {
  if (mainWindow) {
    mainWindow.setPosition(Math.round(x), Math.round(y));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
