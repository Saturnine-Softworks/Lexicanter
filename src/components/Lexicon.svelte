<script>
    import { lexicon, word_input, word_pronunciation, case_sensitive, alphabet, ignore_diacritics } from '../stores.js';
    import { alphabetize } from '../scripts/alphabetize.js';
    import { get_pronunciation } from '../scripts/phonetics.js';
    import LexEntry from './LexEntry.svelte';
    let def_input = ''; let tags_input = '';
    let search_words = ''; let search_definitions = ''; let search_tags = '';
    $: keys = [];
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key in $lexicon) acc[key] = $lexicon[key];
        return acc;
    }, {});
    let alphabetized;
    // syntax below with IIFE is to trigger update to `alphabetized` on any change to either `$alphabet` or `keys`
    $: $alphabet, keys, (() => { alphabetized = alphabetize(!!keys.length? filtered_lex : $lexicon) })(); 
    $: collapsedPanel = false;
    /**
     * This function is used to delete an entry from the lexicon and
     * move it into the input fields for editing or deletion. If there
     * is text in the input fields, it asks the user for overwrite
     * confirmation. 
     * @param {string} word
     */
    function edit_entry (word) {
        let confirmation = true;
        if (!!$word_input || !!def_input) {
            confirmation = confirm(
                'There is text in the word entry fields. Are you sure you want to overwrite it?'
            );
        }
        if (confirmation) {
            $word_input = word;
            $word_pronunciation = $lexicon[word][0];
            def_input = $lexicon[word][1];
            tags_input = $lexicon[word][3].join(' ');
            delete $lexicon[word];
            $lexicon = {...$lexicon}; // assignment trigger
            console.log($lexicon);
        }
    }

    /**
     * This function is called when the user clicks the "Add Word" button.
     * It takes the values from the word input, pronunciation input, definition
     * input, and tags input fields, and adds them to the lexicon. If the word
     * already exists and `append` is `true`, it appends the definition and tags
     * to the existing entry. If `append` is `false`, it overwrites the existing
     * entry. 
     * @param {bool} append
     * @returns {string}
     */
    function add_word(append) {
        let word = $word_input.trim()
        if (!word) return;
        let definition = def_input.trim()
        if (!definition) return;
        let pronunciation = $word_pronunciation.trim()
        let tags;
        if (!tags_input) {
            tags = [];
        } else {
            tags = tags_input.trim().split(/\s+/g);
        }

        if (!append) {
            $lexicon[word] = [pronunciation, definition, pronunciation !== get_pronunciation(word), tags];
        } else {
            $lexicon[word][1] += '\n' + definition;
            $lexicon[word][3].push(...tags);
        }
        $lexicon = {...$lexicon}; // assignment trigger

        // follow_lex_link(word);
        $word_input = '';
        $word_pronunciation = '';
        def_input = '';
        tags_input = '';
        return word;
    }

    /**
     * Searches the lexicon for a word, definition, or tag. 
     * The character '!' is used to require an exact match.
     * The caret '^' can be used to represent the beginning
     * or end of a word. Searches are combinative, and only
     * results which match all search input fields will be
     * selected as matches. 
     * It then calls {@link rewrite_entries} to display the results.
     * @returns {any}
     */
    function search_lex() {
        let words_search = $case_sensitive?  search_words.trim() : search_words.toLowerCase().trim();
        let definitions_search = search_definitions.toLowerCase().trim();
        let tags_search = search_tags.toLowerCase().trim();
        if (!tags_search) { tags_search = []; }
        else { tags_search = tags_search.split(/\s+/g); }
        keys = [];
        if (!!words_search || !!definitions_search || !!tags_search) {
            let l = [words_search + '|', definitions_search + '|'];
            // Turn l into a list of [search by word terms, search by def terms]
            for (let e of l) {
                let n = l.indexOf(e);
                l[n] = [];
                e = e.split('|');
                for (let a of e) {
                    l[n].push(a.trim());
                }
            }
            for (let word in $lexicon) {
                let w = `^${word}^`;
                let match = true;
                for (let a of l[0]) {
                    // words
                    if (!w.includes(a)) {
                        match = false;
                    }
                }
                for (let a of l[1]) {
                    // definitions
                    let needs_exact_match = a[0] === '!';
                    if (needs_exact_match) {
                        pattern = new RegExp(`\\b${a.split('!')[1]}\\b`, 'i');
                        if (!pattern.test($lexicon[word][1].toLowerCase())) { // exact word match
                            match = false;
                        }
                    } else if (!$lexicon[word][1].toLowerCase().includes(a)) { // partial match
                        match = false;
                    }
                }
                if (!!$lexicon[word][3]) {
                    // has at least one tag
                    let partial_tag_match = false;
                    let needs_exact_match = false;
                    let has_exact_match = false;
                    for (let tag of $lexicon[word][3]) {
                        for (let a of tags_search) {
                            // tags
                            if (a[0] === '!') {
                                needs_exact_match = true;
                                if (`!${tag}` === a) {
                                    has_exact_match = true;
                                    partial_tag_match = true;
                                }
                            }
                            if (`^${tag}^`.includes(a)) {
                                partial_tag_match = true;
                            }
                        }
                    }
                    if ((!partial_tag_match && !!tags_search) || (needs_exact_match && !has_exact_match)) {
                        match = false;
                    }
                } else {
                    // has no tags
                    if (!!tags_search) {
                        match = false; // at least one tag as search term
                    }
                }
                if (match) {
                    keys = [...keys, word];
                }
            }
            if (!keys.length) keys = [null]; // Search was attempted, no results
        }
    }
