import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import { toggleWindow, showWindowOnTop } from './window';

let tray: Tray | null = null;

export function createTray(window: BrowserWindow) {
  // Load icon (use .icns for macOS, .png for others)
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, '../../src-tauri/icons/icon.icns')
    : path.join(__dirname, '../../src-tauri/icons/icon.png');

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('FreeCastNotes');

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Notes',
      click: () => toggleWindow(window)
    },
    {
      label: 'New Note',
      click: () => {
        showWindowOnTop(window);
        window.webContents.send('tray-new-note');
      }
    },
    {
      label: 'Set Global Shortcut...',
      click: () => {
        showWindowOnTop(window);
        window.webContents.send('tray-open-shortcut-settings');
      }
    },
    { type: 'separator' },
    {
      label: 'About FreeCastNotes',
      click: () => showWindowOnTop(window)
    },
    { type: 'separator' },
    {
      label: 'Quit FreeCastNotes',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Left-click behavior (toggle window)
  tray.on('click', () => {
    toggleWindow(window);
  });
}
