/* eslint-disable @typescript-eslint/no-var-requires */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
import { get } from 'svelte/store';
import type { OutputData } from '@editorjs/editorjs';
import type * as Lexc from '../types';
import { Language, autosave, docsEditor, theme } from '../stores';
import { writeRomans, get_pronunciation } from './phonetics';
import { initializeDocs } from './docs';
import * as diagnostics from './diagnostics';

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
    if (!Lang().Name.trim()) {
        const name = window.prompt(
            'Please enter a file name before saving.'
        );
        Lang().Name = name;
    }
    const exports = await collectExportData();
    try {
        userData(user_path => {
            const lexiconFolder = `${user_path}${path.sep}Lexicons${path.sep}`;
            const backupsFolder = `${user_path}${path.sep}Backups${path.sep}`;
            const timestamp = new Date().toString().split(' GMT')[0].replaceAll(':', '⦂');
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
            window.alert('The file has been saved.');
        } else {
            new Notification(`The ${Lang().Name} file has been auto-saved.`);
        }
    } catch (err) {
        window.alert(
            'There was a problem saving your file. Please contact the developer.'
        );
        console.log(err);
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
        const arr_data = [['Word', 'Pronunciation', 'Definition']];
        for (const key in $lexicon) {
            arr_data.push([key, $lexicon[key][0], $lexicon[key][1]]);
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
            // Create export scripts
            const scripts = document.createElement('script');
            scripts.innerHTML = `
                const lex_body = document.getElementById('lex-body');
                const entry_count = document.getElementById('entry-counter');
                const srch_wrd = document.getElementById('search-wrd');
                const srch_def = document.getElementById('search-def');
                const srch_tag = document.getElementById('search-tag');
                const srch_phrase = document.getElementById('search-phrase');
                const srch_descriptions = document.getElementById('search-description');
                const cat_body = document.getElementById('category-body');
                const book_body = document.getElementById('phrasebook-body');
                const variant_body = document.getElementById('variants-body');
                const lexicon = ${JSON.stringify(Lang().Lexicon)};
                const phrasebook = ${JSON.stringify(Lang().Phrasebook)};
                let selected_cat;
    
                function sort_lex_keys() {
                    let htags = ${JSON.stringify(
        Lang().HeaderTags.toLowerCase().trim().split(/\\s+/)
    )};
                    let all_words = structuredClone(lexicon)
                    let tag_ordered_lexes = []
                    for (let tag of htags) {
                        tag_ordered_lexes.push([])
                        for (let word in all_words) {
                            if (lexicon[word][3].includes(tag)) {
                                tag_ordered_lexes[tag_ordered_lexes.length-1].push(word)
                            }
                        }
                        // console.log(tag_ordered_lexes, tag_ordered_lexes[tag_ordered_lexes.length-1])
                        for (let w of tag_ordered_lexes[tag_ordered_lexes.length-1]) {
                            delete all_words[w];
                        }
                    }
                    let remaining_words = []
                    for (let w in all_words) {remaining_words.push(w)}
                    tag_ordered_lexes.push(remaining_words)
                
                    // Lowercase alphabet if case-sensitivity is unticked
                    var alphabet = ${
    Lang().CaseSensitive
        ? JSON.stringify(Lang().Alphabet.trim()) 
        : JSON.stringify(Lang().Alphabet.trim().toLowerCase())
};
                    let order = alphabet.trim().split(/\\s+/);
                    // to make sure we find the largest tokens first, i.e. for cases where 'st' comes before 'str' alphabetically
                    find_in_order = Array.from(new Set(order)).sort((a, b) => b.length - a.length); // descending, ensures uniqueness
                
                    let final_sort = [];
                    for (let group of tag_ordered_lexes) {
                        let lex = {};
                        let list = [];
                        for (let word of group) {
                            // case sensitivity
                            let w = ${ Lang().CaseSensitive? 'word' : 'word.toLowerCase()' };
                
                            // diacritic sensitivity
                            w = ${ Lang().IgnoreDiacritics? 'w.normalize("NFD").replace(/\\p{Diacritic}/gu, "")' : 'w' };
                
                            for (let token of find_in_order) {
                                w = w.replace(new RegExp(\`\${token}\`, 'g'), \`\${order.indexOf(token)}.\`)
                            }
                            append = w.split('.');
                            for (let i of append) { append[append.indexOf(i)] = +i || 0 }
                            lex[word] = append;
                            list.push(append);
                        }
                        list.sort( (a, b) => {
                            for (let i of a) {
                                let j = b[a.indexOf(i)];
                                if (i === j) { continue };
                                return i - j;
                            }
                            return 0;
                        });
                        let sorted = [];
                        for (let key in lex) { sorted.push([key, list.indexOf(lex[key])]) } // [ [word, index], [word, index], ...]
                        sorted.sort((a, b) => a[1] - b[1]);
                        for (let i = 0; i < sorted.length; i++) {
                            sorted[i] = sorted[i][0];
                        }
                        for (let i of sorted) {
                            final_sort.push(i)
                        }
                    }
                    return final_sort;
                }
                function rewrite_entries(keys = false) {
                    let sorted_keys = sort_lex_keys();
                    lex_body.replaceChildren();
                
                    if (sorted_keys.length !== 0) {
                        for (let key of sorted_keys) {
                            if ( !keys || keys.includes(key) ) {
                                let entry = document.createElement('div');
                                entry.className = 'lex-entry';
                                entry.id = key;
                                
                                let word = document.createElement('p');
                                word.appendChild( document.createTextNode(key) );
                                word.style.fontStyle = 'italic';
                                
                                let pron = document.createElement('p');
                                pron.className = 'pronunciation';
                                pron.appendChild( document.createTextNode(lexicon[key][0]) );
                                
                                let defn = document.createTextNode(lexicon[key][1]);
                                
                                let tags = document.createElement('div');
                                for (let tag of lexicon[key][3]) {
                                    let newTag = document.createElement('div');
                                    newTag.appendChild( document.createTextNode(tag) );
                                    newTag.className = 'tag-item';
                                    tags.appendChild(newTag);
                                }
                                
                                entry.append(word, pron, tags, defn);
                
                                lex_body.appendChild(entry);
                            }
                        }
                    }
                    if (!keys) {
                        var count = document.createTextNode(\`\${Object.keys(lexicon).length} Entries\`);
                    } else {
                        var count = document.createTextNode(\`\${keys.length} Matches\`);
                    }
                    entry_count.replaceChildren(count)
                }
                function search_lex() {
                    let s = srch_wrd.value.trim();
                    let z = srch_def.value.toLowerCase().trim();
                    let x = srch_tag.value.trim();
                    if (s === 'Search by word…'){s = ''};
                    if (z === 'search definition…'){z = ''};
                    if (x === 'Search by tags…' || x === ''){ x = [] } else { x = x.split(/\\s+/g) }
                    let keys = false;
                    if (s !== '' || z !== '' || x.length !== 0 ) {
                        let l = [s + '|', z + '|'];
                        // Turn l into a list of [search by word terms, search by def terms]
                        for (let e of l) {
                            let n = l.indexOf(e);
                            l[n] = [];
                            e = e.split('|');
                            for (let a of e) { l[n].push( a.trim() ); }
                        }
                        keys = [];
                        for (let word in lexicon) {
                            let w = \`^\${word}^\`;
                            let match = true;
                            for (let a of l[0]) { // words
                                if ( !w.includes(a) ) { match = false; }
                            }
                            for (let a of l[1]) { // definitions
                                if ( !lexicon[word][1].toLowerCase().includes(a) ) { match = false; }
                            }
                            if (lexicon[word][3].length !== 0) {
                                let any_tag_match;
                                for (let tag of lexicon[word][3]) {
                                    for (let a of x) { // tags
                                        if (\`^\${tag}^\`.includes(a)) { any_tag_match = true; }
                                    }
                                }
                                if (!any_tag_match) { match = false; }
                            } else {
                                if (x.length !== 0) { match = false; }
                            }
                            if (match) { keys.push(word); }
                        }
                    }
                    rewrite_entries(keys);
                }
                srch_wrd.onkeyup = search_lex; 
                srch_def.onkeyup = search_lex;
                srch_tag.onkeyup = search_lex;
                srch_wrd.onfocus = function() {
                    if (srch_wrd.value === 'Search by word…') {
                        srch_wrd.style.color = 'white';
                        srch_wrd.value = '';
                    }
                }
                srch_wrd.onblur = function() {
                    if (srch_wrd.value === '') {
                        srch_wrd.value = 'Search by word…';
                    }
                }
                srch_def.onfocus = function() {
                    if (srch_def.value === 'Search definition…') {
                        srch_def.style.color = 'white';
                        srch_def.value = '';
                    }
                }
                srch_def.onblur = function() {
                    if (srch_def.value === '') {
                        srch_def.value = 'Search definition…';
                    }
                }
                srch_tag.onfocus = function() {
                    if (srch_tag.value === 'Search by tags…') {
                        srch_tag.style.color = 'white';
                        srch_tag.value = '';
                    }
                }
                srch_tag.onblur = function() {
                    if (srch_tag.value === '') {
                        srch_tag.value = 'Search by tags…';
                    }
                }
                srch_wrd.onblur(); srch_def.onblur(); srch_tag.onblur();
                
                function update_book(keys=false) {
                    if (!keys) { keys = [false] }
                    if (selected_cat) { // make sure category isn't blank
                        while (book_body.firstChild) {
                            book_body.removeChild(book_body.lastChild)
                        }
                        let title = document.createElement("p");
                        title.classList = 'table-title capitalize';
                        title.appendChild( document.createTextNode( selected_cat.toLowerCase()) );
                        book_body.append(title, /* document.createElement('hr') */ );
                
                        for (let entry in phrasebook[selected_cat]) {
                            if (keys.indexOf(entry) !== -1 || keys[0] === false) {
                                // base entry
                                let entry_container = document.createElement('div');
                                entry_container.className = 'lex-entry';
                                let phrase = document.createElement('p');
                                phrase.appendChild( document.createTextNode(entry) );
                                phrase.style.fontStyle = 'italic';
                                let pron = document.createElement('p');
                                pron.className = 'pronunciation';
                                pron.appendChild( document.createTextNode(phrasebook[selected_cat][entry].pronunciation) );
                                let desc = document.createElement('p');
                                desc.className = 'prelined';
                                desc.appendChild( document.createTextNode(phrasebook[selected_cat][entry].description) );
                                entry_container.append(phrase, pron, desc);
                                // variant entries
                
                                if ( Object.keys(phrasebook[selected_cat][entry].variants).length > 0) {
                                    let t = document.createElement('p');
                                    t.appendChild( document.createTextNode('⋲ ᴠᴀʀɪᴀɴᴛꜱ ⋺') );
                                    entry_container.append(t);
                
                                    var it = 0;
                                    var crow = document.createElement('div');
                                    crow.classList = 'row variants';
                                    entry_container.appendChild(crow);
                                    for (variant in phrasebook[selected_cat][entry].variants) {
                                        it++;
                                        if (it === 4) {
                                            it = 0;
                                            entry_container.appendChild(crow);
                                            var crow = document.createElement('div');
                                            crow.classList = 'row variants';
                                            entry_container.appendChild(crow);
                                        }
                                        let vcol = document.createElement('div');
                                        vcol.className = 'column';
                
                                        let v_phrase = document.createElement('p');
                                        v_phrase.appendChild( document.createTextNode(variant) );
                                        v_phrase.style.fontStyle = 'italic';
                                        let v_pron = document.createElement('p');
                                        v_pron.className = 'pronunciation';
                                        v_pron.appendChild( document.createTextNode(phrasebook[selected_cat][entry].variants[variant].pronunciation) );
                                        let v_desc = document.createElement('p');
                                        v_desc.className = 'prelined';
                                        v_desc.appendChild( document.createTextNode(phrasebook[selected_cat][entry].variants[variant].description) );
                        
                                        vcol.append(v_phrase, v_pron, v_desc);
                                        crow.appendChild(vcol);                    
                                    }
                                }
                
                                entry_container.addEventListener('click', () => edit_book_entry(entry)); // edit functionality
                                book_body.appendChild(entry_container);
                            }
                        }
                    } else { book_body.replaceChildren(); }
                }
                
                function update_categories() {
                    while (cat_body.firstChild) {
                        cat_body.removeChild(cat_body.lastChild);
                    }
                    for (let cat in phrasebook) {
                        let i = document.createElement("div");
                        i.appendChild( document.createTextNode(cat) );
                        i.className = 'lex-entry capitalize';
                        i.onclick = function () { 
                            selected_cat = cat; 
                            update_book();
                        };
                        cat_body.appendChild(i);
                    };
                    update_book();
                }
                
                srch_phrase.onfocus = function() {
                    if (srch_phrase.value === 'Search by phrase…') {
                        srch_phrase.style.color = 'white';
                        srch_phrase.value = '';
                    }
                }
                srch_phrase.onblur = function() {
                    if (srch_phrase.value === '') {
                        srch_phrase.value = 'Search by phrase…';
                    }
                }
                srch_descriptions.onfocus = function() {
                    if (srch_descriptions.value === 'Search descriptions…') {
                        srch_descriptions.style.color = 'white';
                        srch_descriptions.value = '';
                    }
                }
                srch_descriptions.onblur = function() {
                    if (srch_descriptions.value === '') {
                        srch_descriptions.value = 'Search descriptions…';
                    }
                }
                srch_phrase.onblur(); srch_descriptions.onblur();
                
                function search_book() {
                    let scope = phrasebook[selected_cat];
                    let ps = srch_phrase.value.trim();
                    let ds = srch_descriptions.value.toLowerCase().trim();
                    if (ps === 'Search by phrase…') {ps = ''};
                    if (ds === 'search descriptions…') {ds = ''};
                    let keys = false;
                    if (ps !== '' || ds !== '') {
                        keys = [];
                        for (let entry in scope) {
                            let term = '^' + entry + '^';
                            let pm = !ps.length;
                            let dm = !ds.length;
                            // console.log(scope[entry].description, scope[entry].description.includes(ds));
                            if (term.includes(ps)) {
                                pm = true;
                            }
                            if ( scope[entry].description.toLowerCase().includes(ds) ) {
                                dm = true;
                            } 
                            for (let variant in scope[entry].variants) {
                                let v_term = '^' + variant + '^';
                                if (v_term.includes(ps)) {
                                    pm = true;
                                }
                                if (scope[entry].variants[variant].description.toLowerCase().includes(ds)) {
                                    dm = true;
                                }
                            }
                            console.log(pm, dm, ps, ds, entry);
                            if (pm && dm) {
                                keys.push(entry);
                            }
                        }
                    }
                    update_book(keys);
                }
                srch_phrase.onkeyup = search_book;
                srch_descriptions.onkeyup = search_book;
    
                update_book();
                update_categories();
                rewrite_entries();
            `;
            // Create export styles
            const styles = document.createElement('style');
            styles.innerHTML = fs.readFileSync(
                path.join(path.dirname(__dirname), 'styles/index.css'),
                'utf8'
            );
            const themeElement = document.createElement('style');
            themeElement.innerHTML = fs.readFileSync(
                path.join(path.dirname(__dirname), get(theme)),
                'utf8'
            );
            const overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(
                path.join(path.dirname(__dirname), 'styles/html_export.css'),
                'utf8'
            );
    
            let documentation: HTMLElement = document.createElement('div');
            documentation.classList.add('container', 'column', 'scrolled');
            // Convert EditorJS save data to HTML.
            await get(docsEditor).save().then(data => {
                documentation = editorjsToHTML(data, documentation);
            });
    
            // Create export body
            const body = document.createElement('body');
            body.innerHTML = `
                <h1>${Lang().Name}</h1>
                <div class='tab-pane text-center'>
                    <div class="row" style="max-height: 90vh">
                        <div class='container column'>
                            <div class='search-row'>
                                <div class="column">
                                    <label for="search-wrd" style="display: none">Search by word</label>
                                    <input id="search-wrd" type="text" class="search" />
                                </div>
                                <div class="column">
                                    <label for="search-tag" style="display: none">Search by tags</label>
                                    <input id="search-tag" type="text" class="search" />
                                </div>
                            </div>
                            <label for="search-def" style="display: none">Search definitions</label>
                            <input id="search-def" type="text" class="search">
                            <div class='scrolled' style="height: 64vh">
                                <p class="prelined lex-body" id="lex-body">The lexicon should appear here.</p>
                            </div>
                            <p id="entry-counter"></p>
                        </div>
                        ${documentation.outerHTML}
                    </div>
    
                    <!-- Phrasebook -->
                    <div class="row" style="height:90vh;">
                        <!-- Categories -->
                        <div class="container column sidebar">
                            <p>Categories</p>
                            <hr />
                            <div class="column scrolled" style="max-height: 90%;" id="category-body">
                                <p class="info">Phrasebook categories appear here.</p>
                            </div>
                        </div>
                        <div class="container column">
                            <!-- Search Fields -->
                            <div class="search-row">
                                <div class="column">
                                    <label for="search-phrase" style="display: none">Search by phrase…</label>
                                    <input id="search-phrase" type="text" class="search" />
                                </div>
                                <div class="column">
                                    <label for="search-description" style="display: none">Search descriptions…</label>
                                    <input id="search-description" type="text" class="search" />
                                </div>
                            </div>
                            <!-- Book -->
                            <div class="column scrolled" id="phrasebook-body" style="max-height: 80%;">
                                <p class="info">Select a category from the left.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <br><br>
            `;
    
            head.append(styles, themeElement, overrides);
            export_container.append(head, body, scripts);
    
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
                console.log(typeof exports);
                await file.write(exports);
            } catch (err) {
                window.alert('The file failed to export. Please contact the developer for assistance.');
                console.log(err);
                await file.close();
                return;
            }
            await file.close();
            window.alert('The file exported successfully.');
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
                path.join(path.dirname(__dirname), 'styles/index.css'),
                'utf8'
            );
            const themeElement = document.createElement('style');
            themeElement.innerHTML = fs.readFileSync(
                path.join(path.dirname(__dirname), get(theme)),
                'utf8'
            );
            const overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(
                path.join(path.dirname(__dirname), 'styles/html_export.css'),
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
                window.alert('The file failed to export. Please contact the developer.');
                console.log(err);
                await file.close();
                return;
            }
            await file.close();
            window.alert('The file exported successfully.');
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

/**
 * Imports a CSV file to the lexicon.
 * @param {boolean} headers Whether or not the CSV file has headers.
 * @param {number} words The column number of the words.
 * @param {number} definitions The column number of the definitions.
 */
export async function importCSV(headers: boolean, words: number, definitions: number) {
    const [file_handle] = await window.showOpenFilePicker();
    await file_handle.requestPermission({ mode: 'read' });
    const file = await file_handle.getFile();
    if (!file.name.includes('.csv')) {
        window.alert('The selected file was not a .csv file.');
        return;
    }
    const r = headers;
    const w = words - 1;
    const d = definitions - 1;

    const data = await file.text();
    const rows = data.split('\r');
    const $lexicon = {};
    for (const row of rows) {
        if (r && row === rows[0]) continue;

        const columns = row.split(',');
        if (columns[0].includes('\n"')) {
            columns[0] = columns[0].split('\n"')[1];
        }
        columns[columns.length - 1] = columns[columns.length - 1].replace(/"$/g, '');

        $lexicon[columns[w]] = [
            get_pronunciation(columns[w], Lang().Lects[0]),
            columns[d],
            false,
            [],
        ];
    }
    Lang().Lexicon = $lexicon;
    Lang().Name = file.name.split('.')[0];
}
