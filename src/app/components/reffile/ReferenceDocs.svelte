<script lang='ts'>
    import { referenceLanguage } from '../../stores';
    import { initializeDocs } from '../../utils/docs';
    import type { Language } from '../../types';
    let Language = $referenceLanguage as Language;
    $: Language = $referenceLanguage as Language;
    initializeDocs(Language.Docs, 'ref-docs');
</script>
<div id="ref-docs" 
    class="row text-center" 
    style="
        height: 92vh; 
        overflow-y: auto; 
        font-family: Gentium
    "
></div>
