/** 
 * Lexicanter, a constructed language organization app.
 * Copyright (C) 2023 Ethan Ray.
 * See GNU General Public License Version 3.
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
// const ffi = require('koffi');

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
        titleBarOverlay: false,
        show: true,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true, // these two settings are required in order to use
            contextIsolation: false, // modules such as path and fs in renderer processes.
        },
    });

    if (process.platform === 'darwin') {
        loadingWindow.setWindowButtonVisibility(false);
    }
    loadingWindow.loadFile(path.join(__dirname, 'loading.html'));

    // Create the browser window.
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        show: false,
        webPreferences: {
            devTools: true,
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
        app.dock.setIcon(path.join(__dirname, 'res/alembic.png'));
        mainWindow.setWindowButtonVisibility(false);
    }

    const WC = mainWindow.webContents;
    WC.on('will-navigate', function (e, url) {
        console.log('will-navigate', url); // DEBUG
        if (url.includes('lex::')) {
            e.preventDefault();
            WC.send('lexicon link', decodeURI(url).replace('lex::', ''));
            console.log('Lexicon link clicked: ' + decodeURI(url).replace('lex::', '')); // DEBUG
        } else if (path.basename(url) === 'index.html') {
            e.preventDefault();
        } else if (url != WC.getURL()) {
            e.preventDefault();
            shell.openExternal(url);
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
    ipcMain.handle('platform', () => {
        return process.platform;
    });
    ipcMain.on('buttonclose', () => {
        mainWindow.webContents.send('app-close');
    });
    ipcMain.on('minimize', () => {
        mainWindow.minimize();
    });
    ipcMain.on('maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
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

    // // Interop signature definitions
    // const lib = ffi.load('src/app/utils/interop/library/target/release/liblibrary.dylib');
    // const fns = {
    //     greet: lib.func('greet', 'str', ['str']),
    // };
    // ipcMain.handle('ffi', (_, name, ...args) => {
    //     return fns[name](...args);
    // });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    autoUpdater.checkForUpdatesAndNotify();
    createWindow();
});

app.commandLine.appendSwitch('enable-experimental-web-platform-features'); // required to write files with FileSystemAccess API.
