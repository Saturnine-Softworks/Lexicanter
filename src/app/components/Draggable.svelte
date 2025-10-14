<svelte:options runes/>
<script lang=ts>
    import { onMount, type Snippet } from "svelte";
    import { CurrentLayouts, Language } from "../stores";
    let { 
        panel, 
        auto_maximize = false,
        children,
    } : {
        panel: string,
        auto_maximize?: boolean,
        children: Snippet,
    } = $props()

	let moving = $state(false);
    let mousedown = $state(false);
	
    function move() {
        moving = true; mousedown = true;
    }

    let maximized: boolean = $derived(
        $CurrentLayouts.positions[panel].width >= .98 * window.innerWidth && 
        $CurrentLayouts.positions[panel].height >= .98 * window.innerHeight - 25
    )
	
	function onMouseMove(e: MouseEvent) {
		if (moving) {
			$CurrentLayouts.positions[panel].left += e.movementX;
			$CurrentLayouts.positions[panel].top += e.movementY;

            // y limiter
            $CurrentLayouts.positions[panel].top =
                $CurrentLayouts.positions[panel].top < 25
                ? 25
                : $CurrentLayouts.positions[panel].top
            $CurrentLayouts.positions[panel].top =
                $CurrentLayouts.positions[panel].top > window.innerHeight - $CurrentLayouts.positions[panel].height
                ? window.innerHeight - $CurrentLayouts.positions[panel].height
                : $CurrentLayouts.positions[panel].top

            // x limiter
            $CurrentLayouts.positions[panel].left =
                $CurrentLayouts.positions[panel].left < 0
                ? 0
                : $CurrentLayouts.positions[panel].left
            $CurrentLayouts.positions[panel].left =
                $CurrentLayouts.positions[panel].left > window.innerWidth - $CurrentLayouts.positions[panel].width
                ? window.innerWidth - $CurrentLayouts.positions[panel].width
                : $CurrentLayouts.positions[panel].left
		}
        if (auto_maximize && !maximized) {
            // console.log(auto_maximize, panel)
            maximize()
        };
	}
	
	function onMouseUp() {
        Object.keys($CurrentLayouts.positions).forEach(p => {
            $CurrentLayouts.positions[p].left = snap('left', p);
            $CurrentLayouts.positions[p].top = snap('top', p);
            resizeSnap(p);
        });
        moving = false; mousedown=false;
        if (auto_maximize && !maximized) maximize();
	}

    function snap(axis: 'top'|'left'|'height'|'width', panelOverride: string|false = false) {
        let n = {
            left: $CurrentLayouts.snapping.x,
            width: $CurrentLayouts.snapping.x,
            top: $CurrentLayouts.snapping.y,
            height: $CurrentLayouts.snapping.y,
        }[axis]
        let p = panelOverride? panelOverride : panel;
        
        return Math.round(
            $CurrentLayouts.positions[p][axis] / n
        ) * n + (axis==='top'? 25:0);
    }

    function resizeSnap(panelOverride: string|false = false) {
        mousedown = true;
        let p = panelOverride? panelOverride : panel;

        if ($CurrentLayouts.positions[p].left >= window.innerWidth) $CurrentLayouts.positions[p].left -= $CurrentLayouts.positions[p].left - window.innerWidth + $CurrentLayouts.positions[p].width;
        if ($CurrentLayouts.positions[p].top >= window.innerHeight) $CurrentLayouts.positions[p].top -= $CurrentLayouts.positions[p].top - window.innerHeight + $CurrentLayouts.positions[p].height;

        if ($CurrentLayouts.positions[p].width === 60 && $CurrentLayouts.positions[p].height === 20)
            return;

        $CurrentLayouts.positions[p].width = Math.max(snap('width', panelOverride), 60);
        $CurrentLayouts.positions[p].height = Math.max(snap('height', panelOverride), 20);
        
        $CurrentLayouts.positions[p].width -= Math.max(($CurrentLayouts.positions[p].left + $CurrentLayouts.positions[p].width) - window.innerWidth, 0);
        $CurrentLayouts.positions[p].height -= Math.max(($CurrentLayouts.positions[p].top + $CurrentLayouts.positions[p].height) - window.innerHeight, 0);
    }

    function maximize() {
        $CurrentLayouts.positions[panel].left = 0;
        $CurrentLayouts.positions[panel].top = 25;
        $CurrentLayouts.positions[panel].height = window.innerHeight - 25;
        $CurrentLayouts.positions[panel].width = window.innerWidth;
        resizeSnap();
        mousedown = false;
    }

    /**
     * @param {number} _default the z-index to set if the sanity check returns false (defaults to 100).
     *
     * @description Check to make sure the z-index property exists and is a number above 0. Sets it to _default if not.
     */
    function sanity(_default: number = 100) {
        if (
            [undefined, NaN, null].includes($CurrentLayouts.positions[panel].z)
            || $CurrentLayouts.positions[panel].z < 0
        ) {
            $CurrentLayouts.positions[panel].z = _default;
        }   
    }
    sanity();

    onMount(onMouseUp);

