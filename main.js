const { BrowserWindow, app, ipcMain, Notification } = require('electron');
const path = require('path');

let win = null;
let childWindow = null;

app.on('ready', function () {
  win = new BrowserWindow({
    frame: false,
    fullscreen: false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.maximize()

  win.loadURL('http://localhost:3000/');
  win.webContents.openDevTools();
});

ipcMain.on('child', (_, url) => {
  childWindow = new BrowserWindow({
    parent: win,
    center: true,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  childWindow.loadURL(url);
})
ipcMain.on('notify', (_, message) => {
  new Notification({title: 'Notifiation', body: message}).show();
})
