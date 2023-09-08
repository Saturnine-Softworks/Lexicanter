<svelte:options immutable/>
<script lang='ts'>
    import { createEventDispatcher } from "svelte";
    import { draw, blur } from 'svelte/transition';
    const dispatch = createEventDispatcher();
    const select = (entry: string) => {
        dispatch('select', entry);
    }

    interface Node {
        name: string;
        children: { name: string, source: string }[];
        parents: { name: string, source: string }[];
    }
    export let width: number; export let height: number;
    export let tree: Node;

    function parabolicCurve(arr: any[]): number[] {
        const n = arr.length; if (n === 0) return [];
        const result: number[] = [];
        for (let i = 0; i < n; i++) {
            const x = (i + 0.5) / n;
            const f_x = 1 - 4 * Math.pow(x - 0.5, 2);
            result.push(Math.round(f_x * Math.pow(n, 2)));
        }
        return result;
    }
    let dYparents: number[];
    let dYchildren: number[];
    $: {
        tree;
        dYparents = parabolicCurve(tree.parents);
        dYchildren = parabolicCurve(tree.children);
    }
</script>
<svg {width} {height}>
    <g>
        {#each tree.parents as parent, i}
            <g on:mousedown={() => {
                select(parent.name)
            }}>
                <rect class="lex"
                    x={(width / (tree.parents.length + 1)) * (i + 1) - 60}
                    y={(height)/9 - dYparents[i] - 15 + Math.max(...dYparents)}
                    width="120"
                />
                <text class="lex-entry" transition:blur="{{amount: 10, duration: 999}}"
                    x={(width / (tree.parents.length + 1)) * (i + 1)}
                    y={(height)/9 - dYparents[i] + Math.max(...dYparents)}
                    text-anchor="middle"
                    dominant-baseline="middle"
                > { parent.name } </text>
                <text class="tag-item" transition:blur="{{amount: 10, duration: 999}}"
                    x={(width / (tree.parents.length + 1)) * (i + 1)}
                    y={(height)/9 - dYparents[i] + 15 + Math.max(...dYparents)}
                    text-anchor="middle"
                    dominant-baseline="middle"
                > { parent.source } </text>
                <path transition:draw="{{duration: 999}}"
                    d = {
                        `M ${(width / (tree.parents.length + 1)) * (i + 1)}, ${(height)/9 - dYparents[i] + 20 + Math.max(...dYparents)} `
                        + `C ${(width / (tree.parents.length + 1)) * (i + 1)}, ${(height)/9 - dYparents[i] + 50 + Math.max(...dYparents)} `
                        + ` ${width/2}, ${height/2 - 40} `
                        + ` ${width/2}, ${height/2 - 10}`
                    }
                    fill="none"
                />
            </g>
        {/each}
        <g>
            <text class="lex-entry"
                x={width/2}
                y={height/2}
                text-anchor="middle"
                dominant-baseline="middle"
            > { tree.name } </text>
        </g>
        {#each tree.children as child, i}
            <g on:mousedown={() => {
                select(child.name)
            }}>
                <rect class="lex"
                    x={(width / (tree.children.length + 1)) * (i + 1) - 60}
                    y={(height + dYchildren[i]) - height/9 - 15 - Math.max(...dYchildren)}
                    width="120"
                />
                <text class="lex-entry" transition:blur="{{amount: 10, duration: 999}}"
                    x={(width / (tree.children.length + 1)) * (i + 1)}
                    y={(height + dYchildren[i]) - height/9 - Math.max(...dYchildren)}
                    text-anchor="middle"
                    dominant-baseline="middle"
                > { child.name } </text>
                <text class="tag-item" transition:blur="{{amount: 10, duration: 999}}"
                    x={(width / (tree.children.length + 1)) * (i + 1)}
                    y={(height + dYchildren[i]) - height/9 + 15 - Math.max(...dYchildren)}
                    text-anchor="middle"
                    dominant-baseline="middle"
                > { child.source } </text>
                <path transition:draw="{{duration: 999}}"
                    d = {
                        `M ${width/2}, ${height/2 + 10} `
                        + `C ${width/2}, ${height/2 + 40} `
                        + ` ${(width / (tree.children.length + 1)) * (i + 1)}, ${(height + dYchildren[i]) - height/9 - 40 - Math.max(...dYchildren)} `
                        + ` ${(width / (tree.children.length + 1)) * (i + 1)}, ${(height + dYchildren[i]) - height/9 - 10 - Math.max(...dYchildren)}`
                    }
                    fill="none"
                />
            </g>
        {/each}
    </g>
</svg>
