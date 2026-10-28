<script lang="ts">
    import AlphabetSettings from '../components/Lexicon/AlphabetSettings.svelte';
    import WordEntry from '../components/Lexicon/WordEntry.svelte';
    import LexiconView from '../components/Lexicon/LexiconView.svelte';
    const { ipcRenderer } = require('electron');
    import { Language, selectedTab } from '../stores';

    // ipcRenderer.on('update-lexicon-for-gods-sake-please', () => {
    //     $Language.Lexicon = {...$Language.Lexicon};
    // });

    ipcRenderer.on('lexicon link', (_:any, word: string) => {
        console.log('link:', word);
        document.getElementById('lexicon-container')!.scrollTop = document.getElementById(word)!.offsetTop
    });

</script>
<!-- Lexicon Tab -->

<div class='tab-pane' style=overflow:hidden>

        {#if $selectedTab.includes(0)}
            <LexiconView/>
            <WordEntry/>
            {#if $Language.ShowAlphabet}
                <AlphabetSettings/>
            {/if}
        {/if}


</div>
