module.exports = {
    _open: {
        v1p0: function(contents) {
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
        },
        v1p1: function(contents) {
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
        },
        v1p2: function(contents) {
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
        },
        v1p3: function(contents) {
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
        },
        v1p5: function(contents) {
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
        },
        v1p6: function(contents) {
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
        },
        v1p7: function(contents) {
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
        },
        v1p8: function(contents) {
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
            
        },
        v1p9: function(contents) {
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
    },
    _export: {
        txt: async function () {
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
        },
        csv: async function () {
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
        },
        json: async function () {
            export_data = lexicon;
            let exports = new Blob([JSON.stringify(export_data)]);

            let file_handle = await window.showSaveFilePicker( {suggestedName: `${file_name_input.value}.json`} );
            await file_handle.requestPermission({ mode: 'readwrite' });
            let file = await file_handle.createWritable();
            try { await file.write(exports); } catch (err) { window.alert('The file failed to export.') }
            await file.close();
            window.alert('The file exported successfully.')
        },
        html: async function() {
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
            styles.innerHTML = fs.readFileSync(path.join(__dirname, 'styles/index.css'), 'utf8');
            let theme = document.createElement('style');
            theme.innerHTML = fs.readFileSync(path.join(__dirname, 'styles/' + theme_select.value), 'utf8');
            let overrides = document.createElement('style');
            overrides.innerHTML = fs.readFileSync(path.join(__dirname, 'styles/html_export.css'), 'utf8');

            let documentation = document.createElement('div');
            documentation.classList.add('container', 'column', 'scrolled');
            // Convert EditorJS save data to HTML. 
            await Docs.save().then(data => {
                for (let element of data.blocks) {
                    switch (element.type) {
                        case 'header': 
                            let header = document.createElement(`h${element.data.level}`);
                            header.innerHTML = element.data.text;
                            documentation.appendChild(header);
                            break;
                        case 'paragraph':
                            let paragraph = document.createElement('p');
                            paragraph.innerHTML = element.data.text
                            documentation.appendChild(paragraph);
                            break;
                        case 'table':
                            let table = document.createElement('table');
                            let tbody = document.createElement('tbody');
                            element.data.content.forEach(row => {
                                let tr = document.createElement('tr');
                                row.forEach(cell => {
                                    let td = document.createElement('td');
                                    td.innerHTML = cell;
                                    tr.appendChild(td);
                                });
                                tbody.appendChild(tr);
                            });
                            table.appendChild(tbody);
                            documentation.appendChild(table);
                            break;
                    }
                }
            });

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
                    ${documentation.outerHTML}
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
    }
}
