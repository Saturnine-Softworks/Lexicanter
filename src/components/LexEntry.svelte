<script>
    import { lexicon } from '../stores.js';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let entry = '';
</script>
<div id='{entry}' class="lex-entry prelined" on:contextmenu={edit}>
    <p  style="font-style: italic">{entry}</p>
    <p class='pronunciation'>{$lexicon[entry][0]}</p>
    {#each $lexicon[entry][3] as tag}
        <div class='tag-item'>{tag}</div>
    {/each}
    <p>{$lexicon[entry][1]}</p>
</div>
