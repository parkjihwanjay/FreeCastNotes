import { app } from 'electron';

console.log('app:', app);
console.log('typeof app:', typeof app);

if (app) {
  app.whenReady().then(() => {
    console.log('SUCCESS: App is ready!');
    app.quit();
  });
} else {
  console.error('app is undefined!');
  process.exit(1);
}
