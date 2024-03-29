<script lang="ts">
    const { ipcRenderer } = require('electron');
    import { Language, wordInput, pronunciations, selectedTab, hideDropdowns } from '../stores';
    import type * as Lexc from '../types';
    import { alphabetize, alphabetPrecheck } from '../utils/alphabetize';
    import { get_pronunciation } from '../utils/phonetics';
    import LexEntry from '../components/LexEntry.svelte';
    import SenseInput from '../components/SenseInput.svelte';
    import { debug } from '../utils/diagnostics';
    const vex = require('vex-js');
    import { tooltip } from '@svelte-plugins/tooltips';

    ipcRenderer.on('update-lexicon-for-gods-sake-please', () => {
        $Language.Lexicon = {...$Language.Lexicon};
    });
    let defInputs = [''];
    let searchWords = ''; let searchDefinitions = ''; let searchTags = ''; let lectFilter = '';
    $: searchWords, searchDefinitions, searchTags, lectFilter; // Update the search when these values change
    let keys: string[] = [];

    let filtered_lex: Lexc.Lexicon;
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
        return acc;
    }, {});

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

    let collapsedPanel: boolean = false;

    type senseInput = {
        definition: string;
        tags: string;
        lects: string[];
    }
    let senses: senseInput[] = [{
        definition: '',
        tags: '',
        lects: [...$Language.Lects],
    }];

    let lectSet: string[]
    $: { // Update the set of lects when the `senses` array changes
        senses; $Language.Lects; $Language.UseLects;
        lectSet = Array.from(new Set(senses.map(sense => [...sense.lects]).flat().filter(lect => $Language.Lects.includes(lect))))
    }

    function scrollIntoView(word: string) {
        const entry = document.getElementById(word);
        if (entry) {
            if (!!$selectedTab) $selectedTab = 0;
            searchDefinitions = ''; searchTags = ''; searchWords = ''; lectFilter = '';
            entry.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        };
    }
    ipcRenderer.on('lexicon link', (_, word) => {
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
            senses = [...$Language.Lexicon[word].Senses].map(sense => ({
                definition: sense.definition,
                tags: sense.tags.join(' '),
                lects: sense.lects,
            }));
            // debug.logObj(senses, 'senses');
            $hideDropdowns = true;
            // timeout is necessary to let the dropdowns close before the lexicon is updated
            // hiding the inflections dropdowns is necessary to prevent a persistency bug that can lead to a soft crash
            window.setTimeout(() => {
                let { [word]: _, ...rest } = $Language.Lexicon;
                $Language.Lexicon = rest;
                $hideDropdowns = false;
            }, 50);
        }
    }

    /**
     * Creates a new lexicon entry, or appends to an existing one.
     * @param {string} word
     * @param {bool} append
     */
    function commitWord(word: string, append: boolean): void {
        const emptySensesFilter = (sense: senseInput) => <boolean> (senses[''] !== sense) && (!!sense.definition);
        const senseRemapper = (sense: senseInput) => <Lexc.Sense> {
            definition: sense.definition,
            tags: sense.tags.split(/\s+/g),
            lects: sense.lects,
        };
        if (!append) {
            $Language.Lexicon[word] = <Lexc.Word> {
                pronunciations: <Lexc.EntryPronunciations> (() => {
                    const obj: Lexc.EntryPronunciations = {};
                    Object.keys($pronunciations).filter(key => senses.map(sense => sense.lects).flat().includes(key)).forEach(lect => {
                        obj[lect] = {
                            ipa: $pronunciations[lect].trim(),
                            irregular: $pronunciations[lect].trim() !== get_pronunciation(word, lect),
                        }
                    });
                    return obj;
                })(), 
                Senses: senses.filter(emptySensesFilter).map(senseRemapper),
                Timestamp: Date.now(),
            };
        } else {
            $Language.Lexicon[word].Senses.push(...senses.filter(emptySensesFilter).map(senseRemapper));
        }
        $Language.Lexicon = {...$Language.Lexicon}; // assignment trigger

        // follow_lex_link(word);
        $wordInput = '';
        $pronunciations = (()=>{
            const obj = {};
            $Language.Lects.forEach(lect => {
                obj[lect] = ''
            });
            return obj;
        })();
        senses = [{
            definition: '',
            tags: '',
            lects: [...$Language.Lects],
        }];
    }

    /**
     * This function is called when the user clicks the "Add Word" button.
     * It checks for empty input fields and invalid characters, and then calls
     * {@link commitWord} to add the word to the lexicon.
     * @param {bool} append
     */
    function addWord(append: boolean): void {
        let word = $wordInput.trim()
        if (!word) return;
        if (!senses[0].definition) return;
        if (!senses.map(sense => sense.lects).flat().length) return;
        if (!alphabetPrecheck(word)) {
            vex.dialog.confirm({
                message: `The word contains characters not present in the alphabet. Are you sure you want to add it?`,
                callback: (value: boolean) => {
                    if (value) {
                        commitWord(word, append);
                        window.setTimeout(() => scrollIntoView(word), 50);
                    };
                }
            });
        } else {
            commitWord(word, append);
            window.setTimeout(() => scrollIntoView(word), 50);
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
                        if (!entry.Senses.some(sense => sense.definition === definitions_search.split('!')[1])) {
                            match = false;
                            continue;
                        }
                    } else if (!entry.Senses.some(sense => sense.definition.replaceAll(/\s+/g, '^').toLowerCase().includes(definitions_search.replaceAll(/\s+/g, '^')))) {
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
</script>
<!-- Lexicon Tab -->
<div class='tab-pane'>
    <!-- Header -->
    <div class='container row text-center header'>
        <div class="narrow-col">
            <label for="case-sensitive" style="margin: auto;"
                use:tooltip={{position: 'bottom'}} title="This setting determines whether or not alphabetization is case sensitive."
            > Case Sensitivity </label>
            <input type="checkbox" style="width: 15px; margin: auto;" id="case-sensitive" bind:checked={$Language.CaseSensitive} />
        </div>
        <div class="narrow-col">
            <label for="ignore-diacritic" style="margin: auto; text-align: right;"
                use:tooltip={{position: 'bottom'}} title="This setting determines whether or not diacritics are taken into account during alphabetization."
            >Ignore Diacritics</label>
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
                <label for="wrd-input"
                use:tooltip={{position: 'bottom'}} title="Write your new word here in its romanized form."
                >New Word</label>
                <input id="wrd-input" type="text"
                    bind:value={$wordInput}
                    on:input={() => {
                        lectSet.forEach(lect => {
                            $pronunciations[lect] = get_pronunciation($wordInput, lect);
                        });
                    }}
                >
                {#if $Language.UseLects}
                    {#each lectSet as lect}
                        <div class="row narrow">
                            <div class="column text-right">
                                <p class="lect">{lect}</p>
                            </div>
                            <div class="column text-left">
                                <span use:tooltip={{position: 'bottom'}} title={`This field is for the pronunciation of your word in your ${lect} lect. It will auto-populate based on rules you set in the Phonology tab for this lect.`}>
                                    <input type="text" class="pronunciation text-left" bind:value={$pronunciations[lect]}/>
                                </span>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <span use:tooltip={{position: 'bottom'}} title="This field is for the pronunciation of your word. It will auto-populate based on rules you set in the Phonology tab.">
                        <input type="text" class="pronunciation" bind:value={$pronunciations.General}/>
                    </span>
                {/if}
                
                {#each senses as sense, i}
                    <SenseInput
                        index={i}
                        bind:definition={sense.definition}
                        bind:tags={sense.tags}
                        bind:lects={sense.lects}
                        on:remove={() => {
                            senses = senses.filter((_, j) => j !== i);
                        }}
                        on:commit={() => { addWord(false); }}
                    />
                {/each}
                <button class="hover-highlight hover-shadow" id="add-sense-button" 
                    use:tooltip={{position: 'right'}} title="If this word has unrelated definitions, adding multiple senses is a good way to separate them visually and give them separate sets of tags."
                    on:click={() => {
                        senses = [...senses, {definition: '', tags: '', lects: [...$Language.Lects]}];
                }}>Add Sense</button>
                {#if !($wordInput in $Language.Lexicon)}
                    <button class="hover-highlight hover-shadow" id="add-word-button" on:click={() => addWord(false)}>Add Word</button>
                {:else}
                    <div class="row" id="definition-exists">
                        <button id="overwrite" class="hover-shadow" 
                            use:tooltip={{position: 'bottom'}} title="If you want to replace an existing entry with a new one, you can use this button to overwrite it."
                            on:click={() => addWord(false)}>Overwrite Entry</button>
                        <button id="append" class="hover-shadow hover-highlight" 
                            use:tooltip={{position: 'bottom'}} title="If you want to add new sense(s) to an existing word, you can use this button to append your work to the existing entry."
                            on:click={() => addWord(true)}>Append Definition</button>
                    </div>
                {/if}
                <div style="width: 100vw"></div>
            </div>
        </div>
        
        <!-- Lexicon -->
        <div class='container column text-center' style="height: 100%">
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
            <div class='scrolled' style="height: 88%">
                {#each alphabetized as word}
                    <LexEntry word={word} source={$Language.Lexicon[word]} showEtymology={true} on:edit={() => editEntry(word)}/>
                {:else}
                    <p class="info" id="lex-body">Add new words on the left</p>
                {/each}
            </div>
            <p id="entry-counter">
                {#if !!keys[0]} <!-- if there is a search being attempted -->
                    {!!keys[0]? keys.length : '0'} {(keys.length === 1 && !!keys[0])? 'Match' : 'Matches'}
                {:else} <!-- if there is no search being attempted -->
                    {Object.keys($Language.Lexicon).length} {Object.keys($Language.Lexicon).length === 1? 'Entry' : 'Entries'}
                {/if}
            </p>
        </div>
    </div>
</div>
