<svelte:options runes/>
<script lang=ts>
    import { Language } from '../stores';
    import { parseRules, applyRules } from '../utils/sca';
    import type { Word, Phrase, Variant } from '../types';
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
        <p style:font-family={$Language.Orthographies.find(o => o.name === ortho.name)?.font}
        >{(()=>{
            const settings = parseRules($Language.Orthographies.find(o => o.name === ortho.name)!.rules);
            return applyRules(settings.rules, ortho.root === 'rom'? word : source.pronunciations[ortho.lect].ipa, settings.categories);
        })()}</p>
    {/if}
{/each}
