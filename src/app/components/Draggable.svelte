<script>
    import { panelAdjustments } from "../stores";
    export let panel

	let moving = false;
	
	function onMouseDown() {
		moving = true;
	}
	
	function onMouseMove(e) {
		if (moving) {
			$panelAdjustments[panel].left += e.movementX;
			$panelAdjustments[panel].top += e.movementY;
            $panelAdjustments[panel].top =
                $panelAdjustments[panel].top < 0
                ? 0
                : $panelAdjustments[panel].top
            $panelAdjustments[panel].top =
                $panelAdjustments[panel].top > window.outerHeight - $panelAdjustments[panel].height
                ? window.outerHeight - $panelAdjustments[panel].height
                : $panelAdjustments[panel].top
            $panelAdjustments[panel].left =
                $panelAdjustments[panel].left < 0
                ? 0
                : $panelAdjustments[panel].left
            $panelAdjustments[panel].left =
                $panelAdjustments[panel].left > window.outerWidth - $panelAdjustments[panel].width
                ? window.outerWidth - $panelAdjustments[panel].width
                : $panelAdjustments[panel].left
		}
	}
	
	function onMouseUp() {
		moving = false;
	}

</script>

<style lang=sass>
    .draggable
        position: absolute
        width: 33vh
        resize: both
        border-radius: 5px
        overflow: hidden

    .dragbar
        user-select: none
        cursor: move
        border: none

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
>
    <div 
        class=dragbar 
        on:mousedown={onMouseDown}
    ><button on:click={()=>{
        $panelAdjustments[panel].height = 
            $panelAdjustments[panel].height === 20
            ? "auto"
            : 20;
        $panelAdjustments[panel].width = 
            $panelAdjustments[panel].width === 60
            ? "auto"
            : 60;
    }}>{
        $panelAdjustments[panel].height === 20 && $panelAdjustments[panel].width === 60
        ? "𝌳" // tetragram of enlargement
        : "𝌼" // tetragram of diminishment
    }</button></div>
    <slot></slot>
</section>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />