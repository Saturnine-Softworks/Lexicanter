<script lang="ts">
    import { Language, fileLoadIncrement } from "../stores";
    import { get_pronunciation, writeRomans, complete_word, generate_word } from '../utils/phonetics';
    import { tooltip } from '@svelte-plugins/tooltips';
    import type { AdvancedPhonotactics } from "../types";
    import { TransformStreamDefaultController } from "node:stream/web";
    let trial = ''; let ortho_test = '';
    function setInStone (event: Event) {
        const target = event.target as HTMLInputElement;
        const value = target.value.trim();
        const {[selectedLect]: _, ...rest} = $Language.Pronunciations;
        $Language.Pronunciations = {
            ...rest,
            [selectedLect]: value
        }
    }

    let APCategories = '';
    let APSyllables = '';
    let APConstructs: {enabled:boolean; structures:string}[] = [{enabled:true, structures:''}];
    let APIllegals = '';

    //NOTE - this section checks when fileLoadIncrement changes, and updates the AP fields from the Language store when it does
    function updateAPFields() {
        APCategories = Object.keys($Language.AdvancedPhonotactics.Categories).map(symbol => {
            return `${symbol} :: ${$Language.AdvancedPhonotactics.Categories[symbol].join(' ')}`
        }).join('\n');
        APSyllables = $Language.AdvancedPhonotactics.Syllables.join('\n');
        APConstructs = $Language.AdvancedPhonotactics.Constructs;
        APIllegals = $Language.AdvancedPhonotactics.Illegals.join(' ');
    }
    $: if ($fileLoadIncrement) updateAPFields();

    function setAPCategories() {
        $Language.AdvancedPhonotactics.Categories = {};
        APCategories.split('\n').forEach(line => {
            let symbol = line.split('::')[0].trim();
            if (!$Language.AdvancedPhonotactics.Categories[symbol]) {
                $Language.AdvancedPhonotactics.Categories[symbol] = [];
            }
            line.split('::')[1].trim().split(/\s+/g).forEach(token => {
                $Language.AdvancedPhonotactics.Categories[symbol].push(token);
            })
        })
    }
    function setAPSyllables() {
        $Language.AdvancedPhonotactics.Syllables = [];
        APSyllables.split('\n').forEach(line => {
            $Language.AdvancedPhonotactics.Syllables.push(line.trim());
        })
    }
    function setAPConstructs() {
        $Language.AdvancedPhonotactics.Constructs = [];
        for (let set of APConstructs) {
            $Language.AdvancedPhonotactics.Constructs.push({
                enabled: set.enabled,
                structures: set.structures.trim(),
            });
        }
    }
    function setAPIllegals() {
        $Language.AdvancedPhonotactics.Illegals = [];
        // space-separated tokens
        APIllegals.split(/\s+/g).forEach(token => {
            $Language.AdvancedPhonotactics.Illegals.push(token.trim());
        })
    }

    function generate_word_AP(recursion = 1) {
        let word = '';

        // SECTION: Helper function
        const checkForIllegals = (word: string) => {
            for (let illegal of $Language.AdvancedPhonotactics.Illegals) {
                if (word.includes(illegal) && illegal !== '') {
                    if (recursion <= 20) {
                        return generate_word_AP(recursion + 1);
                    } else {
                        return '[ ∅ ]';
                    }
                }
            }
            return word;
        }

        // SECTION: Freeform mode: No word structures
        if ($Language.AdvancedPhonotactics.Constructs.every(construct => !construct.enabled || construct.structures.trim() === '')) {
            for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
                let syllable = $Language.AdvancedPhonotactics.Syllables[Math.floor(Math.random() * $Language.AdvancedPhonotactics.Syllables.length)];
                if (syllable.includes('::')) { // failsafe for when categories are written in the syllables field but structures are not defined or disabled
                    syllable = syllable.split('::')[1].trim().split(/\s+/g)[Math.floor(Math.random() * syllable.split('::')[1].trim().split(/\s+/g).length)];
                }
                syllable.split('').forEach(symbol => {
                    if ($Language.AdvancedPhonotactics.Categories[symbol]) {
                        word += $Language.AdvancedPhonotactics.Categories[symbol][Math.floor(Math.random() * $Language.AdvancedPhonotactics.Categories[symbol].length)];
                    } else {
                        word += symbol;
                    }
                })
            }
            return checkForIllegals(word);
        }

        // SECTION: Structured mode
        // create a list of enabled constructs
        let enabled_constructs: string[] = [];
        for (let construct of $Language.AdvancedPhonotactics.Constructs) {
            if (construct.enabled) {
                enabled_constructs = enabled_constructs.concat(construct.structures.split(/\s+/g));
            }
        }

        // select a random construct
        const construct = enabled_constructs[Math.floor(Math.random() * enabled_constructs.length)];

        // parse the construct
        let symbols = construct.split('');
        let syllables: string[][] = new Array(symbols.length).fill([]);
        for (let i = 0; i < symbols.length; i++) {
            let symbol = symbols[i];
            // check for syllable categories
            for (let j = 0; j < $Language.AdvancedPhonotactics.Syllables.length; j++) {
                if ($Language.AdvancedPhonotactics.Syllables[j].replaceAll(/\s+/g, '').slice(0, 3) === symbol + '::') {
                    // add the syllables in the category to the list of syllables
                    syllables[i] = syllables[i].concat($Language.AdvancedPhonotactics.Syllables[j].split('::')[1].trim().split(/\s+/g));
                }
            }
            if (syllables[i].length === 0) {
                // if no syllables were found, add the symbol itself
                syllables[i] = [symbol];
            }
        }

        // generate the word
        let expanded_construct = '';
        for (let i = 0; i < syllables.length; i++) {
            let syllable = syllables[i][Math.floor(Math.random() * syllables[i].length)];
            expanded_construct += syllable;
        }

        // choose characters from the categories for each symbol
        for (let i = 0; i < expanded_construct.length; i++) {
            let symbol = expanded_construct[i];
            if ($Language.AdvancedPhonotactics.Categories[symbol]) {
                word += $Language.AdvancedPhonotactics.Categories[symbol][Math.floor(Math.random() * $Language.AdvancedPhonotactics.Categories[symbol].length)];
            } else {
                word += symbol;
            }
        }
        return checkForIllegals(word);
    }

    function updatePhonologyInput () {
        (document.getElementById('pronunciations-input') as HTMLInputElement).value = $Language.Pronunciations[selectedLect];
    }
    $: trial_completion = complete_word(trial);
    let selectedLect: string = $Language.Lects[0];
    $: {
        $Language.Lects;
        selectedLect = $Language.UseLects? selectedLect : $Language.Lects[0];
        if (!$Language.Lects.includes(selectedLect)) {
            selectedLect = $Language.Lects[0];
        }
    }
    $: test_pronunciation = get_pronunciation(ortho_test, selectedLect);
    let generated_words = Array(24).fill('');

