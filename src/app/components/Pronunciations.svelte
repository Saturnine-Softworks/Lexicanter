<script lang="ts">
    import type * as Lect from '../types';
    import { Language } from '../stores';

    export let pronunciations: Lect.EntryPronunciations;
</script>
{#if $Language.UseLects}
    {#each Object.keys(pronunciations) as lect}
        <div class="row">
            <div class="column text-right lect">
                {lect}
            </div>
            <div class="column text-center pronunciation" style="width: 2em; font-weight: bold;">:</div>
            <div class="column">
                <p class="pronunciation text-left">
                    {pronunciations[lect].ipa}
                </p>
            </div>
        </div>
    {/each}
{:else}
    <p class="pronunciation">
        {pronunciations.General.ipa}
    </p>
{/if}
