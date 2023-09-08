<script lang="ts">
    import { Language } from "../stores";
    import { get_pronunciation, writeRomans, complete_word, generate_word } from '../utils/phonetics'
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
    function generate_word_AP() {
        let word = '';
            for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
                let syllable = $Language.AdvancedPhonotactics.Syllables[Math.floor(Math.random() * $Language.AdvancedPhonotactics.Syllables.length)];
                syllable.split('').forEach(symbol => {
                    if ($Language.AdvancedPhonotactics.Categories[symbol]) {
                        word += $Language.AdvancedPhonotactics.Categories[symbol][Math.floor(Math.random() * $Language.AdvancedPhonotactics.Categories[symbol].length)];
                    } else {
                        word += symbol;
                    }
                })
            }
        return word;
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
            <label>
                <input type="checkbox" bind:checked={$Language.UseAdvancedPhonotactics} />
                Use Advanced Phonotactics
            </label>
            <br><br>
            {#if $Language.UseAdvancedPhonotactics}
                <div class="row">
                    <div class="column">
                        <label>Categories
                            <textarea class="phonology text-left" rows="12" bind:value={APCategories} on:blur={setAPCategories}/>
                        </label>
                    </div>
                    <div class="column">
                        <label>Syllables
                            <textarea class="phonology text-left" rows="12" bind:value={APSyllables} on:blur={setAPSyllables}/>
                        </label>
                    </div>
                </div>
                <br>
                <button class="hover-highlight hover-shadow" on:click={
                    () => generated_words = Array(24).fill(null).map(_ => generate_word_AP())
                }>Generate Words</button>
            {:else}
                <label for="onsets">Onset Consonants</label>
                <textarea id="onsets" class="phonology" bind:value={$Language.Phonotactics.General.Onsets}></textarea>
                <br>
                <label for="medials">Medial Consonants</label>
                <textarea id="medials" class="phonology" bind:value={$Language.Phonotactics.General.Medials}></textarea>
                <br>
                <label for="codas">Coda Consonants</label>
                <textarea id="codas" class="phonology" bind:value={$Language.Phonotactics.General.Codas}></textarea>
                <br>
                <label for="vowels">Vowels</label>
                <textarea id="vowels" class="phonology" bind:value={$Language.Phonotactics.General.Vowels}></textarea>
                <br>
                <label for="illegals">Illegal Combinations</label>
                <textarea id="illegals" class="phonology" bind:value={$Language.Phonotactics.General.Illegals}></textarea>
                <br><br>
                <label for="trial">Trial Words</label>
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
            <label>Pronunciations
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
            <label>Orthography Testing
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
