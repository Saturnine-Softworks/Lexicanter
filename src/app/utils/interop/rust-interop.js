const { ipcRenderer } = require('electron');

/**
 * @param {string} name The name of the function to be called.
 * @param  {...any} args The arguments that the function takes.
 * @description Wrapper for asynchronous IPC invocation of FFI.
 * ```
 */
export async function ffi(name, ...args) {
    return await ipcRenderer.invoke('ffi', name, ...args);
}
