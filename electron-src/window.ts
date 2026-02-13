import { BrowserWindow, screen } from 'electron';

export function positionWindowNearCursor(window: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint();
  const [width, height] = window.getSize();

  const desiredX = cursor.x - Math.floor(width / 2);
  const desiredY = cursor.y - 56;

  const display = screen.getDisplayNearestPoint(cursor);
  const { x: workX, y: workY, width: workW, height: workH } = display.workArea;
  const margin = 14;

  const x = Math.max(workX + margin, Math.min(desiredX, workX + workW - width - margin));
  const y = Math.max(workY + margin, Math.min(desiredY, workY + workH - height - margin));

  window.setPosition(Math.round(x), Math.round(y));
}

export function showWindowOnTop(window: BrowserWindow) {
  window.hide();  // reset state
  positionWindowNearCursor(window);

  if (process.platform === 'darwin') {
    window.setAlwaysOnTop(true, 'pop-up-menu');  // NSPopUpMenuWindowLevel
  }

  window.show();
  window.focus();
}

export function toggleWindow(window: BrowserWindow) {
  if (window.isVisible() && window.isFocused()) {
    window.hide();
  } else {
    showWindowOnTop(window);
  }
}
