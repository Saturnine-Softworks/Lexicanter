<script lang="ts">
    import { Language, selectedCategory, referenceLanguage } from '../stores';
    import { createEventDispatcher } from 'svelte';
    import Pronunciations from './Pronunciations.svelte';
    import EntryLabel from './EntryLabel.svelte';
    import { markdownToHtml } from '../utils/markdown';
    import type * as Lexc from '../types';
    const dispatch = createEventDispatcher();
    const edit = () => dispatch('edit')
    export let phrase = '';
    let refLanguage = $referenceLanguage as Lexc.Language;
    $: refLanguage = $referenceLanguage as Lexc.Language;
    export let reference = false;
    export let refCat = '';
    const language = () => reference? refLanguage : $Language;
    const category = () => reference? refCat : $selectedCategory;

</script>
<div class="lex-entry" id={phrase} on:contextmenu={edit}>
    <EntryLabel word={phrase} source={language().Phrasebook[category()][phrase]}/>
    <Pronunciations pronunciations={language().Phrasebook[category()][phrase].pronunciations} />
    {#if !!language().Phrasebook[category()][phrase].tags[0]}
        {#each language().Phrasebook[category()][phrase].tags as tag}
            <div class="tag-item">{tag}</div>
        {/each}
    {/if}
    <p class="prelined">
        {@html markdownToHtml(
            language().Phrasebook[category()][phrase].description
        )}
    </p>
    {#if !!Object.keys(language().Phrasebook[category()][phrase].variants).length}
        <p>⋲ ᴠᴀʀɪᴀɴᴛꜱ ⋺</p>
        {#each Array(Math.ceil(Object.keys(language().Phrasebook[category()][phrase].variants).length / 3)) as _, i}
            <div class="row">
                {#each Object.keys(language().Phrasebook[category()][phrase].variants).slice(i * 3, i * 3 + 3) as variant}
                    <div class="column">
                        <EntryLabel word={variant} source={language().Phrasebook[category()][phrase].variants[variant]}/>
                        <Pronunciations pronunciations={language().Phrasebook[category()][phrase].variants[variant].pronunciations} />
                        <p class="prelined" style='margin: 0 1rem 0.5rem 1rem'>
                            {@html markdownToHtml(
                                language().Phrasebook[category()][phrase].variants[variant].description
                            )}
                        </p>
                    </div>
                {/each}
                <br>
            </div>
        {/each}
    {/if}
</div>
