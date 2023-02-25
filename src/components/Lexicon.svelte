<script lang="ts">
    import { Language, wordInput, wordPronunciation } from '../stores';
    import type * as Lexc from '../scripts/types';
    import { alphabetize } from '../scripts/alphabetize';
    import { get_pronunciation } from '../scripts/phonetics';
    import LexEntry from './LexEntry.svelte';
    import SenseInput from './SenseInput.svelte';
    import { debug } from '../scripts/diagnostics';

    let def_inputs = ['']; let tags_inputs = [''];
    let search_words = ''; let search_definitions = ''; let search_tags = '';
    let keys: string[];
    $: keys = []

    // Debug block
    $: {
        debug.logObj($Language.Lexicon, 'Lexicon');
    }

    let filtered_lex: Lexc.Lexicon;
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
        return acc;
    }, {});
    let alphabetized: string[];
    // syntax below with IIFE is to trigger update to `alphabetized` on any change to either `$Language.Alphabet` or `keys`
    $: $Language.Alphabet, keys, (() => { alphabetized = alphabetize(!!keys.length? filtered_lex : $Language.Lexicon) })(); 

    let collapsedPanel: boolean;
    $: collapsedPanel = false;

    let senses: {
        definition: string;
        tags: string;
        lects: string[];
    }[];
    $: senses = [{
        definition: '',
        tags: '',
        lects: ['General'],
    }];
    /**
     * This function is used to delete an entry from the lexicon and
     * move it into the input fields for editing or deletion. If there
     * is text in the input fields, it asks the user for overwrite
     * confirmation. 
     * @param {string} word
     */
    function edit_entry (word: string): void {
        let confirmation = true;
        if (!!$wordInput || !!def_inputs[0]) {
            confirmation = confirm(
                'There is text in the word entry fields. Are you sure you want to overwrite it?'
            );
        }
        if (confirmation) {
            $wordInput = word;
            $wordPronunciation = $Language.Lexicon[word].pronunciations.General.ipa;
            senses = [...$Language.Lexicon[word].Senses].map(sense => ({
                definition: sense.definition,
                tags: sense.tags.join(' '),
                lects: sense.lects,
            }));
            debug.logObj(senses, 'senses');
            delete $Language.Lexicon[word];
            $Language.Lexicon = {...$Language.Lexicon}; // assignment trigger
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
    function addWord(append: boolean): string {
        let word = $wordInput.trim()
        if (!word) return;
        if (!senses[0].definition) return;
        let pronunciation = $wordPronunciation.trim()

        if (!append) {
            $Language.Lexicon[word] = <Lexc.Word> {
                pronunciations: <Lexc.EntryPronunciations> {
                    General: {
                        ipa: pronunciation,
                        irregular: pronunciation !== get_pronunciation(word),
                    }
                }, 
                Senses: senses.map(sense => <Lexc.Sense> {
                    definition: sense.definition,
                    tags: sense.tags.split(/\s+/g),
                    lects: sense.lects,
                }),
            };
        } else {
            $Language.Lexicon[word].Senses.push(...senses.map(sense => <Lexc.Sense> {
                definition: sense.definition,
                tags: sense.tags.split(/\s+/g),
                lects: sense.lects,
            }));
        }
        $Language.Lexicon = {...$Language.Lexicon}; // assignment trigger

        // follow_lex_link(word);
        $wordInput = '';
        $wordPronunciation = '';
        senses = [{
            definition: '',
            tags: '',
            lects: ['General'],
        }];

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
    function search_lex(): void {
        let words_search = $Language.CaseSensitive?  search_words.trim() : search_words.toLowerCase().trim();
        let definitions_search = search_definitions.toLowerCase().trim();
        let tags_search = search_tags.toLowerCase().trim()? search_tags.toLowerCase().trim().split(/\s+/g) : [];
        keys = [];
        if (!!words_search || !!definitions_search || !!tags_search) {
            // Turn l into a list of [search by word terms, search by def terms
            let l = [[...words_search.split('|')], [...definitions_search.split('|')]];
            for (let word in $Language.Lexicon) {
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
                        let pattern = new RegExp(`\\b${a.split('!')[1]}\\b`, 'i');
                        if (!pattern.test($Language.Lexicon[word][1].toLowerCase())) { // exact word match
                            match = false;
                        }
                    } else if (!$Language.Lexicon[word][1].toLowerCase().includes(a)) { // partial match
                        match = false;
                    }
                }
                if (!!$Language.Lexicon[word][3]) {
                    // has at least one tag
                    let partial_tag_match = false;
                    let needs_exact_match = false;
                    let has_exact_match = false;
                    for (let tag of $Language.Lexicon[word][3]) {
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
            <input type="checkbox" style="width: 15px; margin: auto;" id="case-sensitive" bind:checked={$Language.CaseSensitive} />
        </div>
        <div class="narrow-col">
            <label for="ignore-diacritic" style="margin: auto; text-align: right;">Ignore Diacritics</label>
            <input type="checkbox" style="width: 15px; margin: auto;" id="ignore-diacritic" bind:checked={$Language.IgnoreDiacritics}/>
        </div>
        <input id="alph-input" type="text" bind:value={$Language.Alphabet}>
    </div>
    <!-- Body -->
    <div class='row' style="height: 84vh">
        <!-- Word Entry Side -->
        <div class='container collapsible-column' style='height: 100%'>
            <button class="collapser" on:click={ () => collapsedPanel = !collapsedPanel }></button>
            <div class:collapsed={collapsedPanel} class='text-center scrolled' style="height: 100%; overflow-x: hidden">
                <label for="wrd-input">New Word</label>
                <input id="wrd-input" type="text" bind:value={$wordInput} on:input={() => $wordPronunciation = get_pronunciation($wordInput)}>
                <input id="pronunciation" class="pronunciation" type="text" bind:value={$wordPronunciation}>
                {#each senses as sense, i}
                    <SenseInput 
                        bind:definition={sense.definition}
                        bind:tags={sense.tags}
                        bind:lects={sense.lects}
                    />
                {/each}
                <button class="hover-highlight hover-shadow" id="add-sense-button" on:click={() => {
                    senses = [...senses, {definition: '', tags: '', lects: []}];
                }}>Add Sense</button>
                {#if !($wordInput in $Language.Lexicon)}
                    <button class="hover-highlight hover-shadow" id="add-word-button" on:click={() => addWord(false)}>Add Word</button>
                {:else}
                    <div class="row" id="definition-exists">
                        <button id="overwrite" class="hover-shadow" on:click={() => addWord(false)}>Overwrite Entry</button>
                        <button id="append" class="hover-shadow hover-highlight" on:click={() => addWord(true)}>Append Definition</button>
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
                    {Object.keys($Language.Lexicon).length} {Object.keys($Language.Lexicon).length === 1? 'Entry' : 'Entries'}
                {/if}
            </p>
        </div>
    </div>
</div>
