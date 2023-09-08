<script lang='ts'>
    import type * as Lexc from '../../types';
    import { referenceLanguage } from '../../stores';
    import { alphabetize } from '../../utils/alphabetize';
    import LexEntry from '../LexEntry.svelte';
    let Language: Lexc.Language;
    let alphabetized: string[];
    $: {
        Language = $referenceLanguage as Lexc.Language;
        alphabetized = alphabetize(Language.Lexicon);
    };

    let searchWords: string = '';
    let searchTags: string = '';
    let searchDefinitions: string = '';
    let lectFilter: string = '';
    let filtered_lex: Lexc.Lexicon = {};

    function search_lex() {
        filtered_lex = {};
        for (let word in Language.Lexicon) {
            if (`^${word}^`.toLowerCase().includes(searchWords.toLowerCase())
                && Language.Lexicon[word].Senses.some(sense => sense.tags.join('^').toLowerCase().includes(searchTags.toLowerCase()))
                && Language.Lexicon[word].Senses.some(sense => sense.definition.toLowerCase().match(new RegExp(searchDefinitions.replaceAll('^', '\\b'), 'gi')))
                && (lectFilter === '' || Language.Lexicon[word].Senses.some(sense => sense.lects.includes(lectFilter)))
            ) {
                filtered_lex[word] = Language.Lexicon[word];
            }
        }
        alphabetized = alphabetize(filtered_lex);
    }

</script>

<div class='row'>
    <div class="column search-container">
        {#if !searchWords}
                <label for="ref-search-wrd" style="position: absolute; top: 0.5em; left: 1em">Search by word…</label>
        {/if}
        <input id="ref-search-wrd" type="text" class="search" bind:value={searchWords} on:input={search_lex}/>
    </div>
    <div class="column search-container">
        {#if !searchTags}
                <label for="ref-search-tag" style="position: absolute; top: 0.5em; left: 1em">Search by tags…</label>
        {/if}
        <input id="ref-search-tag" type="text" class="search" bind:value={searchTags} on:input={search_lex}/>
    </div>
</div>
<div class="row">
    <div class="search-container column">
        {#if !searchDefinitions}
            <label for="ref-search-def" style="position: absolute; top: 0.33em; left: 1em">Search definitions…</label>
        {/if}
        <input id="ref-search-def" type="text" class="search" bind:value={searchDefinitions} on:input={search_lex}/>
    </div>
    {#if Language.UseLects}
        <div class="column">
            <label>Filter by lect: 
                <select bind:value={lectFilter}>
                    <option value=''>All</option>
                    {#each Language.Lects as lect}
                        <option value={lect}>{lect}</option>
                    {/each}
                </select>
            </label>
        </div>
    {/if}
</div>

<div class="scrolled" style="height: 88%">
    {#each alphabetized as word}
        <LexEntry {word} 
            source={Language.Lexicon[word]} 
            showInflections={Language.ShowInflection}
            showEtymology 
        />
    {:else}
        <p class="info" id="ref-lex-body">The lexicon of {Language.Name} is empty.</p>
    {/each}
</div>

