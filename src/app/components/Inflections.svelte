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

    function get_data(inflections: typeof $Language.Inflections, text: string) {
        const filtered = structuredClone(inflections.filter(inflection => {
            let filter: RegExp;
            try {
                filter = new RegExp(inflection.filter);
            } catch (e) {
                filter = /.+/;
            }
            return (inflection.tags[0]? inflection.tags.some(tag => tags.includes(tag)) : true) && text.match(filter)
        }));

        let data = filtered.map(inflection => inflection.tables.blocks);
        const categories = filtered.map(inflection => inflection.categories + '\n').join()

        data.forEach((blocks, i) => {

            blocks.forEach((block, j) => {
                if (block.type !== 'table') return;

                block.data.content.forEach((row: string[], y: number) => {

                    row.forEach(async (cell: string, x: number) => {
                        const index_key = `${i}.${j}.${y}.${x}:${text}`
                        if ($Language.TransformCache.__Inflections?.[index_key]) {
                            data[i][j].data.content[y][x] = $Language.TransformCache.__Inflections[index_key];
                            return;
                        }

                        if ($Language.SoundChangeEngine === 'legacy') {
                            const rules = sca.parseRules($Language.EngineHead + '\n' + htmlToText(cell)).rules;
                            const cats = sca.parseRules(categories).categories;
                            if (!rules[0]) return
                            data[i][j].data.content[y][x] = sca.applyRules(rules, word, cats);
                        } 
                            else 
                                    {
                            let res = await tadpole($Language.SoundChangeEngine, word, $Language.EngineHead + '\n' + categories + '\n' + cell);
                            if (res.startsWith('error')) return;
                            data[i][j].data.content[y][x] = res;
                        }
                    });
                });
            });
        });
        return data;
    }

    const data = $derived(get_data($Language.Inflections, word))

    if ($Language.TransformCache.__Inflections) $Language.TransformCache.__Inflections = {};
    $effect(() => { // cannot modify $Language.TransformCache within get_data() function because side effects are not allowed outside of $effect()
        data.forEach((blocks, i) => {
            blocks.forEach((block, j) => {
                if (block.type !== 'table') return;
                block.data.content.forEach((row: string[], y: number) => {
                    row.forEach((cell: string, x: number) => {
                        const index_key = `${i}.${j}.${y}.${x}:${ untrack(() => word) /* `word` derives `data`, `data` causes this effect */ }`
                        // untrack to prevent infinite loop; directly setting here would make $Language.TransformCache a dependency
                        untrack(() => $Language.TransformCache.__Inflections[index_key] = cell); 
                    }) 
                })
            })
        })
    })

</script>
<svelte:boundary>

    {#if data[0]}
        <button class='inflection hover-highlight' onclick={invertShow}>Inflections {show? '⏶' : '⏷'}</button>
        {#if show && !$hideDropdowns}
            <!-- {word} {JSON.stringify(data)} -->
            <div class='inflection' transition:blur='{{amount: 10, duration: 333}}'>
                {#each data.flat() as block}
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

</svelte:boundary>
