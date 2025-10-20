<svelte:options runes/>
<script lang="ts">
    import { Language, pronunciations, wordInput } from '../stores';
    import { get_pronunciation } from '../utils/phonetics';
    import TagSelector from './TagSelector.svelte';
    let {
        definition = $bindable(''),
        tags = $bindable(),
        index,
        lects = $bindable(),
        remove = ()=>{},
        commit = ()=>{},
    } : {
        definition?: string,
        tags: string,
        index: number|'hide',
        lects: string[]
        remove?: Function,
        commit?: Function,
    } = $props();

    function refilter_lects() {
        if (lects.filter(name => !$Language.Lects.includes(name)).length > 0) {
            lects.filter(name => !$Language.Lects.includes(name)).forEach(name => {
                lects = lects.filter((l) => l !== name);
            });
        }
    }

    $effect(()=>{$Language.Lects; refilter_lects()});

    async function change(lect: string) {
        if (lects.includes(lect)) {
            lects = lects.filter((l) => l !== lect);
        } else {
            lects = [...lects, lect];
            $pronunciations[lect] = await get_pronunciation($wordInput, lect);
        }
    }
</script>

<label>
    {#if index !== 'hide'}
        <i>Sense {index + 1}</i> <br>
    {/if}
    <label>Definition
        <textarea rows='4' bind:value={definition} onkeydown={e => {
            if (e.key === 'Enter' && e.altKey) commit();
        }}></textarea>
    </label>
    <br>
    <label>Tags
        <div>
            <textarea 
                rows="1"
                bind:value={tags}
            ></textarea>  
            <TagSelector on:select = {
                e => tags += e.detail
                    ? tags
                        ? ' ' + e.detail
                        : e.detail
                    : '' 
            }/>
        </div>
    </label>
    <br>
    {#if $Language.UseLects}
        <label>Lects<br>
            {#each $Language.Lects as lect}
                <label>
                    <div style="display: inline-block">
                        <input id={lect} type="checkbox" onchange={
                            () => change(lect)
                        } checked={lects.includes(lect)}/>
                    </div>
                    <span style="display: inline-block">{lect}</span>
                </label><br>
            {/each}
        </label>
        <br>
    {/if}
    {#if !!index && index !== 'hide'}
        <button class="hover-highlight hover-shadow" onclick={() => remove()}>Remove Sense {index+1}</button>
    {/if}
    <br>
</label>
