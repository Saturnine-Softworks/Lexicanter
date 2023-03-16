<script lang="ts">
    import { Language } from '../stores.js';
    import { createEventDispatcher } from 'svelte';
    import Pronunciations from './Pronunciations.svelte';
    import { debug } from '../utils/diagnostics.js';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let entry: string = '';
    export let showEtymology: boolean
    export let lexicon: string = '<< THIS LANGUAGE >>';
    const source = () => {
        return lexicon === '<< THIS LANGUAGE >>'
        ? $Language.Lexicon[entry]
        : $Language.Relatives[lexicon][entry]
    }

    function getAncestors(): string {
        const ancestors: string[][] = [];
        let currents = [entry]
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
        ancestorString = !!ancestorString? ancestorString + entry : '';
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
<div id='{entry}' class="lex-entry prelined" on:contextmenu={edit}>
    <p  style="font-style: italic">{entry}</p>
    <Pronunciations pronunciations={ source().pronunciations }/>
    {#each source().Senses as Sense, i}
        {#if source().Senses.length > 1} 
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
    {/each}
</div>