</script>

<style lang=sass>
    .draggable
        position: absolute
        width: 33vh
        resize: both
        border-radius: 5px
        overflow: hidden
    
    .shadow
        background-color: #0008
        position: absolute
        border-radius: 5px

    .dragbar
        user-select: none
        cursor: move
        border: none
        display: flex

    button
        background-color: transparent
        border: none
        padding: 0px
        margin: 0 10px
        color: #fff8
        font-size: 1rem
        &:hover
            color: #fffc
</style>
{#if mousedown}
    <div
        class=shadow
        style="
            left: {snap('left')}px;
            top: {snap('top')}px;
            width: {snap('width')}px;
            height: {snap('height')}px;
        "
    ></div>
{/if}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section 
    style="
        left: {$CurrentLayouts.positions[panel].left}px;
        top: {$CurrentLayouts.positions[panel].top}px;
        height: {$CurrentLayouts.positions[panel].height}px;
        width: {$CurrentLayouts.positions[panel].width}px;
        z-index: {$CurrentLayouts.positions[panel].z};
    " 
    class=draggable
    bind:clientHeight={$CurrentLayouts.positions[panel].height} bind:clientWidth={$CurrentLayouts.positions[panel].width}
    onresize={() => resizeSnap()}
    onfocusin={() => {
        sanity();
        $CurrentLayouts.positions[panel].z += 1000;
    }}
    onfocusout={() => {
        $CurrentLayouts.positions[panel].z -= 1000;
        sanity()
    }}
>
    <div class=dragbar onmousedown={move}>
        <button onclick={()=>{
            $CurrentLayouts.positions[panel].height = 20;
            $CurrentLayouts.positions[panel].width = 60;
        }}>{ "–"
        }</button>
        <button onclick={maximize}> 
            {"+"
        }</button>
        <button onclick={()=>{
            sanity();
            $CurrentLayouts.positions[panel].z += 1;
        }}>
            {"↥"
        }</button>
        {#if $CurrentLayouts.positions[panel].z > 0}
            <button onclick={()=>{
                $CurrentLayouts.positions[panel].z -= 1;
            }}>
                {"↧"
            }</button>
        {/if}
        {#if $Language.Layouts.showZ }
            <p class=info>
                { "z" + $CurrentLayouts.positions[panel].z }
            </p>
        {/if}
        {
            // debug
            // JSON.stringify($CurrentLayouts.positions[panel].z) +
            // JSON.stringify($CurrentLayouts.snapping) +
            ""
        }
    </div>

    {@render children()}
    
</section>

<svelte:window 
    on:resize={onMouseUp}
    on:mouseup={onMouseUp} 
    on:mousemove={onMouseMove}
/>