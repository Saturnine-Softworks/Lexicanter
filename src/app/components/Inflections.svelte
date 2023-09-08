<script lang='ts'>
    import { Language, hideDropdowns, referenceLanguage } from "../stores";
    import * as diagnostics from "../utils/diagnostics";
    import { blur } from 'svelte/transition';
    import * as sca from "../utils/sca";
    import type { OutputBlockData } from "@editorjs/editorjs";
    export let word: string;
    export let tags: string[];
    export let readFromReference: boolean = false;
    let show = false;

    function htmlToText(html: string) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent;
    }

    let data: OutputBlockData[][];

    $: {
        word; tags; $Language.Inflections; $Language.Lexicon;
        let categories = '';
        data = structuredClone((readFromReference && typeof $referenceLanguage === 'object')? $referenceLanguage.Inflections : $Language.Inflections)
            .filter(inflection => {
                let filter: RegExp;
                try {
                    filter = new RegExp(inflection.filter);
                } catch (e) {
                    diagnostics.debug.error(`Invalid regular expression: /${inflection.filter}/`);
                    filter = /.+/;
                }
                return (inflection.tags[0]? inflection.tags.some(tag => tags.includes(tag)) : true) && word.match(filter)
            })
            .map(inflection => {
                categories += inflection.categories + '\n';
                return inflection.tables.blocks
            });

        data.forEach((blocks, i) => {
            blocks.forEach((block, j) => {
                if (block.type !== 'table') return;
                block.data.content.forEach((row: string[], y: number) => {
                    row.forEach((cell: string, x: number) => {
                        const rules = sca.parseRules(htmlToText(cell)).rules;
                        const cats = sca.parseRules(categories).categories;
                        if (!rules[0]) return
                        data[i][j].data.content[y][x] = sca.applyRules(rules, word, cats);
                    });
                });
            });
        });
    }
</script>

{#if data[0]}
    <button class='inflection hover-highlight' on:click={() => show = !show}>Inflections {show? '⏶' : '⏷'}</button>
    {#if show && !$hideDropdowns}
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
