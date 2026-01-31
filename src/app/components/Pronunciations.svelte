<script lang="ts">
    import type * as Lect from '../types';
    import { Language } from '../stores';

    export let pronunciations: Lect.EntryPronunciations;
</script>
{#if $Language.ShowPronunciation}
    {#if Object.keys(pronunciations).length > 1 || $Language.UseLects || pronunciations.General === undefined}
        {#each Object.keys(pronunciations) as lect}
            {#if pronunciations[lect].ipa.startsWith("error")}
                <span style="
                    font-family: 'Fira Code', Courier, monospace;
                    text-align: left;
                    size: 12pt;
                ">{pronunciations[lect].ipa}</span>
            {:else}
                <p class="lect">
                    <u>{lect}</u>
                    <span class="pronunciation">
                        {pronunciations[lect].ipa}
                        {#if pronunciations[lect].irregular}
                            <span class='material-icons' 
                                style='font-size:0.75em; margin-right:-1em'>
                            lightbulb</span>
                        {/if}
                    </span>
                </p>
            {/if}
        {/each}
    {:else}
        {#if pronunciations[$Language.Lects[0]].ipa.startsWith("error")}
            <p style="
                font-family: 'Fira Code', Courier, monospace;
                text-align: left;
                font-size: 8pt;
            ">{pronunciations[$Language.Lects[0]].ipa}</p>
        {:else}
            <p class="pronunciation">
                <span class=pronunciation>{pronunciations[$Language.Lects[0]].ipa}</span>
                {#if pronunciations[$Language.Lects[0]].irregular}
                    <span class='material-icons' 
                        style='font-size:0.75em; margin-right:-1em'>
                    lightbulb</span>
                {/if}
            </p>
        {/if}
    {/if}
{/if}
