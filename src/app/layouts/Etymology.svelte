<svelte:options runes/>
<script lang='ts'>
    import { Language, selectedTab } from '../stores';
    import { alphabetize } from '../utils/alphabetize';
    import type * as Lexc from '../types';
    import Tree from '../components/Tree.svelte';
    import Draggable from '../components/Draggable.svelte';
    import LexEntry from '../components/Lexicon/LexEntry.svelte';
    let newParent: string[] = $state(['', '']);
    let newChild: string[] = $state(['', '']);
    let manualParentEntry: boolean = $state(false); 
    let manualChildEntry: boolean = $state(false);

    let selectedEntry: string =$state('');
    let keys: string[] = $state([]);
    let filtered_lex: Lexc.Lexicon = $derived(
        keys.reduce((acc, key) => {
            if (key in $Language.Lexicon) acc[key] = $Language.Lexicon[key];
            return acc;
        }, {} as Lexc.Lexicon)
    );

    function buildExternalLexicon(currentLexicon: Lexc.Lexicon, relatives: Lexc.Language["Relatives"], etymologies: Lexc.Etymologies) {
        const lexicon: Lexc.Lexicon = {};
        Object.keys(relatives).forEach(lexicon_name => {
            Object.keys(relatives[lexicon_name]).forEach(entry => {
                if (!(entry in currentLexicon)) lexicon[entry] = relatives[lexicon_name][entry];
            });
        });
        Object.keys(etymologies).forEach(entry => {
            if (!(entry in currentLexicon)) lexicon[entry] = { Senses: [], pronunciations: {} };
        });
        return lexicon;
    }

    let lexicon: Lexc.Lexicon = $derived(buildExternalLexicon($Language.Lexicon, $Language.Relatives, $Language.Etymologies));

    let alphabetized: string[] = $derived(alphabetize(!!keys.length? filtered_lex : $Language.Lexicon));
    let filteredExternal: Lexc.Lexicon = $derived(
        keys.reduce((acc, key) => {
            if (key in lexicon) acc[key] = lexicon[key];
            return acc;
        }, {} as Lexc.Lexicon)
    );

    let externalAlphabetized: string[] = $derived(alphabetize(!!keys.length? filteredExternal : lexicon));

    let search: string = $state('');

    function searchEntries() {
        let mergedLexicons: Lexc.Lexicon = {};
        for (const name in $Language.Relatives) {
            mergedLexicons = { ...mergedLexicons, ...$Language.Relatives[name] };
        }
        mergedLexicons = { ...mergedLexicons, ...$Language.Lexicon };
        keys = Object.keys(mergedLexicons).filter(entry => {
            let term: string;
            term = $Language.CaseSensitive? entry : entry.toLowerCase()
            term = $Language.IgnoreDiacritics? entry.normalize('NFD') : entry;
            let search_term: string;
            search_term = $Language.CaseSensitive? search : search.toLowerCase();
            search_term = $Language.IgnoreDiacritics? search_term.normalize('NFD') : search_term;
            return `^${term.replaceAll(/\s+/g, '^')}^`.includes(search_term);
        });
    }
    
    type Node = {
        name: string;
        children: { name: string, source: string }[];
        parents: { name: string, source: string }[];
    };

    function createTreeData(): Node {
        // find all the parents of selectedEntry
        const parents: string[][] = [];
        Object.keys($Language.Etymologies).forEach(entry => {
            if (entry === selectedEntry) return;
            if ($Language.Etymologies[entry].descendants.some(descendant => descendant.name === selectedEntry)) {
                const source: string = $Language.Etymologies[entry].source === '<< THIS LANGUAGE >>'? $Language.Name : $Language.Etymologies[entry].source;
                parents.push([
                    entry,
                    source
                ]);
            }
        });
        // find all the children of selectedEntry
        const children: string[][] = [];
        if (selectedEntry in $Language.Etymologies) 
            $Language.Etymologies[selectedEntry].descendants.forEach(descendant => {
                children.push([
                    descendant.name, 
                    descendant.source === '<< THIS LANGUAGE >>'? $Language.Name : descendant.source
                ]);
            });

        // create the tree data
        return {
            name: selectedEntry,
            children: children.map(child => { return {name: child[0], source: child[1]} }),
            parents: parents.map(parent => { return {name: parent[0], source: parent[1]} })
        };
    }

    let tree: Node = $state(createTreeData());
    let width: number = $state(window.innerWidth * .80); 
    let height: number = $state(window.innerHeight * .5);

    $effect(()=>{
        selectedEntry; $Language.Etymologies;
        tree = createTreeData();
    });
