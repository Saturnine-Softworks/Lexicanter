<script lang="ts">
    import { Language, pronunciations, wordInput } from '../stores';
    import { get_pronunciation } from '../utils/phonetics';
    import { debug } from '../utils/diagnostics';
    import { createEventDispatcher } from 'svelte';
    import TagSelector from './TagSelector.svelte';
    export let definition = '';
    export let tags: string;
    export let index: number | 'hide';
    const dispatch = createEventDispatcher();
    const remove = () => dispatch('remove');
    const commit = () => dispatch('commit');
    let tagSelector = 'existing tags';

    $: tags;
    export let lects: string[];
    $: {
        // debug.logObj(lects, `(SenseInput ${index}) lects`);

        // When the $Language.Lects array changes, remove lects that no longer exist. 
        // New lects that are added are handled be the #each loop in the component.
        if (lects.filter(name => !$Language.Lects.includes(name)).length > 0) {
            lects.filter(name => !$Language.Lects.includes(name)).forEach(name => {
                // debug.log(`(SenseInput ${index}) Removing ${name} from lects`);
                lects = lects.filter((l) => l !== name);
            });
        }
    }
    function change (lect: string) {
        if (lects.includes(lect)) {
            lects = lects.filter((l) => l !== lect);
        } else {
            lects = [...lects, lect];
            $pronunciations[lect] = get_pronunciation($wordInput, lect);
        }
    }
</script>

<label>
    {#if index !== 'hide'}
        <i>Sense {index + 1}</i> <br>
    {/if}
    <label>Definition
        <textarea rows='4' bind:value={definition} on:keydown={e => {
            if (e.key === 'Enter' && e.altKey) commit();
        }}></textarea>
    </label>
    <br>
    <label>Tags
        <div>
            <textarea 
                rows="1"
                bind:value={tags}
            />  
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
                        <input id={lect} type="checkbox" on:change={
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
        <button class="hover-highlight hover-shadow" on:click={remove}>Remove Sense {index+1}</button>
    {/if}
    <br>
</label>
