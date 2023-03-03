/** 
 * Lexicanter, a constructed language organization app.
 * Copyright (C) 2023 Ethan Ray.
 * See GNU General Public License Version 3.
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

const { autoUpdater } = require('electron-updater');
// Auto-updater flags
autoUpdater.autoDownload = true;
autoUpdater.allowPrerelease = false;

const isDev = !app.isPackaged;
const version = app.getVersion();

const createWindow = () => {
    var loadingWindow = new BrowserWindow({
        width: 300,
        height: 300,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
        show: true,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true, // these two settings are required in order to use
            contextIsolation: false, // modules such as path and fs in renderer processes.
        },
    });
    loadingWindow.setWindowButtonVisibility(false);
    loadingWindow.loadFile(path.join(__dirname, 'loading.html'));

    // Create the browser window.
    var mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
        show: false,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true, // these two settings are required in order to use
            contextIsolation: false, // modules such as path and fs in renderer processes.
        },
    });
    // Load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            loadingWindow.close();
            mainWindow.show();
        }, 1000); // give the app a second to load the theme correctly.
    });
    // Set macOS dock icon
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'res/Quill Icon.png'));
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
                    autoHideMenuBar: true,
                    titleBarStyle: 'hidden',
                    titleBarOverlay: true,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                    },
                },
            };
        } else {
            mainWindow.webContents.executeJavaScript('console.log(\'Sending URL to shell.\')');
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });

    // Even with contextIsolation set to false, there are some things which still require interprocess communication.
    // IPC handlers below.
    ipcMain.handle('getUserDataPath', () => {
        let data_path = app.getPath('userData');
        return data_path;
    });
    ipcMain.handle('showOpenDialog', (_, params) => {
        let file_path = dialog.showOpenDialogSync(params);
        return file_path;
    });
    ipcMain.handle('getVersion', () => {
        return version;
    });
    ipcMain.handle('debug', (_, message) => {
        console.log(message);
    });

    mainWindow.on('close', e => {
        mainWindow.webContents.send('app-close');
        e.preventDefault(); // ! DON'T PUT THIS LINE FIRST. IT BREAKS EVERYTHING. WHY? BEYOND MORTAL COMPREHENSION.
    });
    ipcMain.on('close', () => {
        // Renderer will send back this event when it's done confirming save and/or quit.
        mainWindow = null;
        app.quit();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    autoUpdater.checkForUpdatesAndNotify();
    createWindow();
});

app.commandLine.appendSwitch('enable-experimental-web-platform-features'); // required to write files with FileSystemAccess API.
