<svelte:options runes/>
<script lang=ts>
    import { onMount, type Snippet } from "svelte";
    import { panelAdjustments, panelSnap } from "../stores";
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
			$panelAdjustments[panel].left += e.movementX;
			$panelAdjustments[panel].top += e.movementY;

            // y limiter
            $panelAdjustments[panel].top =
                $panelAdjustments[panel].top < 25
                ? 25
                : $panelAdjustments[panel].top
            $panelAdjustments[panel].top =
                $panelAdjustments[panel].top > window.innerHeight - $panelAdjustments[panel].height
                ? window.innerHeight - $panelAdjustments[panel].height
                : $panelAdjustments[panel].top

            // x limiter
            $panelAdjustments[panel].left =
                $panelAdjustments[panel].left < 0
                ? 0
                : $panelAdjustments[panel].left
            $panelAdjustments[panel].left =
                $panelAdjustments[panel].left > window.innerWidth - $panelAdjustments[panel].width
                ? window.innerWidth - $panelAdjustments[panel].width
                : $panelAdjustments[panel].left
		}
	}
	
	function onMouseUp() {
		moving = false; mousedown=false;
        Object.keys($panelAdjustments).forEach(p => {
            $panelAdjustments[p].left = snap('left', p);
            $panelAdjustments[p].top = snap('top', p);
            resizeSnap(p);
        });
	}

    function snap(axis: 'top'|'left'|'height'|'width', panelOverride: string|false = false) {
        let n = {
            left: $panelSnap.x,
            width: $panelSnap.x,
            top: $panelSnap.y,
            height: $panelSnap.y,
        }[axis]
        let p = panelOverride? panelOverride : panel;
        if ($panelAdjustments[p].left >= window.innerWidth) $panelAdjustments[p].left -= $panelAdjustments[p].left - window.innerWidth + $panelAdjustments[p].width
        if ($panelAdjustments[p].top >= window.innerHeight) $panelAdjustments[p].top -= $panelAdjustments[p].top - window.innerHeight + $panelAdjustments[p].height
        return Math.round(
            $panelAdjustments[p][axis] / n
        ) * n + (axis==='top'? 25:0);
    }

    function resizeSnap(panelOverride: string|false = false) {
        mousedown = true;
        let p = panelOverride? panelOverride : panel;

        if ($panelAdjustments[p].width === 60 && $panelAdjustments[p].height === 20)
            return;

        $panelAdjustments[p].width = Math.max(snap('width', panelOverride), 60);
        $panelAdjustments[p].height = Math.max(snap('height', panelOverride), 20);
        
        $panelAdjustments[p].width -= Math.max(($panelAdjustments[p].left + $panelAdjustments[p].width) - window.innerWidth, 0)
        $panelAdjustments[p].height -= Math.max(($panelAdjustments[p].top + $panelAdjustments[p].height) - window.innerHeight, 0)
    }

    function maximize() {
        $panelAdjustments[panel].left = 0;
        $panelAdjustments[panel].top = 25;
        $panelAdjustments[panel].height = window.innerHeight - 25;
        $panelAdjustments[panel].width = window.innerWidth;
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
        left: {$panelAdjustments[panel].left}px;
        top: {$panelAdjustments[panel].top}px;
        height: {$panelAdjustments[panel].height}px;
        width: {$panelAdjustments[panel].width}px;
    " 
    class=draggable
    bind:clientHeight={$panelAdjustments[panel].height} bind:clientWidth={$panelAdjustments[panel].width}
    onresize={() => resizeSnap()}
>
    <div class=dragbar onmousedown={move}>
        <button onclick={()=>{
            $panelAdjustments[panel].height = 20;
            $panelAdjustments[panel].width = 60;
        }}>{ "𝌼" // tetragram of diminishment
        }</button>
        <button onclick={maximize}> 
            {"𝌳" // tetragram of enlargement
        }</button>
        {
            // debug
            // JSON.stringify($panelAdjustments[panel])
            // JSON.stringify($panelSnap)
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