<script lang="ts">
    const { ipcRenderer } = require('electron');
    import { Language, wordInput, pronunciations, selectedTab, hideDropdowns, CurrentLayouts, senses } from '../../stores';
    import type * as Lexc from '../../types';
    import { alphabetize } from '../../utils/alphabetize';
    import LexEntry from './LexEntry.svelte';
    import Draggable from '../Draggable.svelte';

    let defInputs = [''];
    let searchWords = ''; let searchDefinitions = ''; let searchTags = ''; let lectFilter = '';
    $: searchWords, searchDefinitions, searchTags, lectFilter; // Update the search when these values change
    let keys: (string | null)[] = [];

    let filtered_lex: Lexc.Lexicon;
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key !== null && key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
        return acc;
    }, {} as Lexc.Lexicon);

    let alphabetized: string[];
    $: { // Update the alphabetized lexicon when conditions change
        $Language; 
        $Language.Lexicon; $Language.Pronunciations;
        $Language.ShowEtymology; $Language.Etymologies; 
        $Language.ShowInflection; $Language.Inflections; 
        $Language.Alphabet; $Language.Orthographies;
        keys;
        (() => {
            alphabetized = alphabetize(!!keys.length? filtered_lex : $Language.Lexicon)
        })();
    } 

    function scrollIntoView(word: string) {
        const entry = document.getElementById(word);
        if (entry) {
            if (!!$selectedTab) {
                $Language.Layouts.tabmode === 'switch'
                    ? $selectedTab = [0]
                    : $selectedTab.push(0)
            };
            searchDefinitions = ''; searchTags = ''; searchWords = ''; lectFilter = '';
            entry.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        };
    }
    ipcRenderer.on('lexicon link', (_:any, word: string) => {
        console.log('link:', word);
        scrollIntoView(word);
    });

    /**
     * This function is used to delete an entry from the lexicon and
     * move it into the input fields for editing or deletion. If there
     * is text in the input fields, it asks the user for overwrite
     * confirmation. 
     * @param {string} word
     */
    function editEntry (word: string): void {
        let confirmation = true;
        if (!!$wordInput || !!defInputs[0]) {
            confirmation = confirm(
                'There is text in the word entry fields. Are you sure you want to overwrite it?'
            );
        }
        if (confirmation) {
            $wordInput = word;
            $pronunciations = {};
            Object.keys($Language.Lexicon[word].pronunciations).forEach(lect => {
                $pronunciations[lect] = $Language.Lexicon[word].pronunciations[lect].ipa;
            });
            $senses = [...$Language.Lexicon[word].Senses].map(sense => ({
                definition: sense.definition,
                tags: sense.tags.join(' '),
                lects: sense.lects,
            }));
            // debug.logObj(senses, 'senses');
            $hideDropdowns = true;
            // timeout is necessary to let the dropdowns close before the lexicon is updated
            // hiding the inflections dropdowns is necessary to prevent a persistency bug that can lead to a soft crash
            let { [word]: _, ...rest } = $Language.Lexicon;
            $Language.Lexicon = rest;
            $hideDropdowns = false;
            // window.setTimeout(() => {
            //     let { [word]: _, ...rest } = $Language.Lexicon;
            //     $Language.Lexicon = rest;
            //     $hideDropdowns = false;
            // }, 100);
        }
    }


    /**
     * Searches the lexicon for a word, definition, or tag. 
     * The character '!' is used to require an exact match.
     * The caret '^' can be used to represent the beginning
     * or end of a word. Searches are combinative, and only
     * results which match all search input fields will be
     * selected as matches. 
     */
    function search_lex(): void {
        let words_search = $Language.CaseSensitive?  searchWords.trim() : searchWords.toLowerCase().trim();
        let definitions_search = searchDefinitions.toLowerCase().trim();
        let tags_search = searchTags.toLowerCase().trim();
        keys = [];
        if (!!words_search || !!definitions_search || !!tags_search || !!lectFilter) { // if there is at least one search term
            for (let word in $Language.Lexicon) {
                let entry = $Language.Lexicon[word];
                let match = true;

                // check lect filter
                if ( !!lectFilter ) {
                    if ( !entry.Senses.some(sense => sense.lects.includes(lectFilter)) ) {
                        match = false;
                        continue;
                    }
                }

                // check word
                if ( !!words_search ) {
                    let caseFixedWord = $Language.CaseSensitive? word : word.toLowerCase();
                    if ( words_search[0] === '!') { // requires exact match
                        if (caseFixedWord !== words_search.split('!')[1]) {
                            match = false;
                            continue;
                        }
                    } else if ( !('^' + caseFixedWord.replaceAll(/\s+/g, '^') + '^').includes(words_search.replaceAll(/\s+/g, '^')) ) {
                        // searches for inexact match
                        match = false;
                        continue;
                    }
                }

                // check definitions
                if ( !!definitions_search ) {
                    if ( definitions_search[0] === '!' ) { // requires exact match
                        if (!entry.Senses.some(sense => {
                            return sense.definition === definitions_search.split('!')[1]
                        })) {
                            match = false;
                            continue;
                        }
                    } else if (!entry.Senses.some(sense =>
                        ["^", sense.definition, "^"]
                        .join()
                        .replaceAll(/\s+/g, '^')
                        .toLowerCase()
                        .includes(
                            definitions_search
                            .replaceAll(/\s+/g, '^')
                        )
                    )) {
                        // searches for inexact match
                        match = false;
                        continue;
                    }
                }

                // check tags
                if ( !!tags_search ) {
                    let tag_search_array = tags_search.split(/\s+/);
                    for (let tag_search of tag_search_array) {
                        if (tag_search[0] === '!') { // requires exact match (per tag basis)
                            if (!entry.Senses.some(sense => sense.tags.some(tag => tag.toLowerCase() === tag_search.split('!')[1]))) {
                                match = false;
                                continue;
                            }
                        } else if ( !entry.Senses.some(sense => sense.tags.some(tag => `^${tag.toLowerCase()}^`.includes(tag_search))) ) { 
                            // searches for inexact match (per tag basis)
                            match = false;
                            continue;
                        }
                    }
                }

                if ( match ) {
                    keys = [...keys, word];
                }
            }
            if (!keys.length) {keys = [null]}; // Search was attempted, no results
        }
    }

    function multicolumn(flat: any[], columns: number) {
        let final = [];
        for (let i = 0; i < flat.length; i += columns) {
            let column = []
            for (let j = 0; j < columns; j += 1) {
                if (!flat[i+j]) break
                column.push(flat[i+j])
            }
            final.push(column)
        }
        return final
    }

    let displayWidth: number;
    let entryCounterWidth: number;
