/**
 * Lexicanter, a constructed language organization app.
 * Copyright (C) 2023 Ethan Ray.
 * See GNU General Public License Version 3.
*/

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const ffi = require('koffi');
const fs = require('node:fs');

// Auto-updater flags
autoUpdater.autoDownload = true;

const alchemyPath = app.getPath('userData') + path.sep + "alchemy.json";
let allowAlchemy = false;
if (fs.existsSync(alchemyPath)) {
    const data = fs.readFileSync(alchemyPath);
    console.log("\
        --------------------------------------------\n\
         Alchemy preference:", data.toString(), "\n\
        --------------------------------------------\n\
    ");
    allowAlchemy = JSON.parse(data).allowAlchemy ?? false;
} else {
    fs.writeFileSync(alchemyPath, JSON.stringify({allowAlchemy: false}));
    console.log("\nWrote alchemy preference file at: ", alchemyPath, "\n");
}
autoUpdater.allowPrerelease = allowAlchemy;

const isDev = !app.isPackaged;
const version = app.getVersion();

function createWindow () {
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

    if (process.platform === 'darwin')
        loadingWindow.setWindowButtonVisibility(false);

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

    if (process.env.NODE_ENV !== 'development') {
        // Load production build
        mainWindow.loadFile(`${__dirname}/entry.html`);
    } else {
        // Load vite dev server page
        console.log('Development mode');
        mainWindow.loadURL('http://localhost:3000/');
    }

    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            loadingWindow.close();
            mainWindow.show();
        }, 1000); // give the app a second to load the theme correctly; strobes otherwise.
    });

    // Set macOS dock icon
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'res/alembic.png'));
        mainWindow.setWindowButtonVisibility(false);
    }

    session.defaultSession.on('file-system-access-restricted', async (e, details, callback) => {
        const { path } = details
        const { response } = await dialog.showMessageBox({
            message: `Your operating system has blocked Lexicanter from opening a restricted path: \n\n ${path} \n\n Please grant access or choose a different location.`,
            title: 'File System Access Restricted',
            buttons: [
                'Allow', 
                'Choose a different folder', 
                'Cancel'
            ],
            cancelId: 2
        })

        if (response === 0) {
            callback('allow')
        } else if (response === 1) {
            callback('tryAgain')
        } else {
            callback('deny')
        }
    })

    const WC = mainWindow.webContents;
    WC.on('will-navigate', function (e, url) {
        if (url.includes('lex::')) {
            e.preventDefault();
            WC.send('lexicon link', decodeURI(url).replace('lex::', ''));
            // console.log('Lexicon link clicked: ' + decodeURI(url).replace('lex::', ''));
        } else if (decodeURI(url).match(/\[\[.+?\]\]/)) {
            e.preventDefault();
            let link = decodeURI(url).matchAll(/\[\[(.+?)\]\]/)[1]
            WC.send('lexicon link', link)
            // console.log('Lexicon link clicked: ' + decodeURI(url).replace('lex::', ''));
        } else if (path.basename(url) === 'index.html') {
            e.preventDefault();
        } else if (url != WC.getURL()) {
            e.preventDefault();
            shell.openExternal(url);
        }
    });

    // Even with contextIsolation set to false, there are some things which still require interprocess communication.
    // IPC handlers below.
    ipcMain.handle('getUserDataPath', () => app.getPath('userData'));
    ipcMain.handle('showOpenDialog', (_, params) =>
        dialog.showOpenDialogSync(params),
    );
    
    ipcMain.handle('getVersion', () => (isDev? 'dev-' : '') + version);
    ipcMain.handle('platform', () => process.platform + '-' + process.arch);
    ipcMain.handle('isDev', () => isDev);
    
    ipcMain.handle('debug', (_, message) => console.log(message));

    ipcMain.on('buttonclose', () => mainWindow.webContents.send('app-close'));
    ipcMain.on('minimize', () => mainWindow.minimize());
    ipcMain.on('maximize', () =>
        mainWindow.isMaximized()?
            mainWindow.unmaximize()
        :   mainWindow.maximize(),
    );

    ipcMain.on('close', () => {
        // Renderer will send back this event when it's done confirming save and/or quit.
        mainWindow = null;
        app.quit();
    });

    // Interop signature definitions

    const arch = {
        ia32: 'i686-',
        x64: 'x86_64-',
        arm64: 'aarch64-'
    }[process.arch];

    const platform = {
        darwin: 'apple-darwin',
        linux: 'unknown-linux-gnu',
        win32: 'pc-windows-gnu'
    }[process.platform];

    const extension = {
        darwin: '.dylib',
        linux: '.so',
        win32: '.dll'
    }[process.platform];


    const lib_path =
        isDev? 
            path.resolve(
                path.join(
                    __dirname,
                    'library/target/release/lib_graphemy_ffi.dylib',
                ),
            )
        :   path.resolve(process.resourcesPath, arch + platform + path.sep + 'graphemy_ffi' + extension);

    console.log('Loading graphemy ffi lib from path:', lib_path);
    
    const lib = ffi.load(lib_path);
    const fns = {
        // fn name = lib.func(rust fn name, return type, [parameter types])
        echo: lib.func('echo', 'str', ['str']),
        graphemify: lib.func('graphemify', 'str', ['str', 'str', 'float32', 'float32']),
    };
    ipcMain.handle('ffi', (_, name, ...args) => {
        // console.log(
        //     name,
        //     ...args, 
        //     // '\n', fns[name]
        // );
        // console.log(fns[name](...args));
        return fns[name](...args);
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
