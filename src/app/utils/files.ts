/* eslint-disable @typescript-eslint/no-var-requires */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const vex = require('vex-js');
import { get } from 'svelte/store';
import type { OutputData } from '@editorjs/editorjs';
import type * as Lexc from '../types';
import { Language, autosave, docsEditor, defaultLanguage } from '../stores';
import { writeRomans, get_pronunciation } from './phonetics';
import { initializeDocs } from './docs';
import * as diagnostics from './diagnostics';
import { alphabetize } from './alphabetize';
import { markdownToHtml } from './markdown';
const Lang = () => get(Language);
const Default = get(defaultLanguage);

/**
* This function is used to get the user's data path.
* @param {function (user_path: string): void} callback
*/
export async function userData (callback: (user_path: string) => void) {
    let path: string;
    await ipcRenderer.invoke('getUserDataPath').then(result => {
        path = result;
    });
    callback(path);
}

/**
* This function is used to show the 'open' dialog at a specific 
* path, which can't be done with the default dialog API.
* It calls back with the path to the file that the user selected.
* @param {any} params
* @param {function} callback
*/
export async function showOpenDialog (params, callback: (path: string) => void) {
    let path: string;
    await ipcRenderer.invoke('showOpenDialog', params).then((result: string) => {
        path = result;
    });
    callback(path);
}

/**
* Collects all the data to be exported into one JSON string.
* @returns {string} The data to be exported.
*/
async function collectExportData (): Promise<string> {
    if (typeof get(docsEditor).save === 'function') {
        console.log('Save function found for docs editor.', get(docsEditor));
        await get(docsEditor).save().then(data => {
            Lang().Docs = data;
        });
    } else {
        console.log('No save function found for docs editor.', get(docsEditor));
    }
    Lang().Version = await ipcRenderer.invoke('getVersion');
    return JSON.stringify(Lang());
}

