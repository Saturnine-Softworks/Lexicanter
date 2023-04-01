/* eslint-disable @typescript-eslint/no-var-requires */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const vex = require('vex-js');
import { get } from 'svelte/store';
import type { OutputData } from '@editorjs/editorjs';
import type * as Lexc from '../types';
import { Language, autosave, docsEditor, theme } from '../stores';
import { writeRomans, get_pronunciation } from './phonetics';
import { initializeDocs } from './docs';
import * as diagnostics from './diagnostics';
import { alphabetize } from './alphabetize';
import { markdownToHtml } from './markdown';

const Lang = () => get(Language);

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
    await get(docsEditor).save().then(data => {
        Lang().Docs = data;
    });
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
                vex.dialog.alert('The file has been saved.');
            } else {
                new Notification(`The ${Lang().Name} file has been auto-saved.`);
            }
        } catch (err) {
            window.alert(
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
            styles.innerHTML = fs.readFileSync(
                path.resolve(`src${path.sep}styles${path.sep}index.css`),
                'utf8'
            );
            const themeElement = document.createElement('style');
            themeElement.innerHTML = fs.readFileSync(
                path.resolve(`src${path.sep}` + get(theme)),
                'utf8'
            );
            const overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(
                path.resolve(`src${path.sep}styles${path.sep}html_export.css`),
                'utf8'
            );
    
            // Create export body
            const body = document.createElement('body');
            body.innerHTML += `<h1>${Lang().Name}</h1>`;
            const alphabetical = alphabetize(Lang().Lexicon);
            body.innerHTML += '<hr/><h2>Lexicon</h2>';
            alphabetical.forEach(entry => {
                let text = '';
                const pronunciations = Lang().Lexicon[entry].pronunciations;
                Object.entries(pronunciations).forEach(([lect, pronunciation]) => {
                    text += `<p class="lect">${lect}: <span class='pronunciation'>${pronunciation.ipa}</span></p>`;
                });
                const senses = Lang().Lexicon[entry].Senses;
                senses.forEach(({lects, definition, tags}, i) => {
                    text += `<p class="lect">${lects.join(', ')}</p>`;
                    text += `<div class='sense'>${i+1}.</div>`;
                    tags.forEach(tag => {
                        text += `<div class='tag-item'>${tag}</div>`;
                    });
                    text += `<p>${markdownToHtml(definition)}</p>`;
                });
                body.innerHTML += `<div class="lex-entry"><p>${entry}</p>${text}</div>`;
            });
    
            head.append(styles, themeElement, overrides);
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
            styles.innerHTML = fs.readFileSync(
                `src${path.sep}styles${path.sep}index.css`,
                'utf8'
            );
            const themeElement = document.createElement('style');
            themeElement.innerHTML = fs.readFileSync(
                `src${path.sep}` + get(theme),
                'utf8'
            );
            const overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(
                `src${path.sep}styles${path.sep}html_export.css`,
                'utf8'
            );
    
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
            alphabetical.forEach(entry => {
                let text = '';
                const pronunciations = Lang().Lexicon[entry].pronunciations;
                Object.entries(pronunciations).forEach(([lect, pronunciation]) => {
                    text += `<p class="lect">${lect}: <span class='pronunciation'>${pronunciation.ipa}</span></p>`;
                });
                const senses = Lang().Lexicon[entry].Senses;
                senses.forEach(({lects, definition, tags}, i) => {
                    text += `<p class="lect">${lects.join(', ')}</p>`;
                    text += `<div class='sense'>${i+1}.</div>`;
                    tags.forEach(tag => {
                        text += `<div class='tag-item'>${tag}</div>`;
                    });
                    text += `<p>${markdownToHtml(definition)}</p>`;
                });
                body.innerHTML += `<div class="lex-entry"><p>${entry}</p>${text}</div>`;
            });
    
            head.append(styles, themeElement, overrides);
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
            styles.innerHTML = fs.readFileSync(
                `src${path.sep}styles${path.sep}index.css`,
                'utf8'
            );
            const themeElement = document.createElement('style');
            themeElement.innerHTML = fs.readFileSync(
                `src${path.sep}` + get(theme),
                'utf8'
            );
            const overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(
                `src${path.sep}styles${path.sep}html_export.css`,
                'utf8'
            );
            head.append(styles, themeElement, overrides);
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

/**
 * Methods for opening files saved by previous versions of the app.
 * @param {Object} contents
 */
export const openLegacy = {
    /**
     * This function can open 1.9 - 1.11 files.
     */
    1.9: (contents) => {
        Language.set({ // default values
            Version: '2.0.0',
            Name: 'Unnamed Language',
            CaseSensitive: false,
            IgnoreDiacritics: true,
            ShowEtymology: false,
            ShowInflection: false,
            Inflections: [],
            UseLects: false,
            HeaderTags: '',
            Alphabet: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
            Lexicon: <Lexc.Lexicon> { },
            Etymologies: <Lexc.Etymologies> { },
            Relatives: { },
            Pronunciations: <Lexc.Pronunciations> {
                General: 'place > holder'
            },
            Phonotactics: <Lexc.Phonotactics> {
                General: <Lexc.PhonotacticsLect> {
                    Onsets: '',
                    Medials: '',
                    Codas: '',
                    Vowels: '',
                    Illegals: '',
                }
            },
            Lects: ['General'],
            Phrasebook: <Lexc.Phrasebook> { },
            Docs: <OutputData> {
                blocks: [ ]
            },
            Diagnostics: <Lexc.Diagnostic[]> [ ]
        });
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
