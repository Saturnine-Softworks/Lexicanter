<script>
    import { phrasebook, selected_category } from '../stores.js';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let phrase = '';
</script>
<div class="lex-entry" id={phrase} on:contextmenu={edit}>
    <p style="font-style: italic">
        {phrase}
    </p>
    <p class="pronunciation">
        {$phrasebook[$selected_category][phrase].pronunciation}
    </p>
    <p class="prelined">
        {$phrasebook[$selected_category][phrase].description}
    </p>
    {#if !!Object.keys($phrasebook[$selected_category][phrase].variants).length}
        <p>⋲ ᴠᴀʀɪᴀɴᴛꜱ ⋺</p>
        {#each Array(Math.ceil(Object.keys($phrasebook[$selected_category][phrase].variants).length / 3)) as _, i}
            <div class="row">
                {#each Object.keys($phrasebook[$selected_category][phrase].variants).slice(i * 3, i * 3 + 3) as variant}
                    <div class="column">
                        <p style="font-style: italic">
                            {variant}
                        </p>
                        <p class="pronunciation">
                            {$phrasebook[$selected_category][phrase].variants[variant].pronunciation}
                        </p>
                        <p class="prelined">
                            {$phrasebook[$selected_category][phrase].variants[variant].description}
                        </p>
                    </div>
                {/each}
            </div>
        {/each}
    {/if}
</div>
