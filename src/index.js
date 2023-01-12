const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { autoUpdater, AppUpdater } = require("electron-updater");
const { chrome } = require('process');

// Auto-updater flags
autoUpdater.autoDownload = true;
var exec = require('child_process').exec; 
exec('NET SESSION', function(err,so,se) {
      // If the app is run as admin, it will check for pre-release versions to download; otherwise it will only check for releases.
      autoUpdater.allowPrerelease = se.length === 0 ? true : false;
      console.log("allowPrerelease:", autoUpdater.allowPrerelease);
    });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  var mainWindow = new BrowserWindow({
    width: 728,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,   // these two settings are required in order to use
      contextIsolation: false, // modules such as path and fs in renderer processes.
    }
  });

  // Set macOS dock icon
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'rsrc/Quill Icon.png'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.webContents.executeJavaScript(`console.log('${url}');`);
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Even with contextIsolation set to false, there are some things which still require interprocess communication. 
  // IPC handlers below.
  ipcMain.handle('getUserDataPath', _ => {
    let data_path = app.getPath('userData');
    return data_path;
  });
  ipcMain.handle('showOpenDialog', (_, params) => {
    let file_path = dialog.showOpenDialogSync(params);
    return file_path;
  })

  mainWindow.on('close', function(e) {
    // Prompt user to save changes on quit (or auto-save) via IPC.
    if (mainWindow) {
      e.preventDefault();
      mainWindow.send('app-close');
    }
  });
  ipcMain.on('close', _ => {
    // Renderer will send back this event when it's done confirming quit or saving. 
    mainWindow = null;
    app.quit();
  })

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});

app.commandLine.appendSwitch("enable-experimental-web-platform-features"); // required to write files with FileSystemAccess API. 
