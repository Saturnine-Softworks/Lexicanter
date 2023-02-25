import type * as Lexc from './types';
import { Language } from '../stores';
import { get } from 'svelte/store';
import { platform } from 'os';
const { ipcRenderer } = require('electron');

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

export const debug = {
    log: (message: string) => {
        let formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m:\x1B[22m    ' + '\x1B[32m' + message + '\x1B[39m'
        console.log(formatted);
        ipcRenderer.invoke('debug', formatted);
    },
    logObj: (obj: any, name: string = '') => {
        let objString = JSON.stringify(obj, null, 2)
            .replace(/(.*):/g, '\x1B[32m$1\x1B[39m:');
        let formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m\x1B[22m    ' + '\x1B[32m"' + name + '":\x1B[39m' + '\n' + objString;
        ipcRenderer.invoke('debug', formatted);
        console.log(formatted);
    },    
    warn: (message: string) => {
        let formatted = '\x1B[22m\x1B[4mLexc Debug\x1B[24m\x1B[22m    ' + '\x1B[33m' + message + '\x1B[39m'
        ipcRenderer.invoke('debug', formatted);
        console.log(formatted);
    }
}
