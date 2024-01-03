<script lang="ts">
    import type * as Lect from '../types';
    import { Language } from '../stores';
    import {tooltip} from '@svelte-plugins/tooltips';

    export let pronunciations: Lect.EntryPronunciations;
</script>
{#if $Language.ShowPronunciation}
    {#if Object.keys(pronunciations).length > 1 || $Language.UseLects || pronunciations.General === undefined}
        {#each Object.keys(pronunciations) as lect}
            <p class="lect">
                <u>{lect}</u>
                <span class="pronunciation">
                    {pronunciations[lect].ipa}
                    {#if pronunciations[lect].irregular}
                        <span use:tooltip={{position:'bottom'}} title='irregular pronunciation: rules are not being applied' class='material-icons' 
                            style='font-size:0.75em; margin-right:-1em'>
                        lightbulb</span>
                    {/if}
                </span>
            </p>
        {/each}
    {:else}
        <p class="pronunciation">
            {pronunciations.General.ipa}
            {#if pronunciations.General.irregular}
                <span use:tooltip={{position:'bottom'}} title='irregular pronunciation: rules are not being applied' class='material-icons' 
                    style='font-size:0.75em; margin-right:-1em'>
                lightbulb</span>
            {/if}
        </p>
    {/if}
{/if}
