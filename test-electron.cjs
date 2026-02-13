const electron = require('electron');
console.log('electron:', electron);
console.log('electron.app:', electron.app);
console.log('typeof electron.app:', typeof electron.app);

if (electron.app) {
  electron.app.whenReady().then(() => {
    console.log('App is ready!');
    electron.app.quit();
  });
} else {
  console.error('electron.app is undefined!');
  process.exit(1);
}
