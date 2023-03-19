<script lang="ts">
    import { Language } from '../stores';
    import type { Word } from '../types';
    import { createEventDispatcher } from 'svelte';
    import { blur } from 'svelte/transition';
    import Pronunciations from './Pronunciations.svelte';
    import Inflections from '../components/Inflections.svelte';
    import { debug } from '../utils/diagnostics.js';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let word: string;
    export let source: Word;
    export let showEtymology: boolean

    function getAncestors(): string {
        const ancestors: string[][] = [];
        let currents = [word]
        while (Object.keys($Language.Etymologies).some(
            word => 
            $Language.Etymologies[word].descendants
            .some(descendant => currents.includes(descendant.name))
        )) {
            ancestors
            .push(Object.keys($Language.Etymologies)
                .filter(
                    word => 
                    $Language.Etymologies[word].descendants
                    .some(descendant => currents.includes(descendant.name))
                )
            );
            currents = ancestors[ancestors.length - 1];
        }
        ancestors.reverse();

        let ancestorString = '';
        ancestors.forEach(generation => {
            ancestorString += generation.join(', ') + ' → ';
        });
        ancestorString = !!ancestorString? ancestorString + word : '';
        /* debug.log(`
        Ancestor String: ${ancestorString}
        !!ancestorString: ${!!ancestorString}
        $Language.ShowEtymology: ${$Language.ShowEtymology}
        `, false); */
        return ancestorString;
    }

    let entryAncestors: string = '';
    $: {
        $Language.Etymologies;
        $Language.Lexicon; $Language.Relatives
        entryAncestors = getAncestors();
    }
</script>
<div id='{word}' class="lex-entry prelined" on:contextmenu={edit}>
    <p  style="font-style: italic">{word}</p>
    <Pronunciations pronunciations={ source.pronunciations }/>
    {#each source.Senses as Sense, i}
        {#if source.Senses.length > 1} 
            <div class='sense'>{i+1}.</div>
        {/if}
        {#each Sense.tags as tag}
            {#if !!tag}
                <div class='tag-item'>{tag}</div>
            {/if}
        {/each}
        {#if $Language.UseLects}        
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
        {#if $Language.ShowEtymology && !!entryAncestors && showEtymology}
            <hr />
            <p class="lex-body"><i>{entryAncestors}</i></p>
        {/if}
        {#if $Language.ShowInflection}
            <Inflections {word} tags={Sense.tags}/>
        {/if}
    {/each}
</div>
