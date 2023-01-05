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

const inputs = Array.from(document.querySelectorAll('input')).concat(Array.from(document.querySelectorAll('textarea')));
inputs.forEach((i) => i.setAttribute('spellcheck', 'false'));

function getAllChildren(htmlElement) {
    if (htmlElement.children.length === 0) return [htmlElement];
  
    let allChildElements = [];
  
    for (let i = 0; i < htmlElement.children.length; i++) {
      let children = getAllChildren(htmlElement.children[i]);
      if (children) allChildElements.push(...children);
    }
    allChildElements.push(htmlElement);
  
    return allChildElements;
}

let lexicon = {};
let phrasebook = {};
let selected_cat;
let romanizations;

let content = "Some text to save into the file";

function show_pane(i) {
    tab_btns.forEach(
        function(btn) {
            btn.style.backgroundColor = '';
        });
    tab_btns[i].style.backgroundColor = 'rgb(48, 48, 48)';

    tab_panes.forEach(
        function(pane) {
            pane.style.display = 'none';
        });
    tab_panes[i].style.display = 'block';
}
show_pane(0);

function removeItem(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
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
    let d = def_input.value.trim();
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
            for (let a of x) { // tags
                if ( !lexicon[word][3].includes(a) ) { match = false; }
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

function get_pronunciation(w) {
    w = '^' + w + '^';
    w = document.getElementById('case-sensitive').checked ? w : w.toLowerCase();
    let lens = [];
    for (let r in romanizations) { lens.push(r.length) }
    lens = Array.from(new Set(lens)).sort((a, b) => b - a); // descending order, unique
    let sort = {};
    for (let l of lens) {
        if ( !(l in sort) ) { sort[l] = {}; }
        for (let r in romanizations) {
            if (r.length === l) { sort[l][r] = romanizations[r]; }
        }
    }
    let i = 0;
    while (i < w.length) {
        for (let l of lens) {
            if (w.slice(i, i+l) in sort[l]) {
                let re = sort[l][w.slice(i, i+l)];
                w = w.slice(0, i) + re + w.slice(l+i);
                i += re.length - 1;
                break;
            }
        }
        i++;
    }
    return w.replace(/\^/g, '');
}

function update_pronunciation(input=wrd_input, output=pronun) {
    txt = input.value;
    output.value = get_pronunciation(txt);
}

romans.onchange = function() {
    romanizations = {}; // global
    txt = romans.value.trim();
    txt.split('\n').forEach(
        function(line) {
            // parse each new line as a rule
            let t = line.trim().replace(/\s+/g, '').split('>');
            romanizations[t[0]] = t[1];
        });
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
    rewrite_entries();
    update_book();
}
romans.onchange();

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


// function allowDrop(ev) {
//     ev.preventDefault();
// }

// function drag(ev) {
//     ev.dataTransfer.setData("text", ev.target.id);  
// }

// function drop(ev) {
//     ev.preventDefault();
//     var data = ev.dataTransfer.getData("text");
//     ev.target.innerHTML=''
//     ev.target.appendChild(document.getElementById(data));
// }

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

// Old table edit code ->
/* function bind_table_keys(container) {
    // Add row
    container.addEventListener('keypress', event => {
        if (!event.shiftKey && event.altKey && event.code === 'KeyR') {
            event.preventDefault();
            add_rows(document.querySelector(`#${event.target.id} table`), 1)
        }
    });
    // Add column
    container.addEventListener('keypress', event => {
        if (!event.shiftKey && event.altKey && event.code === 'KeyT') {
            event.preventDefault();
            add_columns(document.querySelector(`#${event.target.id} table`), 1)
        }
    });
    // Remove row
    container.addEventListener('keypress', event => {
        if (event.shiftKey && event.altKey && event.code === 'KeyR') {
            event.preventDefault();
            document.querySelector(`#${event.target.id} table`).deleteRow(-1);
        }
    });
    // Remove column
    container.addEventListener('keypress', event => {
        if (event.shiftKey && event.altKey && event.code === 'KeyT') {
            event.preventDefault();
            let table = document.querySelector(`#${event.target.id} table`)
            Array.from(table.rows).forEach((row, i) => {
                table.rows[i].deleteCell(-1);
            });
        }
    });
    // Delete table
    container.addEventListener('keypress', event => {
        if (event.altKey && event.shiftKey && event.code === 'KeyD') {
            event.preventDefault();
            if ( window.confirm('Are you sure you want to delete this table?') ) {
                document.querySelector(`#${event.target.id}`).remove();
            }
        }
    });
} */

add_table_btn.onclick = function() {

    let table_container = document.createElement('div');
    table_container.spellcheck = false;
    table_container.contentEditable = true;
    table_container.className = 'table-container';
    let id = `t${tables_pane.childElementCount}`
    table_container.id = id

    let title = document.createElement('p');
    title.className = 'table-title';
    title.appendChild( document.createTextNode('Table Title') );

    let btns = document.createElement('span');
    btns.contentEditable = false;
    btns.className = 'show-in-context';
    btns.id = 'button-span';

    let add_row_btn = document.createElement('button');
    add_row_btn.innerHTML = '+ ROW';
    add_row_btn.onclick = function() {add_rows(table, 1)};

    let del_row_btn = document.createElement('button');
    del_row_btn.innerHTML = '- ROW';
    del_row_btn.onclick = function() {table.deleteRow(-1)};

    let add_col_btn = document.createElement('button');
    add_col_btn.innerHTML = '+ COLUMN';
    add_col_btn.onclick = function() {add_columns(table, 1)};

    let del_col_btn = document.createElement('button');
    del_col_btn.innerHTML = '- COLUMN';
    del_col_btn.onclick = function() {
        Array.from(table.rows).forEach((row, i) => { table.rows[i].deleteCell(-1); } )
    }

    let move_up_btn = document.createElement('button');
    move_up_btn.innerHTML = '⬆';
    move_up_btn.onclick = function() {
        let i = Array.from(tables_pane.children).indexOf(table_container);
        tables_pane.insertBefore(tables_pane.children[i], tables_pane.children[ Math.max(0, i-1) ]);
    }

    let move_down_btn = document.createElement('button');
    move_down_btn.innerHTML = '⬇';
    move_down_btn.onclick = function() {
        let i = Array.from(tables_pane.children).indexOf(table_container);
        let m = Array.from(tables_pane.children).length - 2; // so that we cannot move below the button
        tables_pane.insertBefore(tables_pane.children[i], tables_pane.children[ Math.min(m, i+2) ]);
    }

    let delete_btn = document.createElement('button');
    delete_btn.innerHTML = '⌫';
    delete_btn.onclick = function() {
        if ( window.confirm('Are you sure you want to delete this table?') ) {
            table_container.remove();
        }
    }

    btns.replaceChildren(move_up_btn, move_down_btn, add_row_btn, del_row_btn, add_col_btn, del_col_btn, delete_btn);

    let table = document.createElement('table');
    add_rows(table, 3);
    add_columns(table, 3);

    let caption = document.createElement('p');
    caption.className = 'table-caption';
    caption.appendChild( document.createTextNode('Caption text can go here.') );

    table_container.replaceChildren(title, btns, table, caption);
    tables_pane.insertBefore(table_container, add_table_btn);
    // bind_table_keys(document.getElementById(id));
}

function collect_tables() {
    exports = [];
    for (let container of Array.from(document.querySelectorAll('.table-container'))) {
        exports.push(container.innerHTML)
    }
    return exports;
}

function write_tables(tables) {
    for (let container of Array.from(document.querySelectorAll('.table-container'))) {
        container.remove();
    }
    for (let table_data of tables) {
        let table_container = document.createElement('div');
        table_container.spellcheck = false;
        table_container.contentEditable = true;
        table_container.className = 'table-container';
        let id = `t${tables_pane.childElementCount}`;
        table_container.id = id;
        table_container.innerHTML = table_data;

        // Remove the disfuntional button span:
        if (table_container.querySelector('#button-span') !== null) {
            // console.log('Found button span');
            table_container.removeChild(table_container.querySelector('#button-span'));
        }

        // Add the button span to each table:
        let table = table_container.querySelector('table');
        let btns = document.createElement('span');
        btns.contentEditable = false;
        btns.className = 'show-in-context';
        btns.id = 'button-span';
        let add_row_btn = document.createElement('button');
        add_row_btn.innerHTML = '+ ROW';
        add_row_btn.onclick = function() {add_rows(table, 1)};
        let del_row_btn = document.createElement('button');
        del_row_btn.innerHTML = '- ROW';
        del_row_btn.onclick = function() {table.deleteRow(-1)};
        let add_col_btn = document.createElement('button');
        add_col_btn.innerHTML = '+ COLUMN';
        add_col_btn.onclick = function() {add_columns(table, 1)};
        let del_col_btn = document.createElement('button');
        del_col_btn.innerHTML = '- COLUMN';
        del_col_btn.onclick = function() {
            Array.from(table.rows).forEach((row, i) => { table.rows[i].deleteCell(-1); } )
        }
        let move_up_btn = document.createElement('button');
        move_up_btn.innerHTML = '⬆';
        move_up_btn.onclick = function() {
            let i = Array.from(tables_pane.children).indexOf(table_container);
            tables_pane.insertBefore(tables_pane.children[i], tables_pane.children[ Math.max(0, i-1) ]);
        }
        let move_down_btn = document.createElement('button');
        move_down_btn.innerHTML = '⬇';
        move_down_btn.onclick = function() {
            let i = Array.from(tables_pane.children).indexOf(table_container);
            let m = Array.from(tables_pane.children).length - 2; // so that we cannot move below the button
            tables_pane.insertBefore(tables_pane.children[i], tables_pane.children[ Math.min(m, i+2) ]);
        }
        let delete_btn = document.createElement('button');
        delete_btn.innerHTML = '⌫';
        delete_btn.onclick = function() {
            if ( window.confirm('Are you sure you want to delete this table?') ) {
                table_container.remove();
            }
        }
        btns.replaceChildren(move_up_btn, move_down_btn, add_row_btn, del_row_btn, add_col_btn, del_col_btn, delete_btn);
        table_container.insertBefore(btns, table);
        tables_pane.insertBefore(table_container, add_table_btn);
    }
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

    romans.onchange(); // checks to update all pronunciations and rewrites lex
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
    romans.value = txt; romans.onchange();
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
    romans.value = txt.trimEnd(); romans.onchange();
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
    romans.value = txt.trimEnd(); romans.onchange();
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
    romans.value = txt.trimEnd(); romans.onchange();
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
        romans.value = txt.trimEnd(); romans.onchange();
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
        romans.value = txt.trimEnd(); romans.onchange();
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
        romans.value = txt.trimEnd(); romans.onchange();
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

async function open_lex() {
    let [file_handle] = await window.showOpenFilePicker();
    await file_handle.requestPermission({ mode: 'read' });
    let file = await file_handle.getFile();
    if ( !file.name.includes('.lexc') ) {
        window.alert('The selected file was not a .lexc file.');
        return;
    }
    let string_contents = await file.text();
    let contents = JSON.parse(string_contents);

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
        }
    }
    file_name_input.value = file.name.split('.')[0]
}

async function save_as() {
    // v1.7
    let export_data = {
        Version: 1.7,
        Lexicon: lexicon,
        Alphabet: alphabet_input.value,
        Phrasebook: phrasebook,
        Phonotactics: get_phonotactics(),
        Romanization: romanizations,
        Tables: collect_tables(),
        HeaderTags: header_tags_text.value,
        IgnoreDiacritics: document.getElementById('ignore-diacritic').checked,
        CaseSensitive: document.getElementById('case-sensitive').checked
    }
    let exports = new Blob([JSON.stringify(export_data)]);

    let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.lexc`} );
    await file_handle.requestPermission({ mode: 'readwrite' });
    let file = await file_handle.createWritable();
    try { await file.write(exports); } catch (err) { window.alert('The file failed to save.') }
    await file.close();
    window.alert('The file saved successfully.')
}

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
                let w = \`^\${word}^\`;
                let match = true;
                for (let a of l[0]) { // words
                    if ( !w.includes(a) ) { match = false; }
                }
                for (let a of l[1]) { // definitions
                    if ( !lexicon[word][1].toLowerCase().includes(a) ) { match = false; }
                }
                for (let a of x) { // tags
                    if ( !lexicon[word][3].includes(a) ) { match = false; }
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
    styles.innerHTML = `
    body {
        font-family: sans-serif;
        font-size: 14px;
        color: rgb(190, 190, 190);
        background-color: rgb(48, 48, 48);
        min-width: 500px;
        min-height: 500px;
        margin: 0px;
        text-align: center;
        overflow: auto;
        white-space: pre-line;
    }

    @import url('https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap');

    .row { display: flex; }
    .search-row { display: inline-flex; }
    .column { flex: 50%; }

    input { min-width: 12em; }

    h1 {
        font-family: 'Gentium Book Plus' serif;
        font-style: italic;
        font-size: 17px;
        display: inline-flex;
    }
    p {margin: 0px;}
    .prelined {white-space: pre-line;}

    .lex-body {
        color: rgb(80, 80, 80);
        font-family: 'Gentium Book Plus' serif;
        font-size: 15px;
    }

    .capitalize {
        text-transform: capitalize;
    }
      
    .lex-entry {
        transition: .3s;
        padding: 1em;
        font-family: 'Gentium Book Plus' serif;
        font-size: 15px;
    }
    .lex-entry:hover { background: rgb(90, 90, 90); }

    .tag-item {
        color:rgb(170, 170, 170);
        background-color: rgb(80, 80, 80);
        border-radius: 4px;
        width: fit-content;
        font-family: sans-serif;
        font-size: 9px;
        text-transform: uppercase;
        padding: .2em;
        margin: .2em;
        display: inline-block;
    }

    .search {
        font-family: 'Gentium Book Plus' serif;
        font-size: 15px;
        color: lightgray;
        background-color: rgb(20, 20, 20);
        display: flex;
        padding: 4px;
        text-align: center;
        margin: -1em auto 0em auto;
        border: none;
        border-radius: 3px;
        text-align: left;
        max-width: 60%;
    }

    .pronunciation {
        color: rgb(146, 146, 146);
        font-size: 13px;
    }

    .scrolled {
        max-height: 96%;
        overflow-y: auto;
        overflow-x: wrap;
    }

    .tab-container {
        width: 100vw;
        height: 90vh;
    }
    .tab-container .tab-pane {
        height: 75%;
        box-sizing: border-box;
        margin: auto;
    }

    .container {
        background-color: rgb(36, 36, 36);
        border: 1px solid black;
        border-radius: 6px;
        text-align: center;
        margin: 6px;
        padding: 6px;
        max-height: 100%;
    }

    [id=entry-counter] {
        color:rgb(120, 120, 120);
        background-color: rgb(62, 62, 62);
        border-radius: 4px;
        width: fit-content;
        font-family: Noto sans-serif;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        padding: .2em;
        margin: auto;
    }
    .table-container { 
        font-family: 'Gentium Book Plus' serif;
        font-size: 15px;
        margin: auto; 
        padding: 30px 5%;
      }
      
    table {
    border-collapse: collapse;
    width: 100%;
    }
    
    .table-title {
    font-family: 'Gentium Book Plus' serif;
    font-style: italic;
    font-size: 17px;
    }
    
    td { 
    border: 1px solid black;
    padding: 2px 6px 2px 6px;
    text-align: center;
    }
    
    td[class=header] { background-color: #333; font-weight: bold; }
    /* The header class style is currently unused, until I can work out the best way to make
        header rows and columns user-definable.  */
    
    tr:nth-child(odd) {background-color: rgb(20, 20, 20);}
    tr:nth-child(even) { background-color: rgb(30, 30, 30); }

    button {
        display: none;
    }
    .info {
        display: none;
    }
    `;
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
                ${document.getElementById('tables-pane').innerHTML}
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

    head.appendChild(styles);
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
