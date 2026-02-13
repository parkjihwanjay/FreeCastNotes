import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const SHORTCUT_FILE = 'global-shortcut.txt';

function getStoragePath(): string {
  return path.join(app.getPath('userData'), SHORTCUT_FILE);
}

export function loadShortcutFromDisk(): string | null {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim() || null;
    }
  } catch (error) {
    console.error('Failed to load shortcut:', error);
  }
  return null;
}

export function saveShortcutToDisk(shortcut: string): void {
  try {
    const filePath = getStoragePath();
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, shortcut, 'utf-8');
  } catch (error) {
    console.error('Failed to save shortcut:', error);
  }
}
