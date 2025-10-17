<script lang="ts">

    const { ipcRenderer } = require('electron');
    import { Language, wordInput, pronunciations, senses } from '../../stores';
    import type { senseInput } from '../../stores';
    import type * as Lexc from '../../types';
    import { alphabetize, alphabetPrecheck } from '../../utils/alphabetize';
    import { get_pronunciation } from '../../utils/phonetics';
    import SenseInput from '../SenseInput.svelte';
    import Draggable from '../Draggable.svelte';
    const vex = require('vex-js');

    ipcRenderer.on('update-lexicon-for-gods-sake-please', () => {
        $Language.Lexicon = {...$Language.Lexicon};
    });

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

    let lectSet: string[]
    $: { // Update the set of lects when the `senses` array changes
        $senses; $Language.Lects; $Language.UseLects;
        lectSet = Array.from(new Set($senses.map(sense => [...sense.lects]).flat().filter(lect => $Language.Lects.includes(lect))))
    }

    /**
     * Creates a new lexicon entry, or appends to an existing one.
     * @param {string} word
     * @param {bool} append
     */
    function commitWord(word: string, append: boolean): void {
        // TODO: why the fuck am I indexing `senses` with an empty string, and why the fuck does it work?
        // @ts-ignore
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
                    Object.keys($pronunciations).filter(key => $senses.map(sense => sense.lects).flat().includes(key)).forEach(lect => {
                        obj[lect] = {
                            ipa: $pronunciations[lect].trim(),
                            irregular: $pronunciations[lect].trim() !== get_pronunciation(word, lect),
                        }
                    });
                    return obj;
                })(), 
                Senses: $senses.filter(emptySensesFilter).map(senseRemapper),
                Timestamp: Date.now(),
            };
        } else {
            $Language.Lexicon[word].Senses.push(...$senses.filter(emptySensesFilter).map(senseRemapper));
        }
        $Language.Lexicon = {...$Language.Lexicon}; // assignment trigger

        // scroll to added word
        // window.setTimeout(() => ipcRenderer.send('lexicon link', word), 50);

        $wordInput = '';
        $pronunciations = (()=>{
            const obj = {};
            $Language.Lects.forEach(lect => {
                // @ts-ignore: complex type situation; needs to be refactored
                obj[lect] = '';
            });
            return obj;
        })();
        $senses = [{
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
        if (!$senses[0].definition) return;
        if (!$senses.map(sense => sense.lects).flat().length) return;
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
</script>

<Draggable panel=newword>
    <div class='container scrolled glasspane'>
        <label for="wrd-input">New Word</label>
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
                        <input type="text" class="pronunciation text-left" bind:value={$pronunciations[lect]}/>
                    </div>
                </div>
            {/each}
        {:else}
            <input type="text" class="pronunciation" bind:value={$pronunciations.General}/>
        {/if}
        
        {#each $senses as sense, i}
            <SenseInput
                index={i}
                bind:definition={sense.definition}
                bind:tags={sense.tags}
                bind:lects={sense.lects}
                remove={() => {
                    $senses = $senses.filter((_, j) => j !== i);
                }}
                commit={() => { addWord(false); }}
            />
        {/each}
        <button class="hover-highlight hover-shadow" id="add-sense-button" 
            on:click={() => {
                $senses = [...$senses, {definition: '', tags: '', lects: [...$Language.Lects]}];
        }}>Add Sense</button>
        {#if !($wordInput in $Language.Lexicon)}
            <button class="hover-highlight hover-shadow" id="add-word-button" on:click={() => addWord(false)}>Add Word</button>
        {:else}
            <div class="row" id="definition-exists">
                <button id="overwrite" class="hover-shadow" 
                    on:click={() => addWord(false)}>Overwrite Entry</button>
                <button id="append" class="hover-shadow hover-highlight" 
                    on:click={() => addWord(true)}>Append Definition</button>
            </div>
        {/if}
        <br><br>
    </div>
</Draggable>