</script>
<!-- Lexicon Tab -->
<div class='tab-pane'>
    <!-- Header -->
    <div class='container row text-center header'>
        <div class="narrow-col">
            <label for="case-sensitive" style="margin: auto;">Case Sensitivity</label>
            <input type="checkbox" style="width: 15px; margin: auto;" id="case-sensitive" bind:checked={$case_sensitive} />
        </div>
        <div class="narrow-col">
            <label for="ignore-diacritic" style="margin: auto; text-align: right;">Ignore Diacritics</label>
            <input type="checkbox" style="width: 15px; margin: auto;" id="ignore-diacritic" bind:checked={$ignore_diacritics}/>
        </div>
        <input id="alph-input" type="text" bind:value={$alphabet}>
    </div>
    <!-- Body -->
    <div class='row' style="height: 84vh">
        <!-- Word Entry Side -->
        <div class='container collapsible-column' style='height: 100%'>
            <button class="collapser" on:click={ () => collapsedPanel = !collapsedPanel }></button>
            <div class:collapsed={collapsedPanel} class='text-center scrolled' style="height: 100%; overflow-x: hidden">
                <label for="wrd-input">New Word</label>
                <input id="wrd-input" type="text" bind:value={$word_input} on:input={() => $word_pronunciation = get_pronunciation($word_input)}>
                <input id="pronunciation" class="pronunciation" type="text" bind:value={$word_pronunciation}>
                <br>
                <label for="def-input">Definition</label>
                <textarea name="Definition" id="def-input" rows="16" bind:value={def_input}></textarea>
                <br>
                <label for="tags">Tags</label>
                <textarea id="tags" rows="1" bind:value={tags_input}></textarea>
                <br>
                {#if !($word_input in $lexicon)}
                    <button class="hover-highlight hover-shadow" id="add-word-button" on:click={() => add_word(false)}>Add Word</button>
                {:else}
                    <div class="row" id="definition-exists">
                        <button id="overwrite" class="hover-shadow" on:click={() => add_word(false)}>Overwrite Entry</button>
                        <button id="append" class="hover-shadow hover-highlight" on:click={() => add_word(true)}>Append Definition</button>
                    </div>
                {/if}
                <div style="width: 100vw"></div>
            </div>
        </div>
        
        <!-- Lexicon -->
        <div class='container column text-center' style="height: 100%">
            <div class='row'>
                <div class="column search-container">
                    {#if !search_words}
                            <label for="search-wrd" style="position: absolute; top: 0.5em; left: 1em">Search by word…</label>
                    {/if}
                    <input id="search-wrd" type="text" class="search" bind:value={search_words} on:input={search_lex}/>
                </div>
                <div class="column search-container">
                    {#if !search_tags}
                            <label for="search-tag" style="position: absolute; top: 0.5em; left: 1em">Search by tags…</label>
                    {/if}
                    <input id="search-tag" type="text" class="search" bind:value={search_tags} on:input={search_lex}/>
                </div>
            </div>
            <div class="search-container">
                {#if !search_definitions}
                    <label for="search-def" style="position: absolute; top: 0.33em; left: 1em">Search definitions…</label>
                {/if}
                <input id="search-def" type="text" class="search" bind:value={search_definitions} on:input={search_lex}/>
            </div>
            <div class='scrolled' style="height: 88%">
                {#each alphabetized as word}
                    <LexEntry entry={word} on:edit={() => edit_entry(word)}/>
                {:else}
                    <p class="info" id="lex-body">Add new words on the left</p>
                {/each}
            </div>
            <p id="entry-counter">
                {#if !!keys} <!-- if there is a search being attempted -->
                    {!!keys[0]? keys.length : '0'} {(keys.length === 1 && !!keys[0])? 'Match' : 'Matches'}
                {:else} <!-- if there is no search being attempted -->
                    {Object.keys($lexicon).length} {Object.keys($lexicon).length === 1? 'Entry' : 'Entries'}
                {/if}
            </p>
        </div>
    </div>
</div>
