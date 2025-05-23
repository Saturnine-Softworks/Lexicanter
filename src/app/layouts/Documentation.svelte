<svelte:options runes/>
<script lang=ts>
    import { initializeDocs } from '../utils/docs';
    import Draggable from '../components/Draggable.svelte';
    import { selectedTab } from '../stores';
    initializeDocs(false);
</script>
<div class=tab-pane spellcheck={false}>
    <div hidden={!$selectedTab.includes(6)}>
        <Draggable panel=documentation auto_maximize> 
            <div class="container glasspane scrolled">
                <div class=column style="font-family: Gentium" id=docs-tab></div>
            </div>
        </Draggable>
    </div>
</div>
