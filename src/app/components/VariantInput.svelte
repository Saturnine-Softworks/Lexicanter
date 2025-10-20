<svelte:options runes/>
<script lang='ts'>
    import { Language } from '../stores';
    import { get_pronunciation } from '../utils/phonetics';
    import type * as Lexc from '../types';
    let {
        phrase = $bindable(''), 
        description = $bindable(''), 
        lects = $bindable([]),
        pronunciations = $bindable({}),
        update = ()=>{}
    } : {
        phrase?: string,
        description?: string,
        lects?: string[],
        pronunciations?: Lexc.EntryPronunciations,
        update?: Function,
    } = $props()

    $effect(() => {
        lects.forEach(async lect => {
            pronunciations[lect].ipa = await get_pronunciation(phrase, lect);
        })
    });
</script>

<div class=variant-div>
    <input type=text onkeyup={() => update()} bind:value={phrase}/>
    {#if $Language.UseLects}
        {#each lects as lect}
            <div class=row>
                <div class="column text-right lect">{lect}</div>
                <div class="column text-left">
                    <input type=text class="pronunciation text-left" bind:value={pronunciations[lect].ipa}>
                </div>
            </div>
        {/each}
    {:else}
        <input type=text class=pronunciation bind:value={pronunciations['General'].ipa}>
    {/if}
    <textarea bind:value={description}></textarea>
    <br>
</div>
