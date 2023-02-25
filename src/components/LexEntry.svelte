<script lang="ts">
    import { Language } from '../stores.js';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let entry: string = '';
</script>
<style>
    .sense {
        font-weight: bold;
        display: inline-block;
        width: 1rem;
    }
</style>
<div id='{entry}' class="lex-entry prelined" on:contextmenu={edit}>
    <p  style="font-style: italic">{entry}</p>
    {#each Object.values($Language.Lexicon[entry].pronunciations) as Pronunciation}
        <p class='pronunciation'>{Pronunciation.ipa}</p>
    {/each}
    {#each $Language.Lexicon[entry].Senses as Sense, i}
        <div class='sense'>{i+1}.</div>
        {#each Sense.tags as tag}
            <div class='tag-item'>{tag}</div>
        {/each}
        <p>{Sense.definition}</p>
    {/each}
</div>
