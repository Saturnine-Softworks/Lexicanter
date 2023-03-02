<script lang="ts">
    import { Language, useDialects } from '../stores.js';
    import { createEventDispatcher } from 'svelte';
    import Pronunciations from './Pronunciations.svelte';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let entry: string = '';
</script>
<div id='{entry}' class="lex-entry prelined" on:contextmenu={edit}>
    <p  style="font-style: italic">{entry}</p>
    <Pronunciations pronunciations={$Language.Lexicon[entry].pronunciations} />
    {#each $Language.Lexicon[entry].Senses as Sense, i}
        {#if $Language.Lexicon[entry].Senses.length > 1} 
            <div class='sense'>{i+1}.</div>
        {/if}
        {#each Sense.tags as tag}
            {#if !!tag}
                <div class='tag-item'>{tag}</div>
            {/if}
        {/each}
        {#if $useDialects}        
            <p class="lect">
                {(()=>{
                    let s = '';
                    for (let lect of Sense.lects) {
                        s += lect + ', ';
                    }
                    return s.slice(0, -2);
                })()}
            </p>
        {/if}
        <p>{Sense.definition}</p>
    {/each}
</div>
