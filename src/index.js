// Lexicanter, a constructed language organization app.
// Copyright (C) 2023 Ethan Ray.
// See GNU General Public License Version 3.

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { fork, exec } = require('child_process');

const { autoUpdater, AppUpdater } = require('electron-updater');
// Auto-updater flags
autoUpdater.autoDownload = true;
exec('NET SESSION', function (err, so, se) {
    // If the app is run as admin, it will check for pre-release versions to download; otherwise it will only check for releases.
    autoUpdater.allowPrerelease = se.length === 0 ? true : false;
    console.log('allowPrerelease:', autoUpdater.allowPrerelease);
});
__dirname
const createWindow = () => {
    // Create the browser window.
    var mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            // devTools: false,
            nodeIntegration: true, // these two settings are required in order to use
            contextIsolation: false, // modules such as path and fs in renderer processes.
        },
    });

    // Set macOS dock icon
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'rsrc/Quill Icon.png'));
    }

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        mainWindow.webContents.executeJavaScript(`console.log('Forwarding link: ${decodeURI(url)}');`);
        if (url.includes('lex::')) {
            mainWindow.webContents.executeJavaScript(`follow_lex_link('${decodeURI(url).split('::')[1]}');`);
            return {action: 'deny'};
        } else if (path.basename(url) === 'index.html') {
            // console.log('path.basename(url):', path.basename(url)); 
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                    },
                },
            };
        } else {
            mainWindow.webContents.executeJavaScript("console.log('Sending URL to shell.')");
            shell.openExternal(url);
            return { action: 'deny' };
        };
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
    });

    mainWindow.on('close', function (e) {
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
    });

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

app.commandLine.appendSwitch('enable-experimental-web-platform-features'); // required to write files with FileSystemAccess API.
