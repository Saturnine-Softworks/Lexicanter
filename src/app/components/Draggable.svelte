<svelte:options runes/>
<script lang=ts>
    import { onMount, type Snippet } from "svelte";
    import { CurrentLayouts, Language } from "../stores";
    let { 
        panel, 
        children,
    } : {
        panel: string,
        children: Snippet,
    } = $props()

	let moving = $state(false);
    let mousedown = $state(false);
	
    function move() {
        moving = true; mousedown = true;
    }
	
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
	}
	
	function onMouseUp() {
		moving = false; mousedown=false;
        Object.keys($CurrentLayouts.positions).forEach(p => {
            $CurrentLayouts.positions[p].left = snap('left', p);
            $CurrentLayouts.positions[p].top = snap('top', p);
            resizeSnap(p);
        });
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
        onMouseUp();
    }

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
    " 
    class=draggable
    bind:clientHeight={$CurrentLayouts.positions[panel].height} bind:clientWidth={$CurrentLayouts.positions[panel].width}
    onresize={() => resizeSnap()}
>
    <div class=dragbar onmousedown={move}>
        <button onclick={()=>{
            $CurrentLayouts.positions[panel].height = 20;
            $CurrentLayouts.positions[panel].width = 60;
        }}>{ "𝌼" // tetragram of diminishment
        }</button>
        <button onclick={maximize}> 
            {"𝌳" // tetragram of enlargement
        }</button>
        {
            // debug
            // JSON.stringify($CurrentLayouts.positions[panel])
            // JSON.stringify($CurrentLayouts.snapping)
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