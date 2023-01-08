const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater, AppUpdater } = require("electron-updater");

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
  const mainWindow = new BrowserWindow({
    width: 728,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'rsrc/Quill Icon.png'));
  }

  // Even with contextIsolation set to false, there are some things which still require interprocess communication. 
  // IPC handlers below.
  ipcMain.handle('getUserDataPath', (event) => {
    let data_path = app.getPath('userData');
    return data_path;
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Prompt user to save changes on quit. 
  mainWindow.on('close', function(e) {
    var choice = require('electron').dialog.showMessageBoxSync(this,
        {
          type: 'question',
          buttons: ['Quit', 'Cancel'],
          title: 'Confirm Quit',
          message: 'You may want to ensure you have saved your changes.'
        });
        if(choice == 1){
          e.preventDefault();
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.commandLine.appendSwitch("enable-experimental-web-platform-features"); // required to write files
