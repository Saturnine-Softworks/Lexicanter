<svelte:options immutable/>
<script lang='ts'>
    import { Language } from '../stores';
    import { parseRules, applyRules } from '../utils/sca';
    import type { Word, Phrase, Variant } from '../types';
    export let word: string;
    export let source: Word | Phrase | Variant;
</script>
{#if $Language.Orthographies.find(o => o.name === 'Romanization').display}
        <p style="font-style: italic">{word}</p>
{/if}
{#each $Language.Orthographies as ortho}
    {#if ortho.name !== 'Romanization' && ortho.display && (ortho.root === 'rom' || (ortho.lect in source.pronunciations))}
        <p style:font-family={$Language.Orthographies.find(o => o.name === ortho.name).font}
        >{(()=>{
            const settings = parseRules($Language.Orthographies.find(o => o.name === ortho.name).rules);
            return applyRules(settings.rules, ortho.root === 'rom'? word : source.pronunciations[ortho.lect].ipa, settings.categories);
        })()}</p>
    {/if}
{/each}

