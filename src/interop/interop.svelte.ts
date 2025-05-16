const { ipcRenderer } = require('electron');
import { Language } from '../app/stores';
import path from 'path';

/**
 * Wrapper for asynchronous IPC invocation of FFI.
 * @param {string} name The name of the function to be called.
 * @param  {...any} args The arguments that the function takes.
 * @returns {Promise<any>}
 */
export async function ffi(name: string, ...args: any[]): Promise<any> {
    return await ipcRenderer.invoke('ffi', name, ...args);
}
/**
 * Wrapper for the Rust-side `graphemify` function via FFI/IPC.
 * @param {string} engine_path The path to the .gmy file for the typesetter to use
 * @param {string} input The string to be rendered via the typesetter
 * @returns {Promise<string>} The rendered SVG as a string
 */
export async function graphemify(
    engine_path: string, 
    input: string,
): Promise<string> {
    return await ffi('graphemify', 
        engine_path, 
        input,
    );
}
