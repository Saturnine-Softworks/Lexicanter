// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ipcRenderer } = require('electron');

/**
 * Wrapper for asynchronous IPC invocation of FFI.
 * @param {string} name The name of the function to be called.
 * @param  {...any} args The arguments that the function takes.
 * @returns {Promise<any>}
 */
export async function ffi(
    name: string, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]): Promise<any> {
    return await ipcRenderer.invoke('ffi', name, ...args);
}

/**
 * Wrapper for the Rust-side `graphemify` function via FFI/IPC.
 * @param {string} engine The Graphemy engine file as a string
 * @param {string} input The string to be rendered via the typesetter
 * @param {number} max_width The maximum width of the bounding box for the rendered text
 * @param {number} max_height The maximum height of the bounding box for the rendered text
 * @returns {Promise<string>} The rendered SVG as a string
 */
export async function graphemify(
    engine: string, 
    input: string,
    max_width: number = 100.0,
    max_height: number = 100.0,
): Promise<string> {
    // Sanity checks
    if (!engine) return 'No Graphemy engine loaded.';
    if (!input) return 'Invalid or empty input.';
    if (!max_width) max_width = 100;
    if (!max_height) max_height = 100;

    return await ffi('graphemify', 
        engine, 
        input,
        max_width,
        max_height,
    );
}
