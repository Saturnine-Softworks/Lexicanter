<script lang='ts'>
    import { referenceLanguage } from "../../stores";
    import type { Language } from "../../types";
    import PhraseEntry from "../PhraseEntry.svelte";
    let Language = $referenceLanguage as Language;
    $: Language = $referenceLanguage as Language;
    let selectedCat = '';
    $: selectedCat = Object.keys(Language.Phrasebook)[0];
</script>

{#if selectedCat !== undefined && selectedCat in Language.Phrasebook}
    <div class="scrolled" style="height: 100%">
        <label>Phrasebook
            <select bind:value={selectedCat}>
                {#each Object.keys(Language.Phrasebook) as cat}
                    <option value={cat}>{cat}</option>
                {/each}
            </select>
        </label>
        {#each Object.keys(Language.Phrasebook[selectedCat]) as phrase}
            <PhraseEntry {phrase} reference refCat={selectedCat}/>
        {/each}
    </div>
{/if}