</script>

<div class='tab-pane'>

        {#if $selectedTab.includes(1)}
            <!-- Etymology Editor -->
            <Draggable panel=etymologyeditor>
                <div class='container glasspane scrolled' bind:clientWidth={width} bind:clientHeight={height}>
                    {#if !!selectedEntry}
                            <Tree
                                {tree}
                                {width}
                                height={height/3}
                                select={(s: string) => selectedEntry = s}
                            />
                        {#if selectedEntry in $Language.Lexicon}
                            <LexEntry word={selectedEntry} source={$Language.Lexicon[selectedEntry]} showEtymology={false}/>
                        {:else if Object.entries($Language.Relatives).some(([_, lex]) => Object.keys(lex).includes(selectedEntry))}
                            <LexEntry
                                word={selectedEntry}
                                source={$Language.Relatives[ Object.entries($Language.Relatives).find(([_, lex]) => Object.keys(lex).includes(selectedEntry))![0] ][selectedEntry]}
                                showEtymology={false}
                            />
                        {/if}
                    {:else}
                        <p class='info'>Select an entry from the left to view and edit its etymology.</p>
                    {/if}
                    <hr />
                    {#if !(tree?.parents? tree.parents[0] : false) && !(tree?.children? tree.children[0] : false) && !!selectedEntry}
                        <button class="hover-highlight hover-shadow" onclick={() => {
                            const { [selectedEntry]: _, ...rest } = $Language.Etymologies;
                            $Language.Etymologies = rest;
                            selectedEntry = '';
                        }}>Delete Empty Etymology</button>
                    {/if}
                    <div class='row'>
                        <!-- Ancestors Column -->
                        <div class='column'>
                            <p>Ancestors</p>
                            <label>Manual Entry
                                <input type='checkbox' bind:checked={manualParentEntry} />
                            </label>
                            {#if !manualParentEntry}
                                <select bind:value={newParent[0]}
                                    onchange={() => newParent[1] = $Language.Name}>
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
                            {:else}
                                <label>New Ancestor
                                    <input type='text' bind:value={newParent[0]} />
                                </label>
                                <label>Source Language
                                    <input type='text' bind:value={newParent[1]} />
                                </label>
                            {/if}
                            <button class='hover-highlight hover-shadow' onclick={() => {
                                if (!newParent[0]) return;
                                if (!(newParent[0] in $Language.Etymologies))
                                    $Language.Etymologies[newParent[0]] = {
                                        source: newParent[1] === $Language.Name? '<< THIS LANGUAGE >>' : newParent[1],
                                        descendants: []
                                    };
                                $Language.Etymologies[newParent[0]].descendants.push({
                                    name: selectedEntry,
                                    source: $Language.Etymologies[selectedEntry].source
                                });
                                $Language.Etymologies = {...$Language.Etymologies};
                                newParent = ['', ''];
                            }}>Link</button>
                            <div class='column scrolled'>
                                {#each tree.parents as parent}
                                    <div class='row'>
                                        <div class='column'>
                                            <p class='lex-body'>{parent.name}</p>
                                            <p class='tag-item'>{parent.source}</p>
                                        </div>
                                        <div class='column'>
                                            <button class='hover-highlight hover-shadow' onclick={() => {
                                                $Language.Etymologies[parent.name].descendants
                                                    = $Language.Etymologies[parent.name].descendants.filter(descendant => descendant.name !== selectedEntry);
                                                $Language.Etymologies = {...$Language.Etymologies};
                                            }}>Sever</button>
                                        </div>
                                    </div>
                                {:else}
                                    <p class='info'>This entry has no ancestors.</p>
                                {/each}
                            </div>
                        </div>
                        <!-- Descendants Column -->
                        <div class='column'>
                            <p>Descendants</p>
                            <label>Manual Entry
                                <input type='checkbox' bind:checked={manualChildEntry} />
                            </label>
                            {#if !manualChildEntry}
                                <select bind:value={newChild[0]} onchange={() => newChild[1] = $Language.Name}>
                                    <optgroup label="Internal">
                                        {#each alphabetized as entry}
                                            <option value={entry}>{ entry }</option>
                                        {/each}
                                    </optgroup>
                                    <optgroup label="External">
                                        {#each externalAlphabetized as entry}
                                            <option value={entry}>{ entry }</option>
                                        {/each}
                                    </optgroup>
                                </select>
                            {:else}
                                <label>New Descendant
                                    <input type='text' bind:value={newChild[0]} />
                                </label>
                                <label>Source Language
                                    <input type='text' bind:value={newChild[1]} />
                                </label>
                            {/if}
                            <button class='hover-highlight hover-shadow' onclick={() => {
                                if (!newChild[0]) return;
                                if (!(newChild[0] in $Language.Etymologies))
                                    $Language.Etymologies[newChild[0]] = {
                                        source: newChild[1],
                                        descendants: []
                                    };
                                $Language.Etymologies[selectedEntry].descendants.push({
                                    name: newChild[0],
                                    source: newChild[1] === $Language.Name? '<< THIS LANGUAGE >>' : newChild[1]
                                });
                                $Language.Etymologies = {...$Language.Etymologies};
                                newChild = ['', ''];
                            }}>Link</button>
                            <div class='column scrolled'>
                                {#if tree}
                                    {#each tree.children as child}
                                        <div class='row'>
                                            <div class='column'>
                                                <p class='lex-body'>{child.name}</p>
                                                <p class='tag-item'>{child.source}</p>
                                            </div>
                                            <div class='column'>
                                                <button class='hover-highlight hover-shadow' onclick={() => {
                                                    $Language.Etymologies[selectedEntry].descendants
                                                        = $Language.Etymologies[selectedEntry].descendants.filter(descendant => descendant.name !== child.name);
                                                    $Language.Etymologies = {...$Language.Etymologies};
                                                }}>Sever</button>
                                            </div>
                                        </div>
                                    {:else}
                                        <p class='info'>This entry has no descendants.</p>
                                    {/each}
                                {:else}
                                    {(()=>{
                                        console.log(tree);
                                        return ''
                                    })()}
                                {/if}
                            </div>
                        </div>
                    </div>
                    <br><br><br>
                </div>
            </Draggable>
            
            <!-- Entry Selection -->
            <Draggable panel=etymologyselect>
                <div class='container glasspane'>
                    <p>Entries</p>
                    <hr />
                    <div class='search-container'>
                        {#if !search}
                            <label for='search' style='position: absolute; top: 0.333em; left: 10%'>Search…</label>
                        {/if}
                        <input id='search' type='text' class='search' style='margin: auto; width: 90%'
                            bind:value={search}
                            oninput={searchEntries}
                        />
                    </div>
                    <p>⦓ <i>Internal</i> ⦔</p>
                    <div class='column scrolled' style='max-height: 40%'>
                        {#each alphabetized as entry, i}
                            <div class='lex-entry' class:selected={entry === selectedEntry}
                                onmousedown={() => {
                                    selectedEntry = entry;
                                    if (!(entry in $Language.Etymologies))
                                        $Language.Etymologies[entry] = {
                                            descendants: [],
                                            source: '<< THIS LANGUAGE >>'
                                        }
                                }}
                                role=button
                                tabindex={i}
                            > {entry}
                            </div>
                        {:else}
                            <p class='info'>Lexicon entries will appear here.</p>
                        {/each}
                    </div>
                    <br>
                    <p>⦔ <i>External</i> ⦓</p>
                    <div class='column scrolled' style='max-height: 40%'>
                        {#each externalAlphabetized as entry, i}
                            <div class='lex-entry' class:selected={entry === selectedEntry}
                                onmousedown={() => { selectedEntry = entry; }}
                                role=button
                                tabindex={i}
                            > {entry} </div>
                        {:else}
                            <p class='info'>External-source etymology entries will appear here.</p>
                        {/each}
                    </div>
                </div>
                <br><br><br>
            </Draggable>
        {/if}

</div>

