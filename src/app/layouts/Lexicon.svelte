<script lang="ts">
    import { Language, wordInput, pronunciations } from '../stores';
    import type * as Lexc from '../types';
    import { alphabetize, alphabetPrecheck } from '../utils/alphabetize';
    import { get_pronunciation } from '../utils/phonetics';
    import LexEntry from '../components/LexEntry.svelte';
    import SenseInput from '../components/SenseInput.svelte';
    import { debug } from '../utils/diagnostics';
    const vex = require('vex-js');

    let defInputs = [''];
    let searchWords = ''; let searchDefinitions = ''; let searchTags = '';
    let lectFilter = '';
    let keys: string[] = [];

    let filtered_lex: Lexc.Lexicon;
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
        return acc;
    }, {});

    let alphabetized: string[];
    $: { // Update the alphabetized lexicon when conditions change
        $Language.Lexicon; 
        $Language.ShowEtymology; $Language.Etymologies; 
        $Language.ShowInflection; $Language.Inflections; 
        $Language.Alphabet; $Language.Pronunciations;
        keys;
        (() => {
            alphabetized = [];
             // REVIEW the timeout is to force the lexicon to clear before being repopulated
            window.setTimeout(() => alphabetized = alphabetize(!!keys.length? filtered_lex : $Language.Lexicon), 1);
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
        senses;
        lectSet = Array.from(new Set(senses.map(sense => [...sense.lects]).flat()))
    }

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
            debug.logObj(senses, 'senses');
            delete $Language.Lexicon[word];
            $Language.Lexicon = {...$Language.Lexicon}; // assignment trigger
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
                    $Language.Lects.forEach(lect => {
                        obj[lect] = {
                            ipa: $pronunciations[lect].trim(),
                            irregular: $pronunciations[lect].trim() !== get_pronunciation(word, lect),
                        }
                    });
                    return obj;
                })(), 
                Senses: senses.filter(emptySensesFilter).map(senseRemapper),
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
        if (!alphabetPrecheck(word)) {
            vex.dialog.confirm({
                message: `The word contains characters not present in the alphabet. Are you sure you want to add it?`,
                callback: (value: boolean) => {
                    if (value) {
                        commitWord(word, append);
                    };
                }
            });
        } else {
            commitWord(word, append);
        }
    }

    /**
     * Searches the lexicon for a word, definition, or tag. 
     * The character '!' is used to require an exact match.
     * The caret '^' can be used to represent the beginning
     * or end of a word. Searches are combinative, and only
     * results which match all search input fields will be
     * selected as matches. 
     * @returns {any}
     */
    function search_lex(): void {
        let words_search = $Language.CaseSensitive?  searchWords.trim() : searchWords.toLowerCase().trim();
        let definitions_search = searchDefinitions.toLowerCase().trim();
        let tags_search = searchTags.toLowerCase().trim()? searchTags.toLowerCase().trim().split(/\s+/g) : [];
        keys = [];
        if (!!words_search || !!definitions_search || !!tags_search[0] || !!lectFilter) {
            // Turn l into a list of [search by word terms, search by def terms
            let l = [[...words_search.split('|')], [...definitions_search.split('|')]];
            for (let word in $Language.Lexicon) {
                const w = '^' + word.replaceAll(/\s+/g, '^') + '^';
                let match = lectFilter? $Language.Lexicon[word].Senses.some(sense => sense.lects.includes(lectFilter)) : true;
                if (!match) continue;
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
                        let pattern = `\\b${a.split('!')[1]}\\b`;
                        $Language.Lexicon[word].Senses.forEach(sense => {
                            if (!sense.definition.toLowerCase().match(pattern)) {
                                // no exact word match
                                match = false;
                            }
                        });
                    } else if (!$Language.Lexicon[word].Senses.some(sense => sense.definition.toLowerCase().includes(a))) { 
                        // no partial match
                        match = false;
                    }
                }
                if (!!$Language.Lexicon[word].Senses.some(sense => !!sense.tags[0])) {
                    // has at least one tag
                    let partial_tag_match = false;
                    let needs_exact_match = false;
                    let has_exact_match = false;
                    for (let tag of $Language.Lexicon[word].Senses.map(sense => sense.tags).flat()) {
                        for (let a of tags_search) {
                            debug.log('`a` | `tag` : ' + a + ' | ' + tag, false)
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
                    if (!!tags_search[0] && ((!partial_tag_match) || (needs_exact_match && !has_exact_match))) {
                        match = false;
                    }
                } else {
                    // has no tags
                    if (!!tags_search[0]) {
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
                <input id="wrd-input" type="text" bind:value={$wordInput} on:input={() => {
                    Object.keys($pronunciations).forEach(lect => {
                        $pronunciations[lect] = get_pronunciation($wordInput, lect);
                    });
                }}>

                {#if $Language.UseLects}
                    {#each lectSet as lect}
                        <div class="row narrow">
                            <div class="column text-right">
                                <p class="lect">{lect}</p>
                            </div>
                            <div class="column text-left">
                                <input type="text" class="pronunciation text-left" bind:value={$pronunciations[lect]}/>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <input type="text" class="pronunciation" bind:value={$pronunciations.General}/>
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
