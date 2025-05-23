<svelte:options runes/>
<script lang=ts>
    import { Language, selectedCategory } from '../stores';
    import Pronunciations from './Pronunciations.svelte';
    import EntryLabel from './EntryLabel.svelte';
    import { markdownToHtml } from '../utils/markdown';

    let { 
        edit = () => {},
        phrase,
    } : { 
        edit?: Function,
        phrase: string,
    } = $props();

    const language = () => $Language;
    const category = () => $selectedCategory;

</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="lex-entry" id={phrase} oncontextmenu={()=>edit()}>
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