</script>

<Draggable panel=lexicon>
    <div class='container glasspane' style='
        overflow: hidden;
        postion: relative;
        width: 100%;
    ' bind:clientWidth={displayWidth}>
        <section id=search-filters style='
            position: absolute;
            width: {displayWidth}px;
        '>
            <div class='row'>
                <div class="column search-container">
                    {#if !searchWords}
                            <label for="search-wrd" style="position: absolute; top: 0.5em; left: 1em">Search by word…</label>
                    {/if}
                    <input id="search-wrd" type="text" class="search" bind:value={searchWords} on:input={search_lex}/>
                </div>
                <div class="column search-container">
                    {#if !searchTags}
                            <label for="search-tag" style="position: absolute; top: 0.5em; left: 1em">Search by tags…</label>
                    {/if}
                    <input id="search-tag" type="text" class="search" bind:value={searchTags} on:input={search_lex}/>
                </div>
            </div>
            <div class="row">
                <div class="search-container column">
                    {#if !searchDefinitions}
                        <label for="search-def" style="position: absolute; top: 0.33em; left: 1em">Search definitions…</label>
                    {/if}
                    <input id="search-def" type="text" class="search" bind:value={searchDefinitions} on:input={search_lex}/>
                </div>
                {#if $Language.UseLects}
                    <div class="column">
                        <label>Filter by lect:
                            <select bind:value={lectFilter}>
                                <option value=''>All</option>
                                {#each $Language.Lects as lect}
                                    <option value={lect}>{lect}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                {/if}
            </div>
        </section>
        <div class='scrolled' style='
            position: absolute;
            top: 95px;
            max-height: {$CurrentLayouts.positions['lexicon'].height - 95}px;
            width: {displayWidth}px;
        '>
            {#if displayWidth > 1200}

                {#each multicolumn(alphabetized, 3) as columns}
                    <div class='row' style='width: 72%'>
                        {#each columns as word}
                            <div class='column' style='width:33%; margin: auto'>
                                <LexEntry word={word} source={$Language.Lexicon[word]} showEtymology={true} edit={() => editEntry(word)}/>
                            </div>
                        {/each}
                    </div>
                    <br/>
                {:else}
                    <p class="info" id="lex-body">Add new words from the word editor panel</p>
                {/each}

            {:else if displayWidth > 600}

                {#each multicolumn(alphabetized, 2) as columns}
                    <div class='row' style='width: 72%'>
                        {#each columns as word}
                            <div class='column' style='width:50%; margin: auto'>
                                <LexEntry word={word} source={$Language.Lexicon[word]} showEtymology={true} edit={() => editEntry(word)}/>
                            </div>
                        {/each}
                    </div>
                    <br/>
                {:else}
                    <p class="info" id="lex-body">Add new words from the word editor panel</p>
                {/each}

            {:else}

                {#each alphabetized as word}
                    <LexEntry word={word} source={$Language.Lexicon[word]} showEtymology={true} edit={() => editEntry(word)}/>
                {:else}
                    <p class="info" id="lex-body">Add new words from the word editor panel</p>
                {/each}

            {/if}

        </div>
        <p id=entry-counter bind:clientWidth={entryCounterWidth} style='
            position: absolute;
            top: {$CurrentLayouts.positions['lexicon'].height - 30}px;
            left: {displayWidth/2 - entryCounterWidth/2}px;
        '>
            {#if !!keys[0]} <!-- if there is a search being attempted -->
                {!!keys[0]? keys.length : '0'} {(keys.length === 1 && !!keys[0])? 'Match' : 'Matches'}
            {:else} <!-- if there is no search being attempted -->
                {Object.keys($Language.Lexicon).length} {Object.keys($Language.Lexicon).length === 1? 'Entry' : 'Entries'}
            {/if}
        </p>
    </div>
</Draggable>
