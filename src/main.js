const {app, ipcRenderer } = require('electron')
const path = require('path');
const fs = require('fs');
const EditorJS = require('@editorjs/editorjs');
const Header = require('@editorjs/header');
const Paragraph = require('@editorjs/paragraph');
const Table = require('@editorjs/table');
const Underline = require('@editorjs/underline');
class Monospace { // EditorJS custom class
    static get isInline() {
        return true;
    }
    static get sanitize() {
        return {
            code: {
                class: 'cdx-monospace'
            }
        };
    }
    get state() {
        return this._state;
    }
    set state(state) {
        this._state = state;

        this.button.classList.toggle(this.api.styles.inlineToolButtonActive, state);
    }
    constructor({ api }) {
        this.api = api;
        this.button = null;
        this._state = false;

        this.tag = 'code';
        this.class = 'cdx-monospace';
    }
    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.textContent = 'M';
        this.button.classList.add(this.api.styles.inlineToolButton);
        return this.button;
    }
    surround(range) {
        if (this.state) {
            this.unwrap(range);
            return;
        }
        this.wrap(range);
    }
    wrap(range) {
        const selectedText = range.extractContents();
        const monospaced = document.createElement(this.tag);
        monospaced.classList.add(this.class);
        monospaced.appendChild(selectedText);
        range.insertNode(monospaced);
        this.api.selection.expandToTag(monospaced);
    }
    unwrap(range) {
        const monospaced = this.api.selection.findParentTag(this.tag, this.class);
        const text = range.extractContents();
        monospaced.remove();
        range.insertNode(text);
    }
    checkState() {
        const monospaced = this.api.selection.findParentTag(this.tag);
        this.state = !!monospaced;
    }
}
var Docs;

var $ = jQuery = require('jquery');
require('jquery-ui-dist/jquery-ui');

// This function grabs the path to the userData directory and calls back with it.
// Usage:
// userData(path => {
//     ... code which needs to use the userData path ...
// });
async function userData(callback) {
    let path;
    await ipcRenderer.invoke('getUserDataPath').then(result => {
        path = result;
    });
    callback(path);
}

// This function opens a file picker dialog and calls back with the retrieved file path. 
// Usage:
// showOpenDialog({
//    ...electron.showOpenDialogSync parameters object
// }, file_path => {
//     ... code which needs to use the file_path ...
// });
async function showOpenDialog(params, callback) {
    let path;
    await ipcRenderer.invoke('showOpenDialog', params).then(result => {
        path = result;
    })
    callback(path);
}

const tab_panes = document.querySelectorAll('.tab-container .tab-pane');
const tab_btns = document.querySelectorAll('.tab-container .button-container button');

const alphabet_input = document.getElementById('alph-input');
const fresh_order = document.getElementById('update-order');

const srch_wrd = document.getElementById('search-wrd');
const srch_def = document.getElementById('search-def');
const srch_tag = document.getElementById('search-tag');
const srch_phrase = document.getElementById('search-phrase');
const srch_descriptions = document.getElementById('search-description');
const lex_body = document.getElementById('lex-body');
const entry_count = document.getElementById('entry-counter');

const wrd_input = document.getElementById('wrd-input');
const pronun = document.getElementById('pronunciation');
const def_input = document.getElementById('def-input');
const tags_input = document.getElementById('tags');

const phrase_input = document.getElementById('phrase');
const phrase_pron = document.getElementById('phrase-pronunciation');
const phrase_desc = document.getElementById('description');
const cat_input = document.getElementById('category');
const cat_body = document.getElementById('category-body');
const book_body = document.getElementById('phrasebook-body');
const variant_body = document.getElementById('variants-body');
const add_variant_btn = document.getElementById('add-variant');

const romans = document.getElementById('romans');

const onset_input = document.getElementById('onset');
const middle_input = document.getElementById('middle');
const coda_input = document.getElementById('coda');
const vowel_input = document.getElementById('vowels');
const illegals_input = document.getElementById('illegals');

const trial_input = document.getElementById('trial');
const trial_output = document.getElementById('trials');
const gen_words_btn = document.getElementById('gen-words');
const gen_words_p = document.getElementById('gen-words-p');

const add_table_btn = document.getElementById('new-table');
const tables_pane = document.getElementById('tables-pane');

const file_name_input = document.getElementById('file-name');
const header_tags_text = document.getElementById('header-tags');
const autosave_setting = document.getElementById('auto-save');

const inputs = Array.from(document.querySelectorAll('input')).concat(Array.from(document.querySelectorAll('textarea')));
inputs.forEach((i) => i.setAttribute('spellcheck', 'false'));

let lexicon = {};
let phrasebook = {};
let selected_cat;
let romanizations;

function show_pane(i) {
    tab_btns.forEach(
        function(btn) {
            btn.classList.remove('selected');
        });
    tab_btns[i].classList.add('selected');

    tab_panes.forEach(
        function(pane) {
            pane.style.display = 'none';
        });
    tab_panes[i].style.display = 'block';
}
show_pane(0);

const theme_select = document.getElementById("theme-select");
const color_theme = document.getElementById("color-theme");
userData(user_path => {
    if (!fs.existsSync(user_path + path.sep + 'theme.txt')) {
        fs.writeFileSync(user_path + path.sep + 'theme.txt', 'dark.css');
    }
    let theme_value = fs.readFileSync(user_path + path.sep + 'theme.txt', 'utf8').toString();
    color_theme.href = theme_value;
    theme_select.value = theme_value;
})
// console.log(color_theme.href);
function change_theme() {
    let theme = theme_select.value;
    color_theme.href = theme;
    userData(user_path => {
        fs.writeFile(user_path + path.sep + 'theme.txt', theme, (err) => {if (err) throw err });
    })
}
theme_select.onchange = change_theme;

