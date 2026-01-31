<svelte:options runes/>
<script lang=ts>
    import { Language } from '../stores';
    import { graphemify } from '../utils/interop';
    import { preprocess_ortho } from '../utils/phonetics';
    import type { Word, Phrase, Variant, Orthography } from '../types';
    let {
        word, 
        source
    } : {
        word: string, 
        source: Word|Phrase|Variant
    } = $props()

</script>

<!--                                                     check if source is a phrase/variant entry, use appropriate setting -->
{#if $Language.Orthographies.find(o => o.name === 'Romanization')!['description' in source? 'displayInPhrasebook' : 'display']}
        <p style="font-style: italic">{word}</p>
{/if}
{#each $Language.Orthographies as ortho}
    {#if ortho.name !== 'Romanization' 
        && (ortho.root === 'rom' || (ortho.lect in source.pronunciations))
        // check if source is a phrase/variant entry, use appropriate setting
        && ('description' in source? ortho.displayInPhrasebook : ortho.display) 
    }
        {#if !!ortho.graphemy}

            <svelte:boundary> <!-- I simply don't trust anything not to explode. -->
                {#key $Language.Lexicon}
                    {#await preprocess_ortho(word, ortho, source)}
                        <i>preprocessing...</i>
                    {:then input}
                        {#await graphemify(
                            ortho.graphemy.engine, 
                            input, 
                            ortho.graphemy.bounds.width, 
                            ortho.graphemy.bounds.height
                        )}
                            <i>generating...</i>
                        {:then svg} 
                            <span class=grapheme-svg>{@html svg}</span>
                        {/await}
                    {/await}
                    <!-- In the event that the graphemy renderer is in a murderous mood -->
                    {#snippet failed(error, reset)}
                        {console.dir(error)}
                        <p>Lexicanter is no match for your graphemes!</p>
                        <button onclick={reset}>Retry Render</button>
                    {/snippet}
                {/key}
            </svelte:boundary>

        {:else}
            <p style:font-family={$Language.Orthographies.find(o => o.name === ortho.name)?.font}>
                {#await preprocess_ortho(word, ortho, source)}
                    <i>preprocessing...</i>
                {:then output} 
                    {output}
                {/await}
            </p>
        {/if}

    {/if}
{/each}
