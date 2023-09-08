<script lang='ts'>
    import { referenceLanguage } from '../../stores';
    import type { Language, Lexicon } from '../../types';
    import Tree from '../Tree.svelte';
    import LexEntry from '../LexEntry.svelte';
    import { alphabetize } from '../../utils/alphabetize';
    let Language = $referenceLanguage as Language;
    $: Language = $referenceLanguage as Language;

    let selectedEntry: string = '';

    interface Node {
        name: string;
        children: { name: string, source: string }[];
        parents: { name: string, source: string }[];
    }
    function createTreeData(): Node {
        // find all the parents of selectedEntry
        const parents: string[][] = [];
        Object.keys(Language.Etymologies).forEach(entry => {
            if (entry === selectedEntry) return;
            if (Language.Etymologies[entry].descendants.some(descendant => descendant.name === selectedEntry)) {
                const source: string = Language.Etymologies[entry].source === '<< THIS LANGUAGE >>'? Language.Name : Language.Etymologies[entry].source;
                parents.push([
                    entry,
                    source
                ]);
            }
        });
        // find all the children of selectedEntry
        const children: string[][] = [];
        if (selectedEntry in Language.Etymologies) 
            Language.Etymologies[selectedEntry].descendants.forEach(descendant => {
                children.push([
                    descendant.name, 
                    descendant.source === '<< THIS LANGUAGE >>'? Language.Name : descendant.source
                ]);
            });

        // create the tree data
        return {
            name: selectedEntry,
            children: children.map(child => { return {name: child[0], source: child[1]} }),
            parents: parents.map(parent => { return {name: parent[0], source: parent[1]} })
        };
    }

    let tree: Node;
    let width: number; let height: number;
    $: {
        Language; selectedEntry;
        tree = createTreeData();
        width = window.innerWidth * .82 * .33;
        height = window.innerHeight * .5
    }; 
    let externalAlphabetized: string[];
    let alphabetized: string[];
    $: {
        Language;
        (() => {
            const lexicon: Lexicon = {};
            Object.keys(Language.Relatives).forEach(lexicon_name => {
                Object.keys(Language.Relatives[lexicon_name]).forEach(entry => {
                    if (!(entry in Language.Lexicon)) lexicon[entry] = Language.Relatives[lexicon_name][entry];
                });
            });
            Object.keys(Language.Etymologies).forEach(entry => {
                if (!(entry in Language.Lexicon)) lexicon[entry] = { Senses: [], pronunciations: {} };
            });
            externalAlphabetized = alphabetize(lexicon);
            alphabetized = alphabetize(Language.Lexicon);
        })();
    }
</script>

<select bind:value={selectedEntry}>
    <optgroup label='Internal'>
        {#each alphabetized as entry}
            <option value={entry}>{ entry }</option>
        {/each}
    </optgroup>
    <optgroup label='External'>
        {#each externalAlphabetized as entry}
            <option value={entry}>{ entry }</option>
        {/each}
    </optgroup>
</select>

<Tree
    {tree}
    {width}
    {height}
    on:select={e => selectedEntry = e.detail}
/>
{#if selectedEntry in Language.Lexicon}
    <LexEntry 
        word={selectedEntry} 
        source={Language.Lexicon[selectedEntry]} 
        showInflections={Language.ShowInflection}
        showEtymology
    />
{/if}