</script>
<!-- Phonology Tab -->
<div class="tab-pane">
    <div class="row" style="height: 92vh">
        <!-- Phonotactics -->
        <div class="container column scrolled" style="height: 100%">
            <label use:tooltip={{position:'right'}} title="Turn this on to show a type of word generator better suited for complex structures.">
                <input type="checkbox" bind:checked={$Language.UseAdvancedPhonotactics} />
                Use Advanced Phonotactics
            </label>
            <br><br>
            {#if $Language.UseAdvancedPhonotactics}
                <div class="row">
                    <div class="column">
                        <label use:tooltip={{position:'right'}} title="This field is for defining categories of phonemes. See the Help tab for more information.">Categories
                            <textarea class="phonology text-left" rows=8 bind:value={APCategories} on:blur={setAPCategories}/>
                        </label>
                    </div>
                    <div class="column">
                        <label use:tooltip={{position:'left'}} title="This field is for defining syllable structures. See the Help tab for more information.">Syllables
                            <textarea class="phonology text-left" rows=8 bind:value={APSyllables} on:blur={setAPSyllables}/>
                        </label>
                    </div>
                </div>
                <div class="row">
                    <div class="column">
                        <label use:tooltip={{position:'right'}} title="This field is for defining word structures. See the Help tab for more information.">Structures
                            {#each APConstructs as set, i}
                                <div class="row">
                                    <div class="column narrow">
                                        <div class="row">
                                            <input type='checkbox' bind:checked={set.enabled} on:change={setAPConstructs}/>
                                        </div>
                                        <div class="row">
                                            <button class="hover-highlight hover-shadow" on:click={() => {
                                                if (APConstructs.length > 1) {
                                                    APConstructs.splice(i, 1);
                                                    APConstructs[0].structures + ' '; // this is (a dumb, but working way) to force a re-render
                                                    APConstructs[0].structures = APConstructs[0].structures.trim();
                                                }
                                            }}>-</button>
                                        </div>
                                    </div>
                                    <div class="column">
                                        <textarea class="phonology text-left" rows=3 bind:value={set.structures} on:blur={setAPConstructs}/>
                                    </div>
                                </div>
                            {/each}
                            <button class="hover-highlight hover-shadow" on:click={() =>{
                                APConstructs.push({
                                    enabled: true,
                                    structures: ' ',
                                });
                                APConstructs[0].structures + ' '; // this is (a dumb, but working way) to force a re-render
                                APConstructs[0].structures = APConstructs[0].structures.trim();
                            }}>Add Set</button>
                        </label>
                    </div>
                    <div class="column">
                        <label use:tooltip={{position:'left'}} title='This field is for defining illegal combinations in words. See the Help tab for more information.'>Illegals
                            <textarea class="phonology text-left" rows=4 bind:value={APIllegals} on:blur={setAPIllegals}/>
                        </label>
                    </div>
                </div>
                <br>
                <button class="hover-highlight hover-shadow" on:click={
                    () => generated_words = Array(24).fill(null).map(_ => generate_word_AP())
                }>Generate Words</button>
            {:else}
                <label for="onsets" use:tooltip={{position:'right'}} title="This field is for defining consonants and cluster that can occur word-initially.">
                    Onset Consonants</label>
                <textarea id="onsets" class="phonology" bind:value={$Language.Phonotactics.General.Onsets}></textarea>
                <br>
                <label for="medials" use:tooltip={{position:'right'}} title="This field is for defining consonants and clusters that can occur word-medially.">
                    Medial Consonants</label>
                <textarea id="medials" class="phonology" bind:value={$Language.Phonotactics.General.Medials}></textarea>
                <br>
                <label for="codas" use:tooltip={{position:'right'}} title="This field is for defining consonants and clusters that can occur word-finally.">
                    Coda Consonants</label>
                <textarea id="codas" class="phonology" bind:value={$Language.Phonotactics.General.Codas}></textarea>
                <br>
                <label for="vowels" use:tooltip={{position:'right'}} title="This field is for defining vowels or sounds which can occur as a syllable’s nucleus.">
                    Vowels</label>
                <textarea id="vowels" class="phonology" bind:value={$Language.Phonotactics.General.Vowels}></textarea>
                <br>
                <label for="illegals" use:tooltip={{position:'right'}} title="This field is for defining combinations of characters that should never occur.">
                    Illegal Combinations</label>
                <textarea id="illegals" class="phonology" bind:value={$Language.Phonotactics.General.Illegals}></textarea>
                <br><br>
                <label for="trial" use:tooltip={{position:'right'}} title="This field allows you to begin typing a word while being shown possible completions for it.">
                    Trial Words</label>
                <input type="text" id="trial" bind:value={trial}/>
                <p style="font-family: Gentium">{trial_completion}</p>
                <br>
                <button class="hover-highlight hover-shadow" on:click={
                    () => generated_words = Array(24).fill(null).map(_ => generate_word())
                }>Generate Words</button>
            {/if}
            {#each Array(generated_words.length/3).fill(null) as _, i}
                <div class="row">
                    {#each generated_words.slice(i * 3, i * 3 + 3) as word}
                        <div class="column">
                            <p class="prelined" style="font-family: Gentium">{word}</p>
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
        <!-- Romanization -->
        <div class="container column scrolled" style="height: 100%">
            <label use:tooltip={{position:'bottom'}} title="This field is for writing pronunciation rules to convert your romanization to phonetic notation. See the Help tab for more information."
                > Pronunciations
                {#if $Language.UseLects}    
                    <select bind:value={selectedLect} on:change={updatePhonologyInput}>
                        {#each $Language.Lects as lect}
                            <option value={lect}>{lect}</option>
                        {/each}
                    </select>
                {/if}
                <textarea class="prelined" rows="24" style="text-align: left" id="pronunciations-input"
                    value={$Language.Pronunciations[selectedLect]}
                    on:blur={e => {
                        setInStone(e); // binding directly to the store is very slow when the language is large
                        writeRomans(selectedLect);
                    }}
                />
            </label>
            <br><br>
            <label use:tooltip={{position:'top'}} title="This field allows you to test that your rules are working as expected.">
                Rule Testing
                <textarea 
                    class="prelined" rows="2" 
                    bind:value={ortho_test}
                />
            </label>
            <textarea
                class="pronunciation" rows="2"
                bind:value={test_pronunciation}
                readonly
            />
        </div>
    </div>
</div>
