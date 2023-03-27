<script lang="ts">
    import { Language, selectedCategory } from '../stores';
    import { createEventDispatcher } from 'svelte';
    import Pronunciations from './Pronunciations.svelte';
    import { markdownToHtml } from '../utils/markdown';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let phrase = '';
</script>
<div class="lex-entry" id={phrase} on:contextmenu={edit}>
    <p style="font-style: italic">
        {phrase}
    </p>
    <Pronunciations pronunciations={$Language.Phrasebook[$selectedCategory][phrase].pronunciations} />
    {#if !!$Language.Phrasebook[$selectedCategory][phrase].tags[0]}
        {#each $Language.Phrasebook[$selectedCategory][phrase].tags as tag}
            <div class="tag-item">{tag}</div>
        {/each}
    {/if}
    <p class="prelined">
        {@html markdownToHtml(
            $Language.Phrasebook[$selectedCategory][phrase].description
        )}
    </p>
    {#if !!Object.keys($Language.Phrasebook[$selectedCategory][phrase].variants).length}
        <p>⋲ ᴠᴀʀɪᴀɴᴛꜱ ⋺</p>
        {#each Array(Math.ceil(Object.keys($Language.Phrasebook[$selectedCategory][phrase].variants).length / 3)) as _, i}
            <div class="row">
                {#each Object.keys($Language.Phrasebook[$selectedCategory][phrase].variants).slice(i * 3, i * 3 + 3) as variant}
                    <div class="column">
                        <p style="font-style: italic">
                            {variant}
                        </p>
                        <Pronunciations pronunciations={$Language.Phrasebook[$selectedCategory][phrase].variants[variant].pronunciations} />
                        <p class="prelined" style='margin: 0 1rem 0.5rem 1rem'>
                            {@html markdownToHtml(
                                $Language.Phrasebook[$selectedCategory][phrase].variants[variant].description
                            )}
                        </p>
                    </div>
                {/each}
                <br>
            </div>
        {/each}
    {/if}
</div>