function markdown_to_html(text, convert_legacy_docs=false) {
    // To allow the user to use common markdown notation to style their text.
    // ***bold italic***
    // **bold** *italic*
    // __underline__
    // ~~strikethrough~~
    // ^[super]script
    // ~[sub]script
    // [external links](url)
    // --- horizontal rule
	if (!convert_legacy_docs) {
        let toHTML = text
            .replace(/\*\*\*([^\n(?:\*\*\*)]*)\*\*\*/gim, '<b><i>$1</i></b>') // bold italic
            .replace(/\*\*([^\n(?:\*\*)]*)\*\*/gim, '<b>$1</b>') // bold
            .replace(/\*([^\n\*]*)\*/gim, '<i>$1</i>') // italic
            .replace(/__([^\n(?:__)]*)__/gim, '<u>$1</u>') // underlined
            .replace(/~~([^\n(?:~~)]*)~~/gim, '<strike>$1</strike>') // strikethrough
            .replace(/\^\[([^\n(?:\^\[)\]]*)\]/gim, '<sup>$1</sup>') // superscript
            .replace(/~\[([^\n(?:\^\[)\]]*)\]/gim, '<sub>$1</sub>') // subscript
            .replace(/``([^\n(?:``)]*)``/gim, '<code>$1</code>') // monospace
            .replace(/\[([^\n(?:\^\[)\]]*)\]\(([^\n(?:\]\())\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>') // link
            .replace(/\n?---\n?/gim, '<hr>'); // horizontal rule
            // TODO: Backslash escaping. 
        return toHTML.trim();
    } else {
        let toHTML = text
            .replace(/\*\*\*([^\n(?:\*\*\*)]*)\*\*\*/gim, '<b><i>$1</i></b>') // bold italic
            .replace(/\*\*([^\n(?:\*\*)]*)\*\*/gim, '<b>$1</b>') // bold
            .replace(/\*([^\n\*]*)\*/gim, '<i>$1</i>') // italic
            .replace(/__([^\n(?:__)]*)__/gim, '<u class=\"cdx-underline\">$1</u>') // underlined
            .replace(/~~([^\n(?:~~)]*)~~/gim, '<strike>$1</strike>') // strikethrough
            .replace(/\^\[([^\n(?:\^\[)\]]*)\]/gim, '<sup>$1</sup>') // superscript
            .replace(/~\[([^\n(?:\^\[)\]]*)\]/gim, '<sub>$1</sub>') // subscript
            .replace(/``([^\n(?:``)]*)``/gim, '<code class=\"cdx-monospace\">$1</code>') // monospace
            .replace(/\[([^\n(?:\^\[)\]]*)\]\(([^\n(?:\]\())\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>') // link
            .replace(/\n?---\n?/gim, '<hr>'); // horizontal rule
            // TODO: Backslash escaping. 
        return toHTML.trim();
    }
}

// Lexicon handling
function sort_lex_keys() {
    let htags = header_tags_text.value.toLowerCase().trim().split(/\s+/);
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
    var alphabet = document.getElementById('case-sensitive').checked ? alphabet_input.value.trim() : alphabet_input.value.trim().toLowerCase();
    let order = alphabet.trim().split(/\s+/);
    // to make sure we find the largest tokens first, i.e. for cases where 'st' comes before 'str' alphabetically
    find_in_order = Array.from(new Set(order)).sort((a, b) => b.length - a.length); // descending, ensures uniqueness

    let final_sort = [];
    for (let group of tag_ordered_lexes) {
        let lex = {};
        let list = [];
        for (let word of group) {
            // case sensitivity
            let w = document.getElementById('case-sensitive').checked ? word : word.toLowerCase();

            // diacritic sensitivity
            w = document.getElementById('ignore-diacritic').checked ? w.normalize("NFD").replace(/\p{Diacritic}/gu, "") : w;

            for (let token of find_in_order) {
                w = w.replace(new RegExp(`${token}`, 'g'), `${order.indexOf(token)}.`)
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

function edit_entry(k) {
    var confirmation = true;
    if (wrd_input.value !== '' || def_input.value !== '') {
        var confirmation = confirm("There is text in the word entry fields. Are you sure you want to overwrite it?");
    }
    if (confirmation) {
        wrd_input.value = k;
        pronun.value = lexicon[k][0];
        def_input.value = lexicon[k][1];
        tags_input.value = lexicon[k][3].join(" ");
        delete lexicon[k];
        rewrite_entries();

        wrd_input.onkeyup(false); // update overwrite detection, preserve irregular pronunciation
    }
}

function rewrite_entries(keys = false) {
    let sorted_keys = sort_lex_keys();
    // lex_body.style.color = 'rgb(200, 200, 200)';
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
                
                let defn = document.createElement('p');
                defn.innerHTML = markdown_to_html(lexicon[key][1]); // allow markdown styling in definitions
                
                let tags = document.createElement('div');
                for (let tag of lexicon[key][3]) {
                    let newTag = document.createElement('div');
                    newTag.appendChild( document.createTextNode(tag) );
                    newTag.className = 'tag-item';
                    tags.appendChild(newTag);
                }
                
                entry.append(word, pron, tags, defn);
                entry.addEventListener('contextmenu', () => edit_entry(key) );

                lex_body.appendChild(entry);
            }
        }
    }
    if (!keys) {
        var count = document.createTextNode(`${Object.keys(lexicon).length} Entries`);
    } else {
        var count = document.createTextNode(`${keys.length} Matches`);
    }
    entry_count.replaceChildren(count)
}

function add_word(append=false) {
    let w = wrd_input.value.trim();
    let p = pronun.value.trim();
    let d = def_input.value.trim(); // allow markdown in definitions
    let t;
    if (tags_input.value !== '') { t = tags_input.value.trim().split(/\s+/g); }
    else { t = [] }

    if (!append) {
        lexicon[w] = [p, d, p !== get_pronunciation(w), t];
    } else if ( d !== '' ) {
        lexicon[w][1] += '\n' + d;
        lexicon[w][3].push(...t);
    }

    rewrite_entries();
    document.getElementById(w).scrollIntoView({ behavior: "smooth", block: "center" });
    wrd_input.value = '';
    def_input.value = '';
    tags_input.value = '';
    update_pronunciation();
    return w
}

function edit_book_entry(e) {
    let i = structuredClone(phrasebook[selected_cat][e]);
    console.log(e, i)
    phrase_input.value = e;
    phrase_pron.value = i.pronunciation;
    phrase_desc.value = i.description;
    cat_input.value = selected_cat;


    while (variant_body.firstChild.id !== 'add-variant') {
        variant_body.removeChild(variant_body.firstChild);
    }
    for (v in i.variants) {
        add_variant(v, i.variants[v].pronunciation, i.variants[v].description);
    }

    delete phrasebook[selected_cat][e];
    if ( !(Object.keys(phrasebook[selected_cat]).length > 0) ) {
        delete phrasebook[selected_cat];
        selected_cat = '';
    }
    update_categories();
}

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
                desc.innerHTML = markdown_to_html(phrasebook[selected_cat][entry].description);
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
            cat_input.value = cat;
            update_book();
        };
        cat_body.appendChild(i);
    };
    update_book();
}

function add_phrase() {
    let cat = cat_input.value.trim().toLowerCase();
    if(!cat.length) { cat = 'miscellaneous' }
    selected_cat = cat;
    if (phrase_input.value.trim() === '') { return } // prevent empty entries
    if ( !(cat in phrasebook) ) {
        phrasebook[cat] = {}; // create category if it does not exist
    };
    // create entry as an object
    phrasebook[cat][phrase_input.value.trim()] = { 
        pronunciation: phrase_pron.value.trim(),
        description: phrase_desc.value.trim(),
        variants: {},
    };
    for (let v of variant_body.childNodes) {
        if (v.className === 'variant-div') { // only grab variant divs
            let ins = v.childNodes;
            if (ins[0].value.trim() !== '') {
                // create variant object
                phrasebook[cat][phrase_input.value.trim()].variants[ins[0].value.trim()] = {
                    pronunciation: ins[1].value.trim(),
                    description: ins[2].value.trim()
                }
            }
        }
    };
    while (variant_body.firstChild.id !== 'add-variant') {
        variant_body.removeChild(variant_body.firstChild);
    }
    update_categories();
    phrase_input.value = '';
    phrase_pron.value = '';
    phrase_desc.value = '';
    // cat_input.value = '';
    // console.log(phrasebook);
}

function add_variant(v = '', p = '', d = '') {
    let variant_prompt = document.createElement("div");
    variant_prompt.className = 'variant-div';
    let variation = document.createElement("input");
    variation.setAttribute("type", "text");
    variation.value = v;
    let variation_pronun = document.createElement("input");
    variation_pronun.setAttribute("type", "text");
    variation_pronun.setAttribute("class", "pronunciation");
    variation_pronun.value = p;
    variation.onkeyup = function() {update_pronunciation(variation, variation_pronun)};
    let variant_description = document.createElement("textarea");
    variant_description.value = d;

    variant_prompt.appendChild(variation);
    variant_prompt.appendChild(variation_pronun);
    variant_prompt.appendChild(variant_description);
    variant_prompt.appendChild( document.createElement('br') )

    variant_body.insertBefore(variant_prompt, add_variant_btn);
}

// Enter key moves to definitions
wrd_input.addEventListener('keypress', event => {
    if (event.code === 'Enter') {
        event.preventDefault();
        def_input.focus();
    }
});
// Alt+Enter adds word safely, Shift+Alt+Enter moves to tags
def_input.addEventListener('keypress', event => {
    if (event.altKey && event.code === 'Enter' && !event.shiftKey) {
        let w = wrd_input.value.trim();
        wrd_input.focus();
        add_word(w in lexicon); // default to append mode
                                // call add_word function last so that the smooth scroll isn't interrupted
    }
    if (event.altKey && event.shiftKey && event.code === 'Enter') {
        tags_input.focus();
    }
});
// Ctrl+Enter adds word safely
tags_input.addEventListener('keypress', event => {
    if (event.altKey && event.code === 'Enter' && !event.shiftKey) {
        let w = wrd_input.value.trim();
        wrd_input.focus();
        add_word(w in lexicon); // default to append mode
                                // call add_word function last so that the smooth scroll isn't interrupted
    }
});

fresh_order.onclick = () => rewrite_entries(false);

srch_wrd.onfocus = function() {
    if (srch_wrd.value === 'Search by word…') {
        srch_wrd.style.color = 'white';
        srch_wrd.value = '';
    }
}
srch_wrd.onblur = function() {
    if (srch_wrd.value === '') {
        srch_wrd.style.color = 'rgb(60, 60, 60)';
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
        srch_def.style.color = 'rgb(60, 60, 60)';
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
        srch_tag.style.color = 'rgb(60, 60, 60)';
        srch_tag.value = 'Search by tags…';
    }
}
srch_wrd.onblur(); srch_def.onblur(); srch_tag.onblur();

function search_lex() {
    let s = srch_wrd.value.trim();
    let z = srch_def.value.toLowerCase().trim();
    let x = srch_tag.value.trim();
    if (s === 'Search by word…'){s = ''};
    if (z === 'search definition…'){z = ''};
    if (x === 'Search by tags…' || x === ''){ x = [] } else { x = x.split(/\s+/g) }
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
            let w = `^${word}^`;
            let match = true;
            for (let a of l[0]) { // words
                if ( !w.includes(a) ) { match = false; }
            }
            for (let a of l[1]) { // definitions
                if ( !lexicon[word][1].toLowerCase().includes(a) ) { match = false; }
            }
            if (lexicon[word][3].length !== 0) { // has at least one tag
                let any_tag_match;
                for (let tag of lexicon[word][3]) {
                    for (let a of x) { // tags
                        if (`^${tag}^`.includes(a)) { any_tag_match = true; }
                    }
                }
                if (!any_tag_match && x.length !== 0) { match = false; }
            } else { // has no tags
                if (x.length !== 0 /*at least one tag as search term*/) { match = false; }
            }
            if (match) { keys.push(word); }
        }
    }
    rewrite_entries(keys);
}
srch_wrd.onkeyup = search_lex; 
srch_def.onkeyup = search_lex;
srch_tag.onkeyup = search_lex;

srch_phrase.onfocus = function() {
    if (srch_phrase.value === 'Search by phrase…') {
        srch_phrase.style.color = 'white';
        srch_phrase.value = '';
    }
}
srch_phrase.onblur = function() {
    if (srch_phrase.value === '') {
        srch_phrase.style.color = 'rgb(60, 60, 60)';
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
        srch_descriptions.style.color = 'rgb(60, 60, 60)';
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

romans.innerHTML = "th > θ"; // initialize pronunciations variables; for some reason, everything breaks if there's nothing initialized here. TODO: Fix that.

function get_pronunciation(word) {
    word = `^${word.replaceAll(/[^\S\n]|(\n)/gm, '^$1')}^`; // add carets for front/end searching, treat spaces as word boundaries
    word = document.getElementById('case-sensitive').checked ? word : word.toLowerCase(); // if the case-sensitive setting is ticked, don't force to lowercase.
    
    // Romanizations need to be sorted by length and applied in that order. 
    // First, we need an array of all the differnt lengths of polygraphs which are used in the romanizations.
    let lengths = [];
    for (let rom in romanizations) { lengths.push(rom.length) }
    lengths = Array.from(new Set(lengths)).sort((a, b) => b - a); // descending order, unique. It just works. 

    // We then create a dictionary with all of these lengths as keys.
    // For each length key, its value is set to a dictionary of romanizations, such that `sort` is formatted like
    // {
    //  1: { '1 character pattern': 'pronunciation', 'another 1 character pattern': 'pronunciation', ... },
    //  2: { '2 character pattern': 'pronunciation', ... }
    //  ...
    // }
    let sort = {};
    for (let length of lengths) {
        if ( !(length in sort) ) { sort[length] = {}; }
        for (let rom in romanizations) {
            if (rom.length === length) { sort[length][rom] = romanizations[rom]; }
        }
    }

    // Then we go through each length of pattern, checking for patterns from the starting point of each
    // character in the word. Given the word 'dread' and the pattern 'ad', it would find a pattern match
    // when i = 3 and the patterns length we're checking for is 2 (†1). We then find the pronunciation to
    // substitute at this position (†2) and use slices to replace the pattern with the substitute (†3).
    // We add the length of the substituion string to `i` so that the next iteration skips past the part of
    // the word we have already changed (†4). When this process is done, we remove the carets (†5) and
    // return the processed word.
    for (let i = 0; i < word.length; i++) {
        for (let length of lengths) {
            let substring = word.slice(i, i+length);

            let match = false;
            Object.keys(sort[length]).forEach(pattern => {
                new_pattern = [...pattern].map((char, i) => { 
                    return (char === '_' && substring[i] !== '^') ? substring[i] : char; 
                }).join('');
                if (new_pattern === substring)
                    { match = [...sort[length][pattern]].map((char, i) => { 
                        return (char === '_' && substring[i] !== '^') ? substring[i] : char; 
                    }).join(''); }
            });

            if (substring in sort[length] || match) { // †1
                let substitute = match ? match : sort[length][substring]; // †2
                word = word.slice(0, i) + substitute + word.slice(length+i); // †3
                i += substitute.length - 1; // †4 
                break;
            }
        }
    }
    return word.replaceAll('^', ' ').trim().replaceAll('∅', ''); // (†5)
}

function update_pronunciation(input=wrd_input, output=pronun) {
    txt = input.value;
    output.value = get_pronunciation(txt);
}

function generateRules(rules, categories) {
    // This function was mostly generated by OpenAI's chatGPT @ https://chat.openai.com/chat.
    // It takes a list of rules in the format 'pattern > substitution'
    // and a categories dictionary in the format {'S': ['one', 'two', 'three' ...] ...}.
    // It returns a new list of rules which have been permutated with every item from the
    // categories for every rule that contains a category symbol. 

    // Initialize an empty array to store the expanded rules
    let expandedRules = [];

    // Iterate through each rule
    for (let rule of rules) {
        // Split the rule into pattern and substitution parts
        let [pattern, substitution] = rule.split('>');

        // Split the pattern and substitution into arrays of characters
        pattern = pattern.split('');
        substitution = substitution.split('');

        // Create a new set of unique category symbols in the pattern
        let uniqueCategorySymbols = [...new Set(pattern.filter(symbol => symbol in categories))];

        // Create all possible combinations of the unique category symbols.
        let combinations = uniqueCategorySymbols.reduce((combos, symbol) => {
            let newCombos = [];
            for (let combo of combos) {
                for (let item of categories[symbol]) {
                    newCombos.push(combo.concat(item));
                }
            }
            return newCombos;
        }, [[]]);

        // Iterate through the combinations of symbols
        for (let combo of combinations) {
            let newPattern = [...pattern];
            let expandedSubstitution = [...substitution];

            // Replace the category symbols in the pattern and substitution with the corresponding symbol in the combination
            for (let i = 0; i < uniqueCategorySymbols.length; i++) {
                newPattern = newPattern.map(symbol => symbol === uniqueCategorySymbols[i] ? combo[i] : symbol);
            }

            // GPT couldn't figure out how to do this block. Have to do this myself. If there are bugs, they're probably here.
            expandedSubstitution = expandedSubstitution.map((symbol, index) => {
                if (uniqueCategorySymbols.includes(symbol)) { // symbol is in pattern
                    return combo[uniqueCategorySymbols.indexOf(symbol)]
                } else if (symbol in categories) { // symbol is not in pattern
                    return categories[symbol][categories[[...pattern][index]].indexOf(newPattern[index])]
                } else { return symbol } // symbol is not a category
            });

            // generate the new rule by joining pattern and substitution and push into expandedRules
            let expandedRule = `${newPattern.join('')}>${expandedSubstitution.join('')}`;
            // expandedRule = expandedRule.replaceAll('∅', ''); // get rid of null signs // leave null signs, post-processor takes care of it
            expandedRules.push(expandedRule);
        }
    }
    // Return the expanded rules array
    return expandedRules;
}

romans.onblur = function() {
    romanizations = {}; // global
    let categories = {};
    let rules = [];

    // On a first pass of the input directly in the textarea, 
    // we parse out the category definitions and rom rules.
    txt = romans.value.trim();
    txt.split('\n').forEach( line => { // Parse each new line as a rule
        // remove all white space
        let rule = line.trim().replace(/\s+/g, '');
        // if the rule contain `::`, it is a category
        if (rule.includes('::')) {
            let [symbol, items_string] = rule.split('::');
            let items = items_string.split(',');
            categories[symbol] = items;
        }
        // if the rule contain `>`, it is a rom rule
        if (rule.includes('>')) {
            rules.push(rule);
        }
    });

    // Then we let GPT solve all my problems.
    full_rule_set = generateRules(rules, categories);

    // And now we just have to parse the rules to the romanizations dict.
    full_rule_set.forEach(rule => {
        let [pattern, substituion] = rule.split('>');
        romanizations[pattern] = substituion;
    });

    // The block below is used to update all the pronunciation values in the editor, lexicon, and phrasebook.
    update_pronunciation(); // input line
    for (entry in lexicon) {
        if (lexicon[entry][2] === false) { // all non-irrelgular pronunciations
            lexicon[entry][0] = get_pronunciation(entry);
        }
    }
    for (category in phrasebook) {
        for (entry in phrasebook[category]) {
            phrasebook[category][entry].pronunciation = get_pronunciation(entry);
            for (variant in phrasebook[category][entry].variants) {
                phrasebook[category][entry].variants[variant].pronunciation = get_pronunciation(variant);
            }
        }
    }

    // The lexicon and phrasebook then need to be refreshed to show these changes.
    rewrite_entries();
    update_book();
}
romans.onblur();

wrd_input.onkeyup = function(repronounce=true) {
    if (repronounce) {update_pronunciation(); }

    if (wrd_input.value.trim() in lexicon) {
        document.getElementById('add-word-button').style.display = 'none';
        document.getElementById('definition-exists').style.display = '';
        document.getElementById(wrd_input.value.trim()).scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        document.getElementById('add-word-button').style.display = '';
        document.getElementById('definition-exists').style.display = 'none';
    }
};
phrase_input.onkeyup = function() {update_pronunciation(phrase_input, phrase_pron)};

const test_romans = document.getElementById('test-romans');
const test_romans_result = document.getElementById('test-romans-result');
test_romans.onkeyup = function() {update_pronunciation(test_romans, test_romans_result)};

function get_phonotactics() {
    component_txt = {
        Initial: onset_input.value.trim(),
        Middle: middle_input.value.trim(),
        Final: coda_input.value.trim(),
        Vowel: vowel_input.value.trim(),
        Illegal: illegals_input.value.trim() === '' ? '÷' : illegals_input.value, // nobody would ever use '÷' in their alphabet, right?
    }
    let c = {}
    Object.keys(component_txt).forEach(
        function(e) { c[e] = component_txt[e].split(/\s+/); });
    return c;
}

function generate_word() {
    let c = get_phonotactics();
    let r = () => Math.floor(Math.random()*2) === 0;
    let choice = (arr) => arr[Math.floor(Math.random()*arr.length)];
    let word = '^';

    if (r()) { word += choice(c.Vowel); }
        else { 
            word += choice(c.Initial);
            word += choice(c.Vowel);
        }

    for (let j = 0; j < 2; j++) {
        if (r() || word.length === 2 /* word is "^vowel" */) {
            word += choice(c.Middle);
            word += choice(c.Vowel);
        }
    }
    if (r()) { word += choice(c.Final); }
    
    word += '^'
    if ( !c.Illegal.some(v => word.includes(v)) ) {
        return word.replace(/\^/g, '');
    } else {
        return false;
    }
}

gen_words_btn.onclick = function() {
    let words = []
    for (let i = 0; i < 20; i++){
        for (let attempt = 0; attempt < 20; attempt++) {
            let word = generate_word();
            if (word !== false && !words.includes(word)) { words.push(word); }
            break;
        }
        if (words.length === 5) break;
    }
    let text = '';
    for (word of words) { text += word + '\n' };
    text = document.createTextNode(text);
    gen_words_p.replaceChildren(text);
}

function complete_word() {
    let r = () => Math.floor(Math.random()*2) === 0;
    let choice = (arr) => arr[Math.floor(Math.random()*arr.length)];
    let c = get_phonotactics();
    let word = '^' + trial_input.value;

    let finalize = function(word) {
        word += '^'; // the string is in the format "^word^" so that "^" maybe be used as a character to mark the start/end of a word
                     // in the user-defined illegal combinations
        if ( !c.Illegal.some(v => word.includes(v)) ) {
            return word.replace(/\^/g, '');
        } else {
            return false;
        }
    }

    let ends_in_vowel = false;
    for (var v of c.Vowel) {
        // Check if word ends in vowel; add middle consonant and vowel, or coda and end
        if (word.includes(v) && word.lastIndexOf(v) === word.length - v.length) {
            if (r()) {
                word += choice(c.Middle) + choice(c.Vowel);
                ends_in_vowel = true;
                break;
            } else {
                word += choice(c.Final);
                return finalize(word);
            }
        }
    }
    if (!ends_in_vowel) {
        // Add vowel to end of word, potentially end word with vowel or vowel + coda
        word += choice(c.Vowel);
        if (r()) {
            if (r()) {
                word += choice(c.Final);
            }
            return finalize(word);
        }
    }
    // End word with one of: coda, middle + vowel, or middle + vowel + coda
    if (r()) {
        word += choice(c.Final);
    } else {
        word += choice(c.Middle) + choice(c.Vowel);
        if (r()) {
            word += choice(c.Final);
        }
    }
    return finalize(word);
}

trial_input.onkeyup = function() {
    for (let attempt = 0; attempt < 20; attempt++) {
        let word = complete_word();
        if (word !== false) {
            let text = document.createTextNode(word);
            trial_output.replaceChildren(text);
            return;
        }
    }
    let text = document.createTextNode(trial_input.value); // If a legal word couldn't
    trial_output.replaceChildren(text);                     // be found in 20 attempts
}

function add_rows(table, n) {
    for (let i = 0; i < n; i++) {
        let r = table.insertRow(-1);
        for (let j = 0; j < table.rows[0].childElementCount; j++) {
            let cell = r.insertCell();
            // cell.draggable = true;
            // cell.onDrop = () => {drop(event)}
            // cell.onDragOver = () => {allowDrop(event)}
            // cell.onDragStart = () => {drag(event)}
            cell.append('—');
        }
    }
}
function add_columns(table, n) {
    for (let i = 0; i < n; i++) {
        Array.from(table.rows).forEach((row, i) => {
            let cell = document.createElement('td');
            // cell.draggable = true;
            // cell.onDrop = () => {drop(event)}
            // cell.onDragOver = () => {allowDrop(event)}
            // cell.onDragStart = () => {drag(event)}
            cell.appendChild( document.createTextNode('—') );
            table.rows[i].appendChild(cell);
        });
    }
}

// EditorJS Setup
function initialize_docs(data=false) {
    let config = {
        holder: tables_pane.id,
        tools: {
            underline: Underline,
            monospace: Monospace,
            header: {
                class: Header,
                inlineToolbar: false,
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                config: {
                    placeholder: 'This panel can be used to document and describe your languge’s features in greater detail.',
                }
            },
            table: {
                class: Table,
                config: {
                    rows: 3, cols: 3,
                    withHeadings: true,
                }
            }
        }
    }
    if (data) config.data = data;
    Docs = new EditorJS(config);
}
initialize_docs();

function write_tables(tables) {
    // Function for migrating pre-1.9 docs to the EditorJS format. 
    tables_pane.replaceChildren();
    let data = {
        "time": Date.now(),
        "blocks": [],
        "version": '2.8.1'
    }
    for (let table_data of tables) {
        console.log("table_data:", table_data)
        table_data.match(/<p class="table-title">(.*?)<\/p>/g).forEach(title => {
            console.log("title:", title);
            data.blocks.push({
                "type": "header",
                "data": {
                    "text": title,
                    "level": 1,
                }
            });
        });
        if (table_data.includes('<table')) {
            let table = [];
            table_data
                .match(/<tbody>(.*?)<\/tbody>/)[1]
                .replaceAll('</tr>', '').split('<tr>')
                .forEach(row => {
                    table.push([...row.replaceAll('</td>', '').split('<td>')]);
                });
            table.splice(0, 1);
            console.log("table:", table)
            data.blocks.push({
                "type": "table",
                "data": {
                    "withHeadings": false,
                    "content": table,
                }
            });
        }
        table_data.match(/<p class="table-caption">(.*?)<\/p>/g).forEach(p_element => {
            [...p_element.split('<br>')].forEach(paragraph => {
                paragraph = paragraph.replaceAll(/<.*?>/g, '');
                paragraph = markdown_to_html(paragraph, true);
                console.log("paragraph:", paragraph);
                data.blocks.push({
                    "type": "paragraph",
                    "data": {
                        "text": paragraph,
                    }
                });
            });
        });
    }
    initialize_docs(data);
}

function write_docs(data) {
    tables_pane.replaceChildren();
    initialize_docs(data);
}

function change_orthography() {
    let oldVal = document.getElementById('ortho-pattern').value;
    let newVal = document.getElementById('new-pattern').value;
    let change_p = document.getElementById('change-pronunciations').checked;
    let case_s = document.getElementById('case-sensitive').checked;
    oldVal = oldVal.replace(/\^/g, '≈')
    for (word in lexicon) {
        let w = '≈' + word + '≈';
        if (w.includes(case_s ? oldVal : oldVal.toLowerCase())) { 
            let r = new RegExp(oldVal, case_s ? 'g' : 'gi');
            w = w.replace(r, newVal);
            w = w.replace(/≈/gi, '');
            if (w in lexicon) { // if the new word exists, conjoin the definitions
                lexicon[w][1] = lexicon[w][1] + '\n' + lexicon[word][1];
            } else {
                lexicon[w] = lexicon[word];
            }
            delete lexicon[word];
            if (!change_p) {
                lexicon[w][2] = true;
            }
        }
    }

    romans.onblur(); // checks to update all pronunciations and rewrites lex
    document.getElementById('ortho-pattern').value = '';
    document.getElementById('new-pattern').value = '';
    tab_btns[0].onclick();
}

// ––––––––––––––––––
//   File Functions
// ––––––––––––––––––

function open_v1p0(contents) {
    lexicon = contents.Lexicon;
    for (entry in lexicon) { lexicon[entry].push(false, []); } // assume pronunciation regularity, zero tags

    alphabet_input.value = contents.Alphabet.split('').join(' ');
    let txt = ''
    for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`)
    }
    romans.value = txt; romans.onblur();
    onset_input.value = contents.Phonotactics.Initial.join(' ');
    middle_input.value = contents.Phonotactics.Middle.join(' ');
    coda_input.value = contents.Phonotactics.Final.join(' ');
    vowel_input.value = contents.Phonotactics.Vowel.join(' ');
    illegals_input.value = ''; // clear out the demonstration

    rewrite_entries();
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p1(contents) {
    lexicon = contents.Lexicon;
    for (entry in lexicon) { lexicon[entry].push([]); } // no tags
    alphabet_input.value = contents.Alphabet.split('').join(' ');
    let txt = ''
    for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`)
    }
    romans.value = txt.trimEnd(); romans.onblur();
    onset_input.value = contents.Phonotactics.Initial.join(' ');
    middle_input.value = contents.Phonotactics.Middle.join(' ');
    coda_input.value = contents.Phonotactics.Final.join(' ');
    vowel_input.value = contents.Phonotactics.Vowel.join(' ');
    illegals_input.value = contents.Phonotactics.Illegal.join(' ');

    rewrite_entries();
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p2(contents) {
    lexicon = contents.Lexicon;
    for (entry in lexicon) { lexicon[entry].push([]); } // no tags
    alphabet_input.value = contents.Alphabet.split('').join(' ');
    let txt = ''
    for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`)
    }
    romans.value = txt.trimEnd(); romans.onblur();
    onset_input.value = contents.Phonotactics.Initial.join(' ');
    middle_input.value = contents.Phonotactics.Middle.join(' ');
    coda_input.value = contents.Phonotactics.Final.join(' ');
    vowel_input.value = contents.Phonotactics.Vowel.join(' ');
    illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    write_tables(contents.Tables);

    rewrite_entries();
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p3(contents) {
    lexicon = contents.Lexicon;
    alphabet_input.value = contents.Alphabet;
    let txt = ''
    for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`)
    }
    romans.value = txt.trimEnd(); romans.onblur();
    onset_input.value = contents.Phonotactics.Initial.join(' ');
    middle_input.value = contents.Phonotactics.Middle.join(' ');
    coda_input.value = contents.Phonotactics.Final.join(' ');
    vowel_input.value = contents.Phonotactics.Vowel.join(' ');
    illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    write_tables(contents.Tables);

    rewrite_entries();
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p5(contents) {
    try {lexicon = contents.Lexicon;} catch (err) { window.alert("There was a problem loading the contents of the lexicon. Please contact the developer.") }
    try {alphabet_input.value = contents.Alphabet;} catch (err) { window.alert("There was a problem loading the alphabetical order. Please contact the developer.") }
    try {
        let txt = ''
        for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`) }
        romans.value = txt.trimEnd(); romans.onblur();
    } catch (err) {window.alert("There was a problem loading the romanizations. Please contact the developer.")}
    try {
        onset_input.value = contents.Phonotactics.Initial.join(' ');
        middle_input.value = contents.Phonotactics.Middle.join(' ');
        coda_input.value = contents.Phonotactics.Final.join(' ');
        vowel_input.value = contents.Phonotactics.Vowel.join(' ');
        illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    } catch (err) { window.alert("There was a problem loading the phonotactics data. Please contact the developer.") }
    try {write_tables(contents.Tables);} catch (err) {window.alert("There was a problem loading the tables data. Please contact the developer.")}
    try {header_tags_text.value = contents.HeaderTags} catch (err) {window.alert("There was a problem loading the header tags.")}
    
    try {rewrite_entries();} catch (err) {window.alert("The save file's data successfully was loaded, but an error occurred while parsing it. Please contact the developer.")}
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p6(contents) {
    try {lexicon = contents.Lexicon;} catch (err) { window.alert("There was a problem loading the contents of the lexicon. Please contact the developer.") }
    try {alphabet_input.value = contents.Alphabet;} catch (err) { window.alert("There was a problem loading the alphabetical order. Please contact the developer.") }
    try {
        let txt = ''
        for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`) }
        romans.value = txt.trimEnd(); romans.onblur();
    } catch (err) { window.alert("There was a problem loading the romanizations. Please contact the developer.") }
    try { phrasebook = contents.Phrasebook; } catch (err) { window.alert('There was a problem loading the phrasebook. Please contact the developer.') }
    try {
        onset_input.value = contents.Phonotactics.Initial.join(' ');
        middle_input.value = contents.Phonotactics.Middle.join(' ');
        coda_input.value = contents.Phonotactics.Final.join(' ');
        vowel_input.value = contents.Phonotactics.Vowel.join(' ');
        illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    } catch (err) { window.alert("There was a problem loading the phonotactics data. Please contact the developer.") }
    try {write_tables(contents.Tables);} catch (err) { window.alert("There was a problem loading the tables data. Please contact the developer."); console.log(err); }
    try {header_tags_text.value = contents.HeaderTags} catch (err) { window.alert("There was a problem loading the header tags.") }
    
    try {rewrite_entries();} catch (err) { window.alert("The save file's lexicon data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    try {update_categories();} catch (err) { window.alert("The save file's phrasebook data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    tab_btns[0].onclick(); // Return to Lexicon tab
}

function open_v1p7(contents) {
    try {lexicon = contents.Lexicon;} catch (err) { window.alert("There was a problem loading the contents of the lexicon. Please contact the developer.") }
    try {alphabet_input.value = contents.Alphabet;} catch (err) { window.alert("There was a problem loading the alphabetical order. Please contact the developer.") }
    try {
        let txt = ''
        for (var r in contents.Romanization) {
        txt += (`${r} > ${contents.Romanization[r]}\n`) }
        romans.value = txt.trimEnd(); romans.onblur();
    } catch (err) { window.alert("There was a problem loading the romanizations. Please contact the developer.") }
    try { phrasebook = contents.Phrasebook; } catch (err) { window.alert('There was a problem loading the phrasebook. Please contact the developer.') }
    try {
        onset_input.value = contents.Phonotactics.Initial.join(' ');
        middle_input.value = contents.Phonotactics.Middle.join(' ');
        coda_input.value = contents.Phonotactics.Final.join(' ');
        vowel_input.value = contents.Phonotactics.Vowel.join(' ');
        illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    } catch (err) { window.alert("There was a problem loading the phonotactics data. Please contact the developer.") }
    try {write_tables(contents.Tables);} catch (err) { window.alert("There was a problem loading the tables data. Please contact the developer."); console.log(err); }
    try {header_tags_text.value = contents.HeaderTags} catch (err) { window.alert("There was a problem loading the header tags.") }

    try { document.getElementById('ignore-diacritic').checked = contents.IgnoreDiacritics } catch (err) { console.log(err) }
    try { document.getElementById('case-sensitive').checked = contents.CaseSensitive } catch (err) { console.log(err) }

    try {rewrite_entries();} catch (err) { window.alert("The save file's lexicon data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    try {update_categories();} catch (err) { window.alert("The save file's phrasebook data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    
    tab_btns[0].onclick(); // Return to Lexicon tab 
}

function open_v1p8(contents) {
    try {lexicon = contents.Lexicon;} catch (err) { window.alert("There was a problem loading the contents of the lexicon. Please contact the developer.") }
    try {alphabet_input.value = contents.Alphabet;} catch (err) { window.alert("There was a problem loading the alphabetical order. Please contact the developer.") }
    try {
        romans.value = contents.Romanization;
        romans.onblur();
    } catch (err) { window.alert("There was a problem loading the romanizations. Please contact the developer.") }
    try { phrasebook = contents.Phrasebook; } catch (err) { window.alert('There was a problem loading the phrasebook. Please contact the developer.') }
    try {
        onset_input.value = contents.Phonotactics.Initial.join(' ');
        middle_input.value = contents.Phonotactics.Middle.join(' ');
        coda_input.value = contents.Phonotactics.Final.join(' ');
        vowel_input.value = contents.Phonotactics.Vowel.join(' ');
        illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    } catch (err) { window.alert("There was a problem loading the phonotactics data. Please contact the developer.") }
    try {write_tables(contents.Tables);} catch (err) { window.alert("There was a problem loading the documentation data. Please contact the developer."); console.log(err); }
    try {header_tags_text.value = contents.HeaderTags} catch (err) { window.alert("There was a problem loading the header tags.") }

    try { document.getElementById('ignore-diacritic').checked = contents.IgnoreDiacritics } catch (err) { console.log(err) }
    try { document.getElementById('case-sensitive').checked = contents.CaseSensitive } catch (err) { console.log(err) }

    try {rewrite_entries();} catch (err) { window.alert("The save file's lexicon data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    try {update_categories();} catch (err) { window.alert("The save file's phrasebook data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    
}

function open_v1p9(contents) {
    try {lexicon = contents.Lexicon;} catch (err) { window.alert("There was a problem loading the contents of the lexicon. Please contact the developer.") }
    try {alphabet_input.value = contents.Alphabet;} catch (err) { window.alert("There was a problem loading the alphabetical order. Please contact the developer.") }
    try {
        romans.value = contents.Romanization;
        romans.onblur();
    } catch (err) { window.alert("There was a problem loading the romanizations. Please contact the developer.") }
    try { phrasebook = contents.Phrasebook; } catch (err) { window.alert('There was a problem loading the phrasebook. Please contact the developer.') }
    try {
        onset_input.value = contents.Phonotactics.Initial.join(' ');
        middle_input.value = contents.Phonotactics.Middle.join(' ');
        coda_input.value = contents.Phonotactics.Final.join(' ');
        vowel_input.value = contents.Phonotactics.Vowel.join(' ');
        illegals_input.value = contents.Phonotactics.Illegal.join(' ');
    } catch (err) { window.alert("There was a problem loading the phonotactics data. Please contact the developer.") }
    try {write_docs(contents.Docs);} catch (err) { window.alert("There was a problem loading the documentation data. Please contact the developer."); console.log(err); }
    try {header_tags_text.value = contents.HeaderTags} catch (err) { window.alert("There was a problem loading the header tags.") }

    try { document.getElementById('ignore-diacritic').checked = contents.IgnoreDiacritics } catch (err) { console.log(err) }
    try { document.getElementById('case-sensitive').checked = contents.CaseSensitive } catch (err) { console.log(err) }

    try {rewrite_entries();} catch (err) { window.alert("The save file's lexicon data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    try {update_categories();} catch (err) { window.alert("The save file's phrasebook data successfully was loaded, but an error occurred while parsing it. Please contact the developer.") }
    
}

function open_contents_by_version(contents) {
    if ( !('Version' in contents) ) { open_v1p0(contents); } 
    else {
        switch (contents.Version) {
            case 1.1: open_v1p1(contents); break;
            case 1.2: open_v1p2(contents); break;
            case 1.3: open_v1p3(contents); break;
            case 1.4: open_v1p3(contents); break; // save file format is same as 1.3
            case 1.5: open_v1p5(contents); break;
            case 1.6: open_v1p6(contents); break;
            case 1.7: open_v1p7(contents); break;
            case 1.8: open_v1p7(contents); break; // save file format is same as 1.7
            case '1.8.x': open_v1p8(contents); break; // dv1.8.7 changed romanization loading
            case 1.9: open_v1p9(contents); break;
        }
    }
}

async function import_lex() {
    document.querySelectorAll('.planet').forEach(planet => { // loading anim start
        planet.style.animationPlayState = 'running';
    });
    document.getElementById('loading-message').innerHTML = 'Loading...';

    document.getElementById('loading-message').innerHTML = 'Loading...';
    let [file_handle] = await window.showOpenFilePicker();
    await file_handle.requestPermission({ mode: 'read' });
    let file = await file_handle.getFile();
    if ( !file.name.includes('.lexc') ) {
        window.alert('The selected file was not a .lexc file.');
        document.querySelectorAll('.planet').forEach(planet => { // loading anim stop
            planet.style.animationPlayState = 'paused';
        });
        document.getElementById('loading-message').innerHTML = 'Incorrect file type.';
        window.setTimeout(() => {
            document.getElementById('loading-message').innerHTML = '';
        }, 5000)
        return;
    }
    let string_contents = await file.text();
    let contents = JSON.parse(string_contents);
    open_contents_by_version(contents);

    file_name_input.value = file.name.split('.')[0]


    document.querySelectorAll('.planet').forEach(planet => { // loading anim stop
        planet.style.animationPlayState = 'paused';
    });
    document.getElementById('loading-message').innerHTML = 'Done!';
    window.setTimeout(() => {
        document.getElementById('loading-message').innerHTML = '';
    }, 5000)
}

async function open_lex() {
    let contents;
    // here's to hoping future me doesn't forget how callback functions work.
    let dialog = (user_path) => {
        showOpenDialog({
            title: 'Open Lexicon',
            defaultPath: `${user_path}${path.sep}Lexicons${path.sep}`,
            properties: ['openFile']
        }, file_path => {
            fs.readFile(file_path[0], 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    window.alert("There was an issue loading your file. Please contact the developer."); 
                    document.querySelectorAll('.planet').forEach(planet => { // loading anim stop
                        planet.style.animationPlayState = 'paused';
                    });
                    document.getElementById('loading-message').innerHTML = 'Couldn’t open file.';
                    window.setTimeout(() => {
                        document.getElementById('loading-message').innerHTML = '';
                    }, 5000);
                    return
                }
                contents = JSON.parse(data);
                open_contents_by_version(contents);
                file_name_input.value = path.basename(file_path[0], '.lexc');
                document.querySelectorAll('.planet').forEach(planet => { // loading anim stop
                    planet.style.animationPlayState = 'paused';
                });
                document.getElementById('loading-message').innerHTML = 'Done!';
                window.setTimeout(() => {
                    document.getElementById('loading-message').innerHTML = '';
                }, 5000);
            });
        });
    }
    document.querySelectorAll('.planet').forEach(planet => { // loading anim start
        planet.style.animationPlayState = 'running';
    });
    document.getElementById('loading-message').innerHTML = 'Loading...';
    await userData(user_path => {
        if (!fs.existsSync(`${user_path}${path.sep}Lexicons${path.sep}`)) {
            fs.mkdir(`${user_path}${path.sep}Lexicons${path.sep}`, () => { dialog(user_path); });
        } else { dialog(user_path); }
    });
}

async function collect_export_data (blob=true) {
    let documentation;
    await Docs.save().then(data => {
        documentation = data;
    });
    // Version 1.9
    let export_data = {
        Version: 1.9,
        Lexicon: lexicon,
        Alphabet: alphabet_input.value,
        Phrasebook: phrasebook,
        Phonotactics: get_phonotactics(),
        Romanization: romans.value.trim(),
        Docs: documentation,
        HeaderTags: header_tags_text.value,
        IgnoreDiacritics: document.getElementById('ignore-diacritic').checked,
        CaseSensitive: document.getElementById('case-sensitive').checked
    }

    let exports;
    if (blob) {
        exports = new Blob([JSON.stringify(export_data)]);
    } else {
        exports = JSON.stringify(export_data);
    }

    return exports;
}

async function save_as() {
    let exports = await collect_export_data(blob=true); // needs a blob

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.lexc`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to save. Please contact the developer.'); console.log(err); await file.close(); return }
    await file.close();
    window.alert('The file saved successfully.')
}

async function save_file(send_alert = true) {
    if (file_name_input.value.trim() === '') {
        if (send_alert) {
            file_name_input.value = window.prompt("Please enter a file name before saving.");
        } else return;
    }
    let exports = await collect_export_data(blob=false); // needs a string or buffer
    try {
        userData(user_path => {
            if (!fs.existsSync(`${user_path}${path.sep}Lexicons${path.sep}`)) {
                fs.mkdirSync(`${user_path}${path.sep}Lexicons${path.sep}`)
            }
            fs.writeFileSync(`${user_path}${path.sep}Lexicons${path.sep}${file_name_input.value}.lexc`, exports, 'utf8')
        });
        if (send_alert) { window.alert("The file has been saved."); } else { new Notification('Your file has been auto-saved.') }
    } catch (err) { window.alert("There was a problem saving your file. Please contact the developer."); console.log(err) }
}

var autosave_tracker;
autosave_setting.onchange = function() {
    userData(user_path => {
        fs.writeFile(user_path + path.sep + "autosave_pref.txt", String(autosave_setting.checked), 'utf8', (err) => { if (err) throw err; })
    });
    if (autosave_setting.checked) {
        autosave_tracker = window.setInterval(save_file, 300000 /* 5 minutes */, false);
    } else {
        window.clearInterval(autosave_tracker);
    }
}
userData(user_path => {
    if (!fs.existsSync(user_path + path.sep + 'autosave_pref.txt')) {
        fs.writeFileSync(user_path + path.sep + 'autosave_pref.txt', 'false');
        autosave_setting.checked = false;
    } else {
        autosave_setting.checked = fs.readFileSync(user_path + path.sep + 'autosave_pref.txt', 'utf8') === 'true';
    }
}).then(_ => { autosave_setting.onchange(); });
ipcRenderer.on('app-close', _ => {
    if (autosave_setting.checked) {
        save_file(false).then(_ => {
            ipcRenderer.send('close');
        });
    } else {
        if (window.confirm('You may have unsaved changes. Are you sure you want to exit?')) {
            ipcRenderer.send('close');
        }
    }
})

async function export_txt() {
    let export_data = '';
    for (word in lexicon) {
        export_data += `${word}\n${lexicon[word][0]}\n${lexicon[word][1]}\n\n`
    }
    let exports = new Blob([export_data]);

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.txt`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to export.') }
    await file.close();
    window.alert('The file exported successfully.')
}

async function export_csv() {
    function arrayToCsv(data){
        return data.map(row =>
            row
            .map(String)                       // convert every value to String
            .map(v => v.replaceAll('"', '""')) // escape double colons
            .map(v => `"${v}"`)                // quote it
            .join(',')                         // comma-separated
        ).join('\r\n');                        // rows starting on new lines
    }
    let arr_data = [['Word', 'Pronunciation', 'Definition']];
    for (key in lexicon) {
        arr_data.push([key, lexicon[key][0], lexicon[key][1]])
    }
    export_data = arrayToCsv(arr_data)
    let exports = new Blob([export_data]);

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.csv`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to export.') }
    await file.close();
    window.alert('The file exported successfully.')
}

async function export_json() {
    export_data = lexicon;
    let exports = new Blob([JSON.stringify(export_data)]);

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.json`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to export.') }
    await file.close();
    window.alert('The file exported successfully.')
}

async function export_html() {
    // Create HTML document object
    let export_container = document.createElement('html');

    // Create HTML header info
    let head = document.createElement('head');
    head.innerHTML = `
    <meta charset="UTF-8" />
    <title>${file_name_input.value}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    `
    // Create export scripts
    let scripts = document.createElement('script');
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
    const lexicon = ${JSON.stringify(lexicon)};
    const phrasebook = ${JSON.stringify(phrasebook)};
    let selected_cat;

    function sort_lex_keys() {
        let htags = ${JSON.stringify(header_tags_text.value.toLowerCase().trim().split(/\\s+/))};
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
        var alphabet = ${document.getElementById('case-sensitive').checked ? JSON.stringify(alphabet_input.value.trim()) : JSON.stringify(alphabet_input.value.trim().toLowerCase())};
        let order = alphabet.trim().split(/\\s+/);
        // to make sure we find the largest tokens first, i.e. for cases where 'st' comes before 'str' alphabetically
        find_in_order = Array.from(new Set(order)).sort((a, b) => b.length - a.length); // descending, ensures uniqueness
    
        let final_sort = [];
        for (let group of tag_ordered_lexes) {
            let lex = {};
            let list = [];
            for (let word of group) {
                // case sensitivity
                let w = ${document.getElementById('case-sensitive').checked ? 'word' : 'word.toLowerCase()'};
    
                // diacritic sensitivity
                w = ${document.getElementById('ignore-diacritic').checked ? 'w.normalize("NFD").replace(/\\p{Diacritic}/gu, "")' : 'w'};
    
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
        lex_body.style.color = 'rgb(200, 200, 200)';
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
            srch_wrd.style.color = 'rgb(60, 60, 60)';
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
            srch_def.style.color = 'rgb(60, 60, 60)';
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
            srch_tag.style.color = 'rgb(60, 60, 60)';
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
            srch_phrase.style.color = 'rgb(60, 60, 60)';
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
            srch_descriptions.style.color = 'rgb(60, 60, 60)';
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
    let styles = document.createElement('style');
    styles.innerHTML = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
    let theme = document.createElement('style');
    theme.innerHTML = fs.readFileSync(path.join(__dirname, theme_select.value), 'utf8');
    let overrides = document.createElement('style');
    overrides.innerHTML = fs.readFileSync(path.join(__dirname, 'html_export.css'), 'utf8');

    tables_content = document.createElement('div');
    tables_content.innerHTML = document.getElementById('tables-pane').innerHTML;
    for (let table of tables_content.children) {
        table.contentEditable = false;
    }

    // Create export body
    let body = document.createElement('body');
    body.innerHTML = `
    <h1>${file_name_input.value}</h1>
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
            <div class='container column scrolled'>
                ${tables_content.innerHTML}
            </div>
        </div>

        <!-- Phrasebook -->
        <div class="row" style="height:90vh;">
            <!-- Categories -->
            <div class="container column" style="max-width: 18%;">
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

    head.append(styles, theme, overrides);
    export_container.append(head, body, scripts);

    export_data = export_container.innerHTML;
    console.log(export_data);
    let exports = new Blob(["\ufeff", export_data],
        { type: 'tex/html; charset=utf-8;' }
    );

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.html`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to export.') }
    await file.close();
    window.alert('The file exported successfully.')
}

async function import_csv() {
    let [file_handle] = await window.showOpenFilePicker();
    await file_handle.requestPermission({ mode: 'read' });
    let file = await file_handle.getFile();
    if ( !file.name.includes('.csv') ) {
        window.alert('The selected file was not a .csv file.');
        return;
    }
    let w = parseInt(document.getElementById('word-column').value) - 1;
    let d = parseInt(document.getElementById('defi-column').value) - 1;
    let r = document.getElementById('row-one-is-labels').value;

    let data = await file.text();
    let rows = data.split('\r');
    lexicon = {};
    for (let row of rows) {
        if (r === 'on' && row === rows[0]) continue;
        
        let columns = row.split(',');
        if (columns[0].includes('\n"')) {columns[0] = columns[0].split('\n"')[1];}
        columns[columns.length-1] = columns[columns.length-1].replace(/"$/g, '');

        lexicon[columns[w]] = [get_pronunciation(columns[w]), columns[d], false, []];
    }
    rewrite_entries();
    tab_btns[0].onclick() // Return to Lexicon tab
    file_name_input.value = file.name.split('.')[0]
}

async function custom_theme() {
    let [file_handle] = await window.showOpenFilePicker();
    await file_handle.requestPermission({ mode: 'read' });
    let file = await file_handle.getFile();
    if ( !file.name.includes('.css') ) {
        window.alert('The selected file was not a .css file.');
        return;
    };
    let contents = await file.text();
    let theme_path;
    await userData(user_path => {
        let themes_dir = user_path + `${path.sep}user_themes${path.sep}`;
        if (!fs.existsSync(themes_dir)) {
            fs.mkdirSync(themes_dir);
        }
        theme_path = user_path + `${path.sep}user_themes${path.sep}` + file.name;
        fs.writeFile(theme_path, contents, 'utf8', (err) => {
            if (err) throw err;
            color_theme.href = theme_path;
        });
        fs.writeFile(user_path + `${path.sep}theme.txt`, theme_path, (err) => { if (err) throw err });
    });
}
