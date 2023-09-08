<script lang="ts">
    import type * as Lect from '../types';
    import { Language } from '../stores';

    export let pronunciations: Lect.EntryPronunciations;
</script>
{#if $Language.ShowPronunciation}
    {#if Object.keys(pronunciations).length > 1 || $Language.UseLects || pronunciations.General === undefined}
        {#each Object.keys(pronunciations) as lect}
            <p class="lect">
                <u>{lect}</u>
                <span class="pronunciation">
                    {pronunciations[lect].ipa}
                </span>
            </p>
        {/each}
    {:else}
        <p class="pronunciation">
            {pronunciations.General.ipa}
        </p>
    {/if}
{/if}
