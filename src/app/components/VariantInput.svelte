<script lang='ts'>
    import { createEventDispatcher } from 'svelte';
    import { Language } from '../stores';
    import { get_pronunciation } from '../utils/phonetics';

    export let phrase = '';
    export let description = '';
    export let lects: string[];
    export let pronunciations = {};
    $: {
        lects.forEach(lect => {
            pronunciations[lect] = get_pronunciation(phrase, lect);
        })
    }

    const dispatch = createEventDispatcher();
    const update = () => dispatch('update');
</script>

<div class="variant-div">
    <input type="text" on:keyup={update} bind:value={phrase}/>
    {#if $Language.UseLects}
        {#each lects as lect}
            <div class="row">
                <div class="column text-right lect">{lect}</div>
                <div class="column text-left">
                    <input type="text" class="pronunciation text-left" bind:value={pronunciations[lect]}>
                </div>
            </div>
        {/each}
    {:else}
        <input type="text" class="pronunciation" bind:value={pronunciations['General']}>
    {/if}
    <textarea bind:value={description}></textarea>
    <br>
</div>
