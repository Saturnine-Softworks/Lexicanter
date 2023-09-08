<script lang="ts">
    import { Language } from '../stores';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let tagSelector = 'existing tags';
    let tag: string = '';
    const add = () => dispatch('select', tag);

</script>
<select bind:value={tagSelector} on:change={() => 
    {
        tag = tagSelector === 'existing tags'? '' : `${tagSelector}`;
        add();
        tagSelector = 'existing tags';
    }}
>
    <option value="existing tags">Choose Tags</option>
    {#each Array.from(
        new Set( Object.keys($Language.Lexicon)
            .map((key) =>
                $Language.Lexicon[key].Senses
                    .map(sense => sense.tags)
            ).flat(Infinity)
        )
    ).sort() as tag}
        <option value={tag}>{tag}</option>
    {/each}
</select>
