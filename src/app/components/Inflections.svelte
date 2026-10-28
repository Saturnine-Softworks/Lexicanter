<svelte:options runes/>
<script lang='ts'>
    import { Language, hideDropdowns } from "../stores";
    import { blur } from 'svelte/transition';
    import * as sca from "../utils/sca";
    import { tadpole } from "../utils/interop";
    import { untrack } from "svelte";

    let { 
        word, 
        tags, 
    } : {
        word: string,
        tags: string[],
    } = $props();

    let show = $state(false);

    function invertShow() { show = !show }

    function htmlToText(html: string): string {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent ?? '';
    }

    const data = $derived.by(async () => {
        const filtered = structuredClone(untrack(() => $Language.Inflections) // untracked because we want this to update only when the cache is cleared
            .filter(inflection => {
                let filter: RegExp;
                try {
                    filter = new RegExp(inflection.filter);
                } catch (e) {
                    filter = /.+/;
                }
                return (inflection.tags[0]? inflection.tags.some(tag => tags.includes(tag)) : true) && word.match(filter)
            }
        ));

        let data = filtered.map(inflection => inflection.tables.blocks);
        const categories = filtered.map(inflection => inflection.categories + '\n').join()

        data.forEach((blocks, i) => {

            blocks.forEach((block, j) => {
                if (block.type !== 'table') return;
                const index_key = `${i}.${j}:${word}`
                if ($Language.TransformCache.__Inflections?.[index_key]) {
                    // cache stores the entire stringified table
                    data[i][j] = JSON.parse($Language.TransformCache.__Inflections[index_key]);
                    return;
                }
                block.data.content.forEach((row: string[], y: number) => {
                    row.forEach(async (cell: string, x: number) => {
                        if ($Language.SoundChangeEngine === 'legacy') {
                            const rules = sca.parseRules($Language.EngineHead + '\n' + htmlToText(cell)).rules;
                            const cats = sca.parseRules(categories).categories;
                            if (!rules[0]) return
                            data[i][j].data.content[y][x] = sca.applyRules(rules, word, cats);
                        } 
                            else 
                                    {
                            const spec = $Language.EngineHead + '\n' + categories + '\n' + cell;
                            // console.debug(spec);
                            let res = await tadpole($Language.SoundChangeEngine, word, spec);
                            // console.debug(res);
                            if (res.startsWith('error')) return;
                            data[i][j].data.content[y][x] = res;
                        }
                    });
                });
            });
        });
        return data;
    });

    if (!$Language.TransformCache.__Inflections) $Language.TransformCache.__Inflections = {};

    $effect(() => { //
        data; $Language.TransformCache.__Inflections;
        (async () => {
            (await data).forEach((blocks, i) => {
                blocks.forEach((block, j) => {
                    if (block.type !== 'table') return;
                    const index_key = `${i}.${j}:${ untrack(() => word) /* `word` derives `data`, `data` causes this effect */ }`
                    if (!$Language.TransformCache.__Inflections[index_key]) {
                        // untrack to prevent infinite loop; directly referencing here would make $Language.TransformCache a dependency
                        untrack(() => $Language.TransformCache.__Inflections[index_key] = JSON.stringify(block)); 
                        // console.debug(index_key, block)
                    }
                })
            })
        })()
    })
</script>
<svelte:boundary>
    {#await data}
        loading…
    {:then d} 
        {#if d[0]} <!-- "cannot find name 'd'" seems to be an intellisense error. this is the correct await/then syntax and it works fine when compiled -->
            <button class='inflection hover-highlight' onclick={invertShow}>Inflections {show? '⏶' : '⏷'}</button>
            {#if show && !$hideDropdowns}
                <!-- {word} {JSON.stringify(love)} -->
                <div class='inflection' transition:blur='{{amount: 10, duration: 333}}'>
                    {#each d.flat() as block}
                        {#if block.type === 'header'}
                            <svelte:element this={`h${block.data.level}`}>
                                {@html block.data.text}
                            </svelte:element>
                        {/if}
                        {#if block.type === 'table'}
                            <table style='margin: auto'>
                                <tbody>
                                    {#each block.data.content as row}
                                    <tr>
                                        {#each row as cell}
                                        <td>{@html cell}</td>
                                        {/each}
                                    </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}
                        {#if block.type === 'paragraph'}
                            <p>{@html block.data.text}</p>
                        {/if}
                    {/each}
                </div>
            {/if}
        {/if}

        {#snippet failed(error, _reset)}
            {console.dir(error)}
            <p>An error occurred while creating the inflections tables.</p>
        {/snippet}

    {/await}
    

</svelte:boundary>
