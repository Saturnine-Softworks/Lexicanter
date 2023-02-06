<script>
    import { romans_input, onsets, medials, codas, vowels, illegals } from "../stores";
    import { get_pronunciation, writeRomans, complete_word, generate_word } from '../scripts/phonetics.js';
    let trial = ''; let ortho_test = '';
    $: trial_completion = complete_word(trial);
    $: test_pronunciation = get_pronunciation(ortho_test);
    $: generated_words = Array(24).fill('');
</script>
<!-- Phonology Tab -->
<div class="tab-pane">
    <div class="row" style="height: 92vh">
        <!-- Phonotactics -->
        <div class="container column scrolled" style="height: 100%">
            <label for="onsets">Onset Consonants</label>
            <textarea id="onsets" class="phonology" bind:value={$onsets}></textarea>
            <br>
            <label for="medials">Medial Consonants</label>
            <textarea id="medials" class="phonology" bind:value={$medials}></textarea>
            <br>
            <label for="codas">Coda Consonants</label>
            <textarea id="codas" class="phonology" bind:value={$codas}></textarea>
            <br>
            <label for="vowels">Vowels</label>
            <textarea id="vowels" class="phonology" bind:value={$vowels}></textarea>
            <br>
            <label for="illegals">Illegal Combinations</label>
            <textarea id="illegals" class="phonology" bind:value={$illegals}></textarea>
            <br><br>
            <label for="trial">Trial Words</label>
            <input type="text" id="trial" bind:value={trial}/>
            <p style="font-family: Gentium">{trial_completion}</p>
            <br>
            <button class="hover-highlight hover-shadow" 
                on:click={() => generated_words = Array(24).fill().map(_ => generate_word())}
                    >Generate Words</button>
            {#each Array(generated_words.length/3).fill() as _, i}
                <div class="row">
                    {#each generated_words.slice(i * 3, i * 3 + 3) as word}
                        <div class="column">
                            <p class="prelined" style="font-family: Gentium">{word}</p>
                        </div>
                    {/each}
                </div>
            {/each}
            <br>
        </div>
        <!-- Romanization -->
        <div class="container column scrolled" style="height: 100%">
            <label for="romans">Pronunciations</label>
            <textarea id="romans" rows="30" style="text-align: left" class="prelined" 
                bind:value={$romans_input} on:blur={writeRomans}></textarea>
            <br><br>
            <label for="test-romans">Orthography Testing</label>
            <textarea id="test-romans" rows="4" class="prelined" bind:value={ortho_test}></textarea>
            <textarea id="test-romans-result" class="pronunciation" readonly>{test_pronunciation}</textarea>
        </div>
    </div>
</div>
