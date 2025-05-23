<svelte:options runes/>
<script lang=ts>
    import { initializeDocs } from '../utils/docs';
    import Draggable from '../components/Draggable.svelte';
    import { selectedTab } from '../stores';
    initializeDocs(false);
</script>
<div class=tab-pane spellcheck={false}>
    <!-- {#if $selectedTab===6}
        <Draggable panel=documentation> -->
            <div class="container row scrolled" style=height:95%>
                <div class=column style="font-family: Gentium" id=docs-tab></div>
            </div>
        <!-- </Draggable>
    {/if} -->
</div>
