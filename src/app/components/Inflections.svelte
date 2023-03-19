<script lang='ts'>
    import { Language } from "../stores";
    import { blur } from 'svelte/transition';
    import * as sca from "../utils/sca";
    export let word: string;
    export let tags: string[];
    let show = false;

    function htmlToText(html: string) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent;
    }

    let data = structuredClone($Language.Inflections)
        .filter(inflection => (inflection.tags[0]? inflection.tags.some(tag => tags.includes(tag)) : true) && word.match(new RegExp(inflection.filter)))
        .map(inflection => inflection.tables.blocks);

    data.forEach((blocks, i) => {
        blocks.forEach((block, j) => {
            if (block.type !== 'table') return;
            block.data.content.forEach((row: string[], y: number) => {
                row.forEach((cell: string, x: number) => {
                    const settings = sca.parseRules(htmlToText(cell));
                    /* console.log(
                        'settings.rules:', settings.rules,
                        '\nword:', word,
                        '\nsca.applyRules(...):', sca.applyRules(settings.rules, word, settings.categories)
                    ); */
                    if (!settings.rules[0]) return
                    data[i][j].data.content[y][x] = sca.applyRules(settings.rules, word, settings.categories);
                });
            });
        });
    });
</script>

{#if data[0]}
    <button class='inflection hover-highlight' on:click={() => show = !show}>Inflections {show? '⏶' : '⏷'}</button>
    {#if show}
        <div class='inflection' transition:blur='{{amount: 10, duration: 333}}'>
            {#each data.flat() as block}
                {#if block.type === 'header'}
                    <svelte:element this={`h${block.data.level}`}>{@html block.data.text}</svelte:element>
                {/if}
                {#if block.type === 'table'}
                    <table style='margin: auto'>
                        {#each block.data.content as row}
                            <tr>
                                {#each row as cell}
                                    <td>{@html cell}</td>
                                {/each}
                            </tr>
                        {/each}
                    </table>
                {/if}
                {#if block.type === 'paragraph'}
                    <p>{@html block.data.text}</p>
                {/if}
            {/each}
        </div>
    {/if}
{/if}
