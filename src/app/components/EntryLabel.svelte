<svelte:options runes/>
<script lang=ts>
    import { hideDropdowns, Language } from '../stores';
    import { parseRules, applyRules } from '../utils/sca';
    import { graphemify } from '../../interop/interop';
    import type { Word, Phrase, Variant } from '../types';
    import { draw } from 'svelte/transition';
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
            {#if ortho.graphemy}

                <svelte:boundary> <!-- I simply don't trust anything not to explode. -->
                    {#await graphemify(ortho.font, word)}
                        <i>generating…</i>
                    {:then svg} 
                        {@html svg}
                    {/await}

                    <!-- In the event that the graphemy renderer is in a murderous mood -->
                    {#snippet failed(error, reset)}
                        {console.dir(error)}
                        <p>Lexicanter is no match for your graphemes!</p>
                        <button onclick={reset}>Retry Render</button>
                    {/snippet}

                </svelte:boundary>

            {:else if !ortho.graphemy}
                <p style:font-family={$Language.Orthographies.find(o => o.name === ortho.name)?.font}>
                    {(()=>{
                        const settings = parseRules($Language.Orthographies.find(o => o.name === ortho.name)!.rules);
                        return applyRules(settings.rules, ortho.root === 'rom'? word : source.pronunciations[ortho.lect].ipa, settings.categories);
                    })()}
                </p>
            {/if}

            

    {/if}
{/each}
