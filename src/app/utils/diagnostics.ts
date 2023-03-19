import type * as Lexc from '../types';
import { Language } from '../stores';
import { get } from 'svelte/store';
import { platform } from 'os';
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// can't import this from utils/files because it causes a circular dependency
async function userData (callback: (user_path: string) => void): Promise<void> {
    let path: string;
    await ipcRenderer.invoke('getUserDataPath').then((result: string) => {
        path = result;
    });
    callback(path);
}

/**
 * This function pushes a new diagnostic record to the diagnostics
 * data in the Language object, which is saved along with the save
 * file. 
 * @param {string} action - The action that was being performed when the error occurred.
 * @param {string} error - The error message.
 */
export function logError(action: string, error: string): void {
    get(Language).Diagnostics.push(<Lexc.Diagnostic> {
        Time: Date(),
        Version: get(Language).Version,
        OS: platform(),
        Action: action,
        Error: error
    });
}

/**
 * Takes a string and pushes it to the Diagnostics array in the Language object, along
 * with the current date, version, and OS.
 * @param {string} action - The action that was performed.
 */
export function logAction(action: string): void {
    get(Language).Diagnostics.push(<Lexc.Diagnostic> {
        Time: Date(),
        Version: get(Language).Version,
        OS: platform(),
        Action: action
    });
}

function logToFile(message: string, report: 'info' | 'warning' | 'error'): void {
    userData(userPath => {
        const logsPath = userPath + path.sep + 'Diagnostics' + path.sep;
        if (!fs.existsSync(logsPath)) {
            fs.mkdirSync(logsPath);
        }
        const timestamp = new Date().toString();
        const logFile = logsPath + 'logs';
        const log = 
            'Report: ' + report + '\n'
            + 'Time: ' + timestamp + '\n' 
            + 'Version: ' + ipcRenderer.invoke('getVersion') + '\n'
            + 'File: (v'  + get(Language).Version + ') ' + get(Language).Name + '\n'
            + message + '\n';
        if (!fs.existsSync(logFile)) {
            fs.writeFile(logFile, log, (err: Error) => {if (err) debug.error(String(err), false);});
        } else {
            fs.appendFile(logFile, log, (err: Error) => {if (err) debug.error(String(err), false);});
        }
    });
}

export const debug = {
    log: (message: string, logFile = true) => {
        if (logFile) logToFile(message, 'info');
        const formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m:\x1B[22m ' + '\x1B[32m' + message + '\x1B[39m';
        console.log(formatted);
        ipcRenderer.invoke('debug', formatted);
    },
    logObj: (obj: unknown, name = '', logFile = true) => {
        if (logFile) logToFile('Object: ' + name + '\n' + JSON.stringify(obj, null, 2), 'info');
        const objString = JSON.stringify(obj, null, 2)
            .replace(/(.*):/g, '\x1B[32m$1\x1B[39m:');
        const formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m\x1B[22m ' + '\x1B[32m' + name + ':\x1B[39m' + '\n' + objString;
        ipcRenderer.invoke('debug', formatted);
        console.log(formatted);
    },    
    warn: (message: string, logFile = true) => {
        if (logFile) logToFile(message, 'warning');
        const formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m\x1B[22m ' + '\x1B[33m' + message + '\x1B[39m';
        ipcRenderer.invoke('debug', formatted);
        console.log(formatted);
    },
    error: (message: string, logFile = true) => {
        if (logFile) logToFile(message, 'error');
        const formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m\x1B[22m ' + '\x1B[31m' + message + '\x1B[39m';
        ipcRenderer.invoke('debug', formatted);
        console.log(formatted);
    },
    logAndReturn: <T> (object:T, message = '', logFile = false): T => {
        debug.logObj(object, message, logFile);
        return object;
    }
};
