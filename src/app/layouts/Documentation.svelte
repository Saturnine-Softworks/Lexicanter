<svelte:options runes/>
<script lang=ts>
    import { initializeDocs } from '../utils/docs';
    import Draggable from '../components/Draggable.svelte';
    import { CurrentLayouts, Language, selectedTab } from '../stores';
    initializeDocs(false);

    // let show = $derived($selectedTab.includes(6));
    // $effect(()=>{
    //     console.log(show);
    //     $CurrentLayouts.positions['documentation'].height = 900;
    //     $CurrentLayouts.positions['documentation'].width = 1400;

    // })
</script>
<div class=tab-pane spellcheck={false}>
    <div hidden={!$selectedTab.includes(6)}>
        <Draggable panel=documentation auto_maximize={$selectedTab.includes(6) && $Language.Layouts.tabmode === 'switch'}> 
            <div class="container glasspane scrolled">
                <div class=column style="font-family: Gentium" id=docs-tab></div>
            </div>
        </Draggable>
    </div>
</div>