/**
* Converts the Editor.js JSON data to HTML and 
* appends it to the provided container element.
* @param {OutputData} data The Editor.js JSON data
* @param {HTMLElement} container The container element
* @returns {HTMLElement} The container element with the HTML inserted
*/
function editorjsToHTML(data: OutputData, container: HTMLElement): HTMLElement {
    for (const element of data.blocks) {
        switch (element.type) {
        case 'header': {
            const header = document.createElement(
                `h${element.data.level}`
            );
            header.innerHTML = element.data.text;
            container.appendChild(header);
            break; 
        }
        case 'paragraph': {
            const paragraph = document.createElement('p');
            paragraph.innerHTML = element.data.text;
            container.appendChild(paragraph);
            break;
        }
        case 'table': {
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            element.data.content.forEach((row: string[]) => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.innerHTML = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
            break;
        }}
    }
    return container;
}
        
/**
        * This function saves the language as a .lexc file
        * in the user's Lexicons folder. It also saves a timestamped backup copy.
        */
export async function saveFile () {
    const finish = async () => {
        const exports = await collectExportData();
        try {
            userData(user_path => {
                const lexiconFolder = `${user_path}${path.sep}Lexicons${path.sep}`;
                const backupsFolder = `${user_path}${path.sep}Backups${path.sep}`;
                const timestamp = new Date().toString().split(' GMT')[0].replaceAll(':', '꞉');
                if (!fs.existsSync(lexiconFolder)) {
                    fs.mkdirSync(lexiconFolder);
                }
                if (!fs.existsSync(backupsFolder)) {
                    fs.mkdirSync(backupsFolder);
                }
                fs.writeFileSync(
                    `${lexiconFolder}${Lang().Name}.lexc`,
                    exports,
                    'utf8'
                );
                fs.writeFileSync(
                    `${backupsFolder}${Lang().Name} @ ${timestamp}.lexc`,
                    exports,
                    'utf8'
                );
            });
            if (!get(autosave)) {
                vex.dialog.alert(`The ${Lang().Name} file has been saved.`);
            } else {
                new Notification(`The ${Lang().Name} file has been auto-saved.`);
            }
        } catch (err) {
            vex.dialog.alert(
                'There was a problem saving your file. Please contact the developer.'
            );
            console.log(err);
        }
    };
                        
    if (!Lang().Name.trim()) {
        vex.dialog.prompt({
            message: 'Please enter a file name before saving.',
            callback: (response: string | false) => {
                if (response) {
                    Lang().Name = response.trim();
                    finish();
                }
            }
        });
    } else {
        finish();
    }
}
                    
/**
* Contains the functions for exporting the language data
* in various formats, asychronously.
* @property {function} `lexc()` Exports the language as a .lexc file.
* @property {function} `txt()` Saves the lexicon as a .txt file.
* @property {function} `csv()` Saves the lexicon as a .csv file.
* @property {function} `json()` Exports the raw JSON data.
* @property {function} `html.all()` Exports the language as an interactive HTML file.
* @property {function} `html.docs()` Exports the documentation alone as an HTML file.
*/ 
export const saveAs = {
    lexc: async () => {
        let exports: Blob;
        collectExportData().then(jsonString => {exports = new Blob([jsonString]);});
        const file_handle = await window.showSaveFilePicker({
            suggestedName: `${Lang().Name}.lexc`,
        });
        await file_handle.requestPermission({ mode: 'readwrite' });
        const file = await file_handle.createWritable();
        try { await file.write(exports); } catch (err) {
            window.alert('The file failed to save. Please contact the developer for assistance.');
            console.log(err);
            await file.close();
            return;
        }
        await file.close();
        window.alert('The file saved successfully.');
    },
    txt: async () => {
        let export_data = '';
        const $lexicon = Lang().Lexicon;
        for (const word in $lexicon) {
            export_data += `${word}\n${$lexicon[word][0]}\n${$lexicon[word][1]}\n\n`;
        }
        const exports = new Blob([export_data]);
                            
        const file_handle = await window.showSaveFilePicker({
            suggestedName: `${Lang().Name}.txt`,
        });
        await file_handle.requestPermission({ mode: 'readwrite' });
        const file = await file_handle.createWritable();
        try {
            await file.write(exports);
        } catch (err) {
            window.alert('The file failed to export.');
        }
        await file.close();
        window.alert('The file exported successfully.');
    },
    csv: async () => {
        const $lexicon = Lang().Lexicon;
        const array_to_csv = (data) => {
            return data.map(row => row
                .map(String) // convert every value to String
                .map((v: string) => v.replaceAll('"', '""')) // escape double colons
                .map((v: string) => `"${v}"`) // quote it
                .join(',') // comma-separated
            ).join('\r\n'); // rows starting on new lines
        };
        const arr_data = [['Word', 'Pronunciations', 'Definitions']];
        for (const key in $lexicon) {
            arr_data.push([
                key, 
                Object.entries($lexicon[key].pronunciations).map(([lect, {ipa}]) => lect + ': ' + ipa).join(' — '), 
                $lexicon[key].Senses.map(sense => sense.definition).join(' — ')
            ]);
        }
        const export_data = array_to_csv(arr_data);
        const exports = new Blob([export_data]);
                                
        const file_handle = await window.showSaveFilePicker({
            suggestedName: `${Lang().Name}.csv`,
        });
        await file_handle.requestPermission({ mode: 'readwrite' });
        const file = await file_handle.createWritable();
        try {
            await file.write(exports);
        } catch (err) {
            window.alert('The file failed to export. Please contact the developer for assistance.');
            console.log(err);
        }
        await file.close();
        window.alert('The file exported successfully.');
    },
    json: async () => {
        let export_data: Blob;
        collectExportData().then(jsonString => {export_data = new Blob([jsonString]);});
                                
        const file_handle = await window.showSaveFilePicker({
            suggestedName: `${Lang().Name}.json`,
        });
        await file_handle.requestPermission({ mode: 'readwrite' });
        const file = await file_handle.createWritable();
        try {
            await file.write(export_data);
        } catch (err) {
            window.alert('The file failed to export.');
        }
        await file.close();
        window.alert('The file exported successfully.');
    },
    html: {
        lexicon: async () => {
            // Create HTML document object
            const export_container = document.createElement('html');
                                    
            // Create HTML header info
            const head = document.createElement('head');
            head.innerHTML = `
                <meta charset="UTF-8" />
                <title>${Lang().Name}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
            `;
                                    
            // Create export styles
            const styles = document.createElement('style');
            styles.innerHTML = indexCSS;
                                    
            const overrides = document.createElement('style');
            overrides.innerHTML = overridesCSS;
                                    
            // Create export body
            const body = document.createElement('body');
            body.innerHTML += `<h1>${Lang().Name}</h1>`;
            const alphabetical = alphabetize(Lang().Lexicon);
            body.innerHTML += '<hr/><h2>Lexicon</h2>';
            body.append(lexiconToHTML(alphabetical));
                                    
            head.append(styles, overrides);
            export_container.append(head, body);
                                    
            const export_data = export_container.outerHTML;
            const exports = new Blob(['\ufeff', export_data], {
                type: 'tex/html; charset=utf-8;',
            });
                                    
            const file_handle = await window.showSaveFilePicker({
                suggestedName: `${Lang().Name}_Lexicon.html`,
            });
            await file_handle.requestPermission({ mode: 'readwrite' });
            const file = await file_handle.createWritable();
            try {
                await file.write(exports);
            } catch (err) {
                vex.dialog.alert('The file failed to export. Please contact the developer for assistance.');
                console.log(err);
                await file.close();
                return;
            }
            await file.close();
            vex.dialog.alert('The file exported successfully.');
        },
        all: async () => {
            // Create HTML document object
            const export_container = document.createElement('html');
                                    
            // Create HTML header info
            const head = document.createElement('head');
            head.innerHTML = `
                <meta charset="UTF-8" />
                <title>${Lang().Name}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
            `;
                                    
            // Create export styles
            const styles = document.createElement('style');
            styles.innerHTML = indexCSS;
                                    
            const overrides = document.createElement('style');
            overrides.innerHTML = overridesCSS;
                                    
            let documentation: HTMLElement = document.createElement('div');
            // Convert EditorJS save data to HTML.
            await get(docsEditor).save().then(data => {
                documentation = editorjsToHTML(data, documentation);
            });
                                    
            // Create export body
            const body = document.createElement('body');
            body.innerHTML += `<h1>${Lang().Name}</h1>`;
            body.innerHTML += documentation.outerHTML;
            const alphabetical = alphabetize(Lang().Lexicon);
            body.innerHTML += '<hr/><h2>Lexicon</h2>';
            body.append(lexiconToHTML(alphabetical));
                                    
            head.append(styles, overrides);
            export_container.append(head, body);
                                    
            const export_data = export_container.outerHTML;
            const exports = new Blob(['\ufeff', export_data], {
                type: 'tex/html; charset=utf-8;',
            });
                                    
            const file_handle = await window.showSaveFilePicker({
                suggestedName: `${Lang().Name}.html`,
            });
            await file_handle.requestPermission({ mode: 'readwrite' });
            const file = await file_handle.createWritable();
            try {
                await file.write(exports);
            } catch (err) {
                vex.dialog.alert('The file failed to export. Please contact the developer for assistance.');
                console.log(err);
                await file.close();
                return;
            }
            await file.close();
            vex.dialog.alert('The file exported successfully.');
        },
        docs: async () => {
            // Create HTML document object
            const export_container = document.createElement('html');
                                    
            // Create HTML header info
            const head = document.createElement('head');
            head.innerHTML = `
                <meta charset="UTF-8" />
                <title>${Lang().Name} Docs</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
            `;
            // Create export styles
            const styles = document.createElement('style');
            styles.innerHTML = indexCSS;
                                    
            const overrides = document.createElement('style');
            overrides.innerHTML = overridesCSS;
            head.append(styles, overrides);
            export_container.appendChild(head);
                                    
            let body: HTMLElement = document.createElement('body');
            await get(docsEditor).save().then(data => {
                body = editorjsToHTML(data, body);
            });
            body.style.padding = '12em';
            body.classList.add('container');
            export_container.appendChild(body);
                                    
            const export_data = export_container.outerHTML;
            const exports = new Blob(['\ufeff', export_data], {
                type: 'tex/html; charset=utf-8;',
            });
            const file_handle = await window.showSaveFilePicker({
                suggestedName: `${Lang().Name}_Docs.html`,
            });
            await file_handle.requestPermission({ mode: 'readwrite' });
            const file = await file_handle.createWritable();
            try {
                await file.write(exports);
            } catch (err) {
                vex.dialog.alert('The file failed to export. Please contact the developer.');
                console.log(err);
                await file.close();
                return;
            }
            await file.close();
            vex.dialog.alert('The file exported successfully.');
        },
    },
};
function lexiconToHTML(alphabetical: string[]) {
    const row = document.createElement('div');
    row.classList.add('row');
    const col1 = document.createElement('div');
    col1.classList.add('column');
    const col2 = document.createElement('div');
    col2.classList.add('column');
    let current_column = false;
    alphabetical.forEach(entry => {
        let text = '';
        const pronunciations = Lang().Lexicon[entry].pronunciations;
        Object.entries(pronunciations).forEach(([lect, pronunciation]) => {
            text += `<p class="lect">${Lang().UseLects ? lect + ': ' : ''}<span class='pronunciation'>${pronunciation.ipa}</span></p>`;
        });
        const senses = Lang().Lexicon[entry].Senses;
        senses.forEach(({ lects, definition, tags }, i) => {
            if (Lang().UseLects) text += `<p class="lect">${lects.join(', ')}</p>`;
            text += `<div class='sense'>${i + 1}.</div>`;
            tags.forEach(tag => {
                text += `<div class='tag-item'>${tag}</div>`;
            });
            text += `<p>${markdownToHtml(definition)}</p>`;
        });
        if (current_column) {
            col2.innerHTML += `<div class="lex-entry"><p>${entry}</p>${text}</div>`;
        } else {
            col1.innerHTML += `<div class="lex-entry"><p>${entry}</p>${text}</div>`;
        }
        current_column = !current_column;
    });
    row.append(col1, col2);
    return row;
}
                        
/**
                        * Methods for opening files saved by previous versions of the app.
                        * @param {Object} contents
                        */
export const openLegacy = {
    /**
                            * This function can open 1.9 - 1.11 files.
                            */
    1.9: (contents) => {
        Language.set(Default);
        try {
            for (const key in contents.Lexicon) {
                Lang().Lexicon[key] = <Lexc.Word> {
                    pronunciations: <Lexc.EntryPronunciations> {
                        General: {
                            ipa: contents.Lexicon[key][0],
                            irregular: contents.Lexicon[key][2],
                        }
                    },
                    Senses: <Lexc.Sense[]> [{
                        definition: contents.Lexicon[key][1],
                        lects: ['General'],
                        tags: contents.Lexicon[key][3],
                    }],
                };
            }
        } catch (err) {
            window.alert('There was a problem loading the contents of the lexicon. Please contact the developer.');
            diagnostics.logError('Attempted to load a version 1.9 lexicon.', err);
        }
        try { Lang().Alphabet = contents.Alphabet; } catch (err) {
            window.alert('There was a problem loading the alphabetical order. Please contact the developer for assistance.');
            diagnostics.logError('Attempted to load a version 1.9 alphabet.', err);
        }
        try {
            Lang().Pronunciations.General = contents.Romanization;
            writeRomans('General');
        } catch (err) {
            window.alert('There was a problem loading the romanizations. Please contact the developer for assistance.');
            diagnostics.logError('Attempted to load version 1.9 romanizations.', err);
        }
        try { 
            for (const key in contents.Phrasebook) {
                Lang().Phrasebook[key] = <Lexc.PhraseCategory> (() => {
                    const phrases: Lexc.PhraseCategory = {};
                    for (const phrase in contents.Phrasebook[key]) {
                        phrases[phrase] = <Lexc.Phrase> {
                            description: contents.Phrasebook[key][phrase].description,
                            lects: ['General'],
                            pronunciations: <Lexc.EntryPronunciations> {
                                General: {
                                    ipa: contents.Phrasebook[key][phrase].pronunciation,
                                    irregular: false,
                                },
                            },
                            variants: (() => { 
                                const variants: {[index:string]: Lexc.Variant} = {};
                                for (const variant in contents.Phrasebook[key][phrase].variants) {
                                    variants[variant] = {
                                        description: contents.Phrasebook[key][phrase].variants[variant].description,
                                        pronunciations: <Lexc.EntryPronunciations> {
                                            General: {
                                                ipa: contents.Phrasebook[key][phrase].variants[variant].pronunciation,
                                                irregular: false,
                                            }
                                        },
                                    };
                                }
                                return variants;
                            })(),
                            tags: [],
                        };
                    }
                    return phrases;
                })();
            }
        } catch (err) {
            window.alert('There was a problem loading the phrasebook. Please contact the developer for assistance.');
            diagnostics.logError('Attempted to load a version 1.9 phrasebook.', err);
        }
        try {
            Lang().Phonotactics.General.Onsets = contents.Phonotactics.Initial.join(' ');
            Lang().Phonotactics.General.Medials = contents.Phonotactics.Middle.join(' ');
            Lang().Phonotactics.General.Codas = contents.Phonotactics.Final.join(' ');
            Lang().Phonotactics.General.Vowels = contents.Phonotactics.Vowel.join(' ');
            Lang().Phonotactics.General.Illegals = contents.Phonotactics.Illegal.join(' ');
        } catch (err) {
            window.alert('There was a problem loading the phonotactics data. Please contact the developer for assistance.');
            diagnostics.logError('Attempted to load version 1.9 phonotactics.', err);
        }
        try { 
            get(docsEditor).destroy();
            initializeDocs(contents.Docs); 
        } catch (err) {
            window.alert('There was a problem loading the documentation data. Please contact the developer for assistance.');
            diagnostics.logError('Attempted to load version 1.9 documentation.', err);
        }
        try { Lang().HeaderTags = contents.HeaderTags; } catch (err) {
            window.alert('There was a problem loading the header tags.');
            diagnostics.logError('Attempted to load version 1.9 header tags.', err);
        }
        Lang().IgnoreDiacritics = contents.IgnoreDiacritics;
        Lang().CaseSensitive = contents.CaseSensitive;
    },
};
                        
const csv = require('csv-parser');
                        
/**
                        * Imports a CSV file to the lexicon.
                        * @param {boolean} headers Whether or not the CSV file has headers.
                        * @param {number} words The column number of the words.
                        * @param {number} definitions The column number of the definitions.
                        */
export async function importCSV(headers: boolean, words: number, definitions: number, pronunciations: number|false, tags: number|false) {
    const data = [];
    let file_path: string;
    words -= 1;
    definitions -= 1;
    if (pronunciations) pronunciations -= 1;
    if (tags) tags -= 1;
    showOpenDialog(
        {
            title: 'Open CSV File',
            properties: ['openFile'],
        },
        path => {
            if (path === undefined) return;
            if (path[0].split('.').pop() !== 'csv') {
                vex.dialog.alert('A CSV file was not selected.');
                return;
            }
            file_path = path;
            fs.createReadStream(path[0])
                .pipe(csv({
                    headers: false,
                    skipLines: headers? 1 : 0,
                }))
                .on('data', (row) => {
                    data.push(row);
                })
                .on('end', () => {
                    console.log(data);
                    const lexicon: Lexc.Lexicon = { };
                    data.forEach(row => {
                        lexicon[row[words]] = <Lexc.Word> {
                            pronunciations: <Lexc.EntryPronunciations> {
                                General: {
                                    ipa: pronunciations? row[pronunciations] : get_pronunciation(row[words], Lang().Lects[0]),
                                    irregular: false,
                                }
                            },
                            Senses: <Lexc.Sense[]> [{
                                definition: row[definitions],
                                lects: [Lang().Lects[0]],
                                tags: tags? row[tags].split(/\s+/).map((tag: string) => tag.trim()) : [],
                            }]
                        };
                    });
                    console.log(lexicon);
                    get(Language).Lexicon = lexicon;
                    get(Language).Name = file_path[0].split('/')[file_path[0].split('/').length - 1].split('.')[0];
                                        
                    ipcRenderer.emit('update-lexicon-for-gods-sake-please');
                });
        }
    );
}
                            
const overridesCSS = `
                            @import url("https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,4000,7001,4001,700&display=swap");
                            body {
                                overflow-y: auto;
                                text-align: center;
                                margin-left: 15vw;
                                margin-right: 15vw;
                                background-color: #333;
                                color: #ccc;
                            }
                            
                            .container {
                                overflow-x: clip;
                                overflow-y: auto;
                            }
                            
                            .lex-body {
                                font-family: "Gentium Book Plus", serif;
                            }
                            
                            .tag-item {
                                font-family: serif;
                            }
                            
                            .search {
                                font-family: "Gentium Book Plus", serif;
                            }
                            
                            .phonology, .pronunciation {
                                font-family: "Gentium Book Plus", serif !important;
                            }
                            
                            [id=entry-counter] {
                                font-family: serif;
                            }
                            
                            td {
                                text-align: center;
                                border: 2px solid #ccc;
                            }
                            
                            tr {
                                background-color: transparent !important;
                            }
                            
                            table {
                                border-collapse: collapse;
                                margin: auto;
                            }
                            
                            .table-container, .table-title {
                                font-family: "Gentium Book Plus", serif;
                                align-items: center;
                            }
                            
                            button {
                                display: none;
                            }
                            
                            .info {
                                display: none;
                            }
                            
                            .search-row {
                                display: inline-flex;
                            }
                            
                            @media only screen and (min-device-width: 601px) {
                                .sidebar {
                                    max-width: 18% !important;
                                }
                            }
                            @media only screen and (max-device-width: 600px) {
                                body {
                                    width: 100vw !important;
                                    font-size: 12pt;
                                    padding: 2vw;
                                }
                                body > h1 {
                                    font-size: 36pt;
                                }
                                div.container {
                                    height: 60vh !important;
                                }
                                div.column {
                                    display: block;
                                }
                                div.sidebar {
                                    max-height: 18vh;
                                }
                                div.row {
                                    display: block;
                                    min-width: 96vw !important;
                                    margin-bottom: 36vh;
                                }
                                div.variants {
                                    margin-bottom: 4rem;
                                }
                                .lex-entry, .lex-body {
                                    font-size: 16pt !important;
                                }
                                .capitalize {
                                    font-size: 24pt !important;
                                }
                                .tag-item, [id=entry-counter] {
                                    font-size: 16pt;
                                }
                                .search, .sidebar p {
                                    font-size: 24pt;
                                }
                                td {
                                    font-size: 18pt !important;
                                }
                            }
                            `;
                            
const indexCSS = `
                            @charset "UTF-8";
                            html, body {
                                align-items: center;
                            }
                            
                            body {
                                font-family: serif;
                                font-size: 11pt;
                                min-width: 400px;
                                min-height: 400px;
                                margin: 0px;
                                overflow: hidden;
                                -webkit-app-region: drag;
                            }
                            
                            button {
                                font-family: serif;
                                font-size: 11pt;
                                transition-duration: 0.33s;
                                cursor: pointer;
                                -webkit-app-region: no-drag;
                                -webkit-user-select: none;
                            }
                            button[id=overwrite] {
                                font-weight: bold;
                            }
                            button.collapser {
                                max-width: 1em;
                                height: 100%;
                                border-color: transparent !important;
                                background-color: rgba(17, 17, 17, 0.0666666667);
                                display: flex;
                                float: right;
                                margin: 0px;
                                padding: 0px;
                            }
                            button.collapser:hover {
                                border-color: rgba(255, 255, 255, 0.2666666667) !important;
                                background-color: rgba(0, 0, 0, 0.2);
                            }
                            button.collapser::after {
                                content: "‖";
                                margin: auto;
                            }
                            button.collapser-h {
                                max-height: 1.33em;
                                width: 100% !important;
                                border-color: transparent !important;
                                background-color: rgba(17, 17, 17, 0.0666666667);
                                display: flex;
                                margin: 0px;
                                padding: 0px;
                            }
                            button.collapser-h:hover {
                                border-color: rgba(255, 255, 255, 0.2666666667) !important;
                                background-color: rgba(0, 0, 0, 0.2);
                            }
                            button.collapser-h::after {
                                content: "═";
                                margin: auto;
                            }
                            
                            .tab-container {
                                width: 100vw;
                                height: 100vh;
                                -webkit-user-select: none;
                            }
                            .tab-container .button-container {
                                width: 100%;
                                text-align: center;
                            }
                            .tab-container .button-container button {
                                border: none;
                                outline: none;
                                padding: 4px;
                                height: 100%;
                                width: fit-content;
                            }
                            .tab-container .window-control {
                                text-align: left;
                                height: 0px;
                                overflow: visible;
                            }
                            .tab-container .window-control button {
                                border: none;
                                outline: none;
                                background-color: transparent;
                            }
                            .tab-container .window-control button.close:hover {
                                background-color: #9e0f0f;
                            }
                            .tab-container .window-control button.minimize:hover {
                                background-color: #c9c911;
                            }
                            .tab-container .window-control button.maximize:hover {
                                background-color: #4eb94e;
                            }
                            .tab-container .tab-pane {
                                height: 80%;
                                box-sizing: border-box;
                                -webkit-app-region: no-drag;
                                -webkit-user-select: text;
                            }
                            
                            .row {
                                display: flex;
                                margin: auto;
                            }
                            .row:has(~ .collapsible-row .collapsed) {
                                height: 90vh !important;
                            }
                            
                            .column {
                                width: 100%;
                            }
                            
                            .collapsible-column {
                                min-width: 2%;
                                width: fit-content;
                            }
                            
                            .collapsible-row:has(.collapsed) {
                                height: 3vh !important;
                            }
                            
                            .collapsed {
                                display: none;
                            }
                            
                            .text-left {
                                text-align: left;
                            }
                            .text-right {
                                text-align: right;
                            }
                            .text-center {
                                text-align: center;
                            }
                            
                            .prelined {
                                white-space: pre-line;
                                /* This is solely to make the \n character work from the JS side */
                            }
                            
                            p {
                                margin: 0px;
                            }
                            
                            div[id=tables-pane] {
                                font-family: Gentium;
                                font-size: 11pt;
                            }
                            
                            h1, h2, h3, h4, h5, h6 {
                                font-style: italic;
                                padding-top: 1em !important;
                            }
                            
                            .info {
                                font-family: serif;
                                font-size: 11pt;
                                font-style: italic;
                                line-height: 1.5em;
                                -webkit-user-select: none;
                            }
                            
                            .phonology {
                                font-family: Gentium;
                                font-size: 11pt;
                                width: 95%;
                            }
                            
                            .version-info {
                                font-family: serif;
                                font-size: 7pt;
                                text-align: left;
                                display: inline;
                                float: right;
                                -webkit-user-select: none;
                            }
                            
                            .lex-body {
                                white-space: pre-line;
                            }
                            .lex-entry {
                                font-family: Gentium;
                                font-size: 11pt;
                                transition: 0.3s;
                                padding: 1em;
                            }
                            
                            .variants {
                                font-family: Gentium;
                                font-size: 11pt;
                            }
                            .variants div.column {
                                margin: 0.6em;
                            }
                            
                            .capitalize {
                                text-transform: capitalize;
                            }
                            
                            .tag-item {
                                font-family: serif;
                                font-size: 7pt;
                                border-radius: 7%;
                                width: fit-content;
                                padding: 0.2em;
                                margin: 0.2em;
                                text-transform: uppercase;
                                display: inline-block;
                            }
                            
                            .sense {
                                font-family: Gentium;
                                font-size: 9pt;
                                border-radius: 7%;
                                width: fit-content;
                                padding: 0.2em;
                                margin: 0.2em;
                                font-weight: bold;
                                font-style: italic;
                                display: inline-block;
                                background-color: transparent;
                                margin-top: 1em;
                            }
                            
                            .lect {
                                font-family: serif;
                                font-size: 9pt;
                                font-style: italic;
                                margin-top: 0.1em;
                            }
                            
                            [id=entry-counter] {
                                font-family: serif;
                                font-size: 7pt;
                                border-radius: 7%;
                                width: fit-content;
                                padding: 0.2em;
                                margin: 0.2em;
                                text-transform: uppercase;
                                font-weight: bold;
                                margin: auto;
                            }
                            
                            .scrolled {
                                overflow-y: auto;
                                overflow-x: wrap;
                            }
                            
                            .container {
                                border-radius: 6px;
                                text-align: center;
                                margin: 6px;
                                padding: 6px;
                            }
                            
                            .row button {
                                padding: 2px 10px 2px 10px;
                                margin: 4px auto 4px auto;
                                display: flex;
                                width: fit-content;
                                border: 1px solid black;
                                border-radius: 8px;
                            }
                            
                            label {
                                font-family: serif;
                                font-size: 11pt;
                                -webkit-user-select: none;
                            }
                            
                            .pronunciation {
                                font-family: Gentium;
                                font-size: 9pt;
                            }
                            
                            textarea, input {
                                font-family: Gentium;
                                font-size: 11pt;
                                display: flex;
                                text-align: center;
                                padding: 4px;
                                margin: 1px auto 1px auto;
                                border: none;
                                border-radius: 3px;
                                width: 80%;
                                resize: vertical;
                                transition: 0.2s;
                            }
                            textarea .pronunciation, input .pronunciation {
                                font-family: Gentium;
                                font-size: 9pt;
                            }
                            textarea[type=number], input[type=number] {
                                padding: 1px;
                                width: 4em;
                            }
                            textarea[type=checkbox], input[type=checkbox] {
                                appearance: none;
                                margin: auto;
                                font: inherit;
                                width: 1rem;
                                height: 1rem;
                                border-radius: 0.15em;
                                transform: translateY(-0.075em);
                                display: grid;
                                place-content: center;
                            }
                            textarea[type=checkbox]::before, input[type=checkbox]::before {
                                content: "";
                                width: 0.65em;
                                height: 0.65em;
                                transform: scale(0);
                                transition: 120ms transform ease-in-out;
                            }
                            textarea[type=checkbox]:checked::before, input[type=checkbox]:checked::before {
                                transform: scale(1);
                                clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                            }
                            
                            .header input {
                                width: 70%;
                            }
                            
                            .narrow {
                                width: 50%;
                                margin: auto;
                            }
                            .narrow-col {
                                width: 15%;
                            }
                            
                            .search {
                                text-align: left;
                                width: 100%;
                                margin: 2px auto 2px auto;
                            }
                            
                            .search-container {
                                padding: 0 0.5em 0 0.5em;
                                position: relative;
                            }
                            
                            table {
                                border-collapse: collapse;
                                width: 95%;
                            }
                            table-container {
                                font-family: Gentium;
                                font-size: 11pt;
                                margin: auto;
                                padding: 30px 5%;
                            }
                            table-title {
                                font-family: Gentium;
                                font-size: 14pt;
                                font-style: italic;
                            }
                            
                            td {
                                padding: 2px 6px 2px 6px;
                                text-align: center;
                                user-select: none;
                            }
                            
                            .inflection {
                                font-family: Gentium;
                                font-size: 7pt;
                            }
                            .inflection h1, .inflection h2, .inflection h3, .inflection h4, .inflection h5, .inflection h6 {
                                padding-top: 0.2em;
                            }
                            .inflection h1 {
                                font-size: 1.5em;
                            }
                            .inflection h2 {
                                font-size: 1.3em;
                            }
                            .inflection h3 {
                                font-size: 1.1em;
                            }
                            .inflection h4 {
                                font-size: 1em;
                            }
                            .inflection h5 {
                                font-size: 0.9em;
                            }
                            .inflection h6 {
                                font-size: 0.8em;
                            }
                            
                            ::-webkit-scrollbar {
                                width: 9px;
                            }
                            ::-webkit-scrollbar-thumb {
                                border-radius: 6px;
                                transition: 0.2s;
                            }
                            ::-webkit-scrollbar-button {
                                display: none;
                            }
                            ::-webkit-scrollbar-corner {
                                border-radius: 6px 0px 0px 0px;
                            }
                            ::-webkit-resizer {
                                border-radius: 6px 0px 0px 0px;
                            }
                            
                            hr {
                                margin-bottom: 0.2em;
                                margin-top: 0.2em;
                                max-width: 66.66%;
                                padding: 0px;
                            }
                            
                            .milkyWay {
                                width: 100px;
                                height: 100px;
                                background: transparent;
                                margin: auto;
                                position: relative;
                                border-radius: 50%;
                            }
                            .milkyWay .planet {
                                border: 1px solid white;
                                animation-name: orbit;
                                animation-iteration-count: infinite;
                                animation-timing-function: linear;
                                animation-play-state: paused;
                            }
                            .milkyWay .planet::before, .milkyWay .planet::after {
                                position: absolute;
                                content: "";
                                display: block;
                                border-radius: 50%;
                            }
                            .milkyWay > div {
                                position: absolute;
                                border-radius: 50%;
                            }
                            
                            .sun {
                                background: #faca09;
                                width: 10%;
                                height: 10%;
                                top: 45%;
                                left: 45%;
                            }
                            
                            .mercury {
                                width: 20%;
                                height: 20%;
                                top: calc(40% - 1px);
                                left: calc(40% - 1px);
                                animation-duration: 2s;
                            }
                            .mercury::before {
                                background: #9fb5b6;
                                width: 16%;
                                height: 16%;
                                top: -8%;
                                left: 42%;
                            }
                            
                            .venus {
                                width: 30%;
                                height: 30%;
                                top: calc(35% - 1px);
                                left: calc(35% - 1px);
                                animation-duration: 3s;
                            }
                            .venus::before {
                                background: #ECC98E;
                                width: 10%;
                                height: 10%;
                                top: -5%;
                                left: 45%;
                            }
                            
                            .earth {
                                width: 40%;
                                height: 40%;
                                top: calc(30% - 1px);
                                left: calc(30% - 1px);
                                animation-duration: 4s;
                            }
                            .earth::before {
                                background: #208fd8;
                                width: 10%;
                                height: 10%;
                                top: -5%;
                                left: 45%;
                            }
                            .earth::after {
                                background: #33c470;
                                width: 10%;
                                height: 6%;
                                top: -3%;
                                left: 45%;
                                transform: rotate(45deg);
                            }
                            
                            .mars {
                                width: 50%;
                                height: 50%;
                                top: calc(25% - 1px);
                                left: calc(25% - 1px);
                                animation-duration: 5s;
                            }
                            .mars::before {
                                background: #d35400;
                                width: 6%;
                                height: 6%;
                                top: -3%;
                                left: 47%;
                            }
                            
                            .jupiter {
                                width: 60%;
                                height: 60%;
                                top: calc(20% - 1px);
                                left: calc(20% - 1px);
                                animation-duration: 6s;
                            }
                            .jupiter::before {
                                background: #d4975a;
                                width: 10%;
                                height: 10%;
                                top: -5%;
                                left: 45%;
                            }
                            
                            .saturn {
                                width: 70%;
                                height: 70%;
                                top: calc(15% - 1px);
                                left: calc(15% - 1px);
                                animation-duration: 7s;
                            }
                            .saturn::before {
                                background: #E4D191;
                                width: 7%;
                                height: 7%;
                                top: -4%;
                                left: 48%;
                            }
                            .saturn::after {
                                background: #F0E4C1;
                                width: 12%;
                                height: 1%;
                                top: -1%;
                                left: 45.5%;
                                transform: rotate(-15deg);
                            }
                            
                            .uranus {
                                width: 80%;
                                height: 80%;
                                top: calc(10% - 1px);
                                left: calc(10% - 1px);
                                animation-duration: 8s;
                            }
                            .uranus::before {
                                background: #3498db;
                                width: 5%;
                                height: 5%;
                                top: -2%;
                                left: 48%;
                            }
                            .uranus::after {
                                background: #b0d0e5;
                                width: 8%;
                                height: 0.5%;
                                top: 0%;
                                left: 46.25%;
                                transform: rotate(-15deg);
                            }
                            
                            .neptune {
                                width: 90%;
                                height: 90%;
                                top: calc(5% - 1px);
                                left: calc(5% - 1px);
                                animation-duration: 9s;
                            }
                            .neptune::before {
                                background: #1269a3;
                                width: 4%;
                                height: 4%;
                                top: -1%;
                                left: 49%;
                            }
                            .neptune::after {
                                background: #91cbf2;
                                width: 6%;
                                height: 0.5%;
                                top: 0.5%;
                                left: 48%;
                                transform: rotate(-15deg);
                            }
                            
                            .pluto {
                                width: 100%;
                                height: 100%;
                                top: calc(0% - 1px);
                                left: calc(0% - 1px);
                                animation-duration: 10s;
                            }
                            .pluto::before {
                                background: #b78c7a;
                                width: 1%;
                                height: 1%;
                                top: -0.5%;
                                left: 49.5%;
                            }
                            
                            @keyframes orbit {
                                0% {
                                    transform: rotate(-180deg);
                                }
                                100% {
                                    transform: rotate(180deg);
                                }
                            }
                            /* EditorJS Overrides */
                            .ce-toolbar__plus {
                                transition: 0.33s;
                            }
                            .ce-toolbar__content {
                                max-width: 90% !important;
                            }
                            .ce-block__content {
                                max-width: 80% !important;
                            }
                            .ce-block--selected .ce-block__content {
                                background-color: rgba(255, 255, 255, 0.3333333333) !important;
                            }
                            
                            ::selection {
                                background-color: rgba(255, 255, 255, 0.3333333333) !important;
                            }
                            
                            /*# sourceMappingURL=index.css.map */
                            
                            `;
                            