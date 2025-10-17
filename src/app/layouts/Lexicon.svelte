<script lang="ts">
    import AlphabetSettings from '../components/Lexicon/AlphabetSettings.svelte';
    import WordEntry from '../components/Lexicon/WordEntry.svelte';
    import LexiconView from '../components/Lexicon/LexiconView.svelte';
    const { ipcRenderer } = require('electron');
    import { Language, wordInput, pronunciations, selectedTab, hideDropdowns } from '../stores';
    import type * as Lexc from '../types';
    import { alphabetize, alphabetPrecheck } from '../utils/alphabetize';
    import { get_pronunciation } from '../utils/phonetics';

    // ipcRenderer.on('update-lexicon-for-gods-sake-please', () => {
    //     $Language.Lexicon = {...$Language.Lexicon};
    // });

    let searchWords = ''; let searchDefinitions = ''; let searchTags = ''; let lectFilter = '';
    $: searchWords, searchDefinitions, searchTags, lectFilter; // Update the search when these values change
    let keys: (string | null)[] = [];

    let filtered_lex: Lexc.Lexicon;
    $: filtered_lex = keys.reduce((acc, key) => {
        if (key !== null && key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
        return acc;
    }, {} as Lexc.Lexicon);

    let alphabetized: string[];
    $: { // Update the alphabetized lexicon when conditions change
        $Language; 
        $Language.Lexicon; $Language.Pronunciations;
        $Language.ShowEtymology; $Language.Etymologies; 
        $Language.ShowInflection; $Language.Inflections; 
        $Language.Alphabet; $Language.Orthographies;
        keys;
        (() => {
            alphabetized = alphabetize(!!keys.length? filtered_lex : $Language.Lexicon)
        })();
    }

    type senseInput = {
        definition: string;
        tags: string;
        lects: string[];
    }
    let senses: senseInput[] = [{
        definition: '',
        tags: '',
        lects: [...$Language.Lects],
    }];

    let lectSet: string[]
    $: { // Update the set of lects when the `senses` array changes
        senses; $Language.Lects; $Language.UseLects;
        lectSet = Array.from(new Set(senses.map(sense => [...sense.lects]).flat().filter(lect => $Language.Lects.includes(lect))))
    }

    function scrollIntoView(word: string) {
        const entry = document.getElementById(word);
        if (entry) {
            if (!!$selectedTab) {
                $Language.Layouts.tabmode === 'switch'
                    ? $selectedTab = [0]
                    : $selectedTab.push(0)
            };
            searchDefinitions = ''; searchTags = ''; searchWords = ''; lectFilter = '';
            entry.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        };
    }
    ipcRenderer.on('lexicon link', (_:any, word: string) => {
        console.log('link:', word);
        scrollIntoView(word);
    });

</script>
<!-- Lexicon Tab -->

<div class='tab-pane' style=overflow:hidden>
    <div class=row style='height: 91vh'>

        {#if $selectedTab.includes(0)}
            <LexiconView/>
            <WordEntry/>
            {#if $Language.ShowAlphabet}
                <AlphabetSettings/>
            {/if}
        {/if}

    </div>
</div>
