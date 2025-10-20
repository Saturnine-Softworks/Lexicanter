<script lang="ts">
    import { Language, phraseInput, phrasePronunciations, selectedCategory, categoryInput, selectedTab } from "../stores";
    import type * as Lexc from '../types';
    import { get_pronunciation } from '../utils/phonetics';
    import PhraseEntry from '../components/PhraseEntry.svelte';
    import VariantInput from '../components/VariantInput.svelte';
    import SenseInput from '../components/SenseInput.svelte';
    import Draggable from "../components/Draggable.svelte";
    const vex = require('vex-js');

    $categoryInput = $selectedCategory;
    let searchPhrase = '';
    let searchDescription = '';
    let searchTags = '';
    let lectFilter = '';
    let phraseKeys: string[] = [];
    let phraseDescription = ''
    let variantInputs: {
        phrase: string;
        pronunciations: Record<string, {ipa: string, irregular: boolean}>;
        description: string;
    }[] = [];
    let lects = [...$Language.Lects];
    let tags = '';

    /**
     * Searches the phrasebook within the currently selected category
     * for entries matching the search terms. Phrases which contain only
     * a match in one of their variants are also included.
     * @returns {string[]} An array of keys matching the search terms.
     */ 
    function searchBook(): string[] {
        if (!$selectedCategory) return [];
        const scope: Lexc.PhraseCategory = $Language.Phrasebook[$selectedCategory];
        const phrase_search = searchPhrase.trim();
        const descript_search = searchDescription.toLowerCase().trim();
        const tags_search = searchTags.toLowerCase().trim();

        let keys = [];
        for (let entry in scope) {
            let term = '^' + entry.replaceAll(/\s+/g, '^') + '^';
            if (!phrase_search || term.toLowerCase().includes(phrase_search)) {
                if (!descript_search || scope[entry].description.toLowerCase().includes(descript_search)) {
                    if (!tags_search || scope[entry].tags.join(' ').toLowerCase().includes(tags_search)) {
                        if (!lectFilter || scope[entry].lects.includes(lectFilter)) {
                            keys.push(entry);
                        }
                    }
                }
            }
            for (let variant in scope[entry].variants) {
                let variantEntry = scope[entry].variants[variant];
                let term = '^' + variant.replaceAll(/\s+/g, '^') + '^';
                if (!phrase_search || term.toLowerCase().includes(phrase_search)) {
                    if (!descript_search || variantEntry.description.toLowerCase().includes(descript_search)) {
                        keys.push(entry);
                    }
                }
            }
        }
        return [...new Set(keys)]; // spread set syntax = no duplicate keys
    }
    $: {
        // any time $selectedCategory, searchPhrase, searchTags, lectFilter, or searchDescription changes, update phrase_keys
        $Language.Phrasebook;
        $selectedCategory; searchPhrase; searchDescription; searchTags; lectFilter;
        (() => {phraseKeys = searchBook()})();
    }

    /**
     * Changes the selected category and updates the category input field.
     * @param {string} category
     */
    function select(category: string): void {
        $selectedCategory = category;
        $categoryInput = category;
    }

    /**
     * Removes a phrase from the phrasebook and moves it to the input fields, including all variants.
     * @param {string} phrase
     */ 
    function editPhrase(phrase: string): void {
        $phraseInput = phrase;
        $categoryInput = $selectedCategory;
        $phrasePronunciations = (() => {
            let pronunciations: Record<string, string> = {};
            Object.keys($Language.Phrasebook[$selectedCategory][phrase].pronunciations).forEach(lect => {
                pronunciations[lect] = $Language.Phrasebook[$selectedCategory][phrase].pronunciations[lect].ipa;
            });
            return pronunciations;
        })();
        phraseDescription = $Language.Phrasebook[$selectedCategory][phrase].description;
        variantInputs = [];
        for (let variant in $Language.Phrasebook[$selectedCategory][phrase].variants) {
            variantInputs = [...variantInputs, {
                phrase: variant,
                pronunciations: $Language.Phrasebook[$selectedCategory][phrase].variants[variant].pronunciations,
                description: $Language.Phrasebook[$selectedCategory][phrase].variants[variant].description,
            }];
        }
        delete $Language.Phrasebook[$selectedCategory][phrase];
        if (Object.keys($Language.Phrasebook[$selectedCategory]).length === 0) {
            delete $Language.Phrasebook[$selectedCategory];
            $selectedCategory = '';
        }
        $Language = {...$Language};
    }
    
    /**
     * Adds a new blank variant to the variant_inputs array.
     */ 
    function addVariant(): void {
        variantInputs = [...variantInputs, {
            phrase: '',
            pronunciations: (()=>{
                let pronunciations = {};
                // @ts-ignore : the situation here is complicated...
                lects.forEach(lect => pronunciations[lect] = '');
                return pronunciations;
            })(),
            description: '',
        }];
    }

    /**
     * Adds a phrase from the input fields to the phrasebook, including all variants,
     * and clears the input fields.
     */ 
    function addPhrase(): void {
        let newPhrase = $phraseInput.trim();
        if (!newPhrase) return;
        let description = phraseDescription.trim();
        if (!description) return;
        let category = $categoryInput.trim();
        if (!category) return
        let pronunciations: Record<string, {ipa: string, irregular: boolean}> = {};
        console.log($phrasePronunciations, lects);
        Object.keys($phrasePronunciations).filter(lect => lects.includes(lect)).forEach(async lect => {
            console.log(lect)
            pronunciations[lect] = {
                ipa: $phrasePronunciations[lect].trim(),
                irregular: $phrasePronunciations[lect].trim() !== await get_pronunciation(newPhrase, lect),
            };
        });
        
        function commit () {
            if (!$Language.Phrasebook.hasOwnProperty(category)) $Language.Phrasebook[category] = {};
            $Language.Phrasebook[category][newPhrase]= {
                pronunciations: pronunciations,
                lects: Object.keys(pronunciations),
                tags: tags.split(/\s+/g),
                description: description,
                variants: (()=>{
                    let variants: Record<string, Lexc.Variant> = {};
                    for (const variant of variantInputs) {
                        const phrase = variant.phrase.trim();
                        if (!phrase) continue;
                        const description = variant.description.trim();
                        if (!description) continue;
                        let pronunciations: Lexc.EntryPronunciations = {};
                        Object.keys(variant.pronunciations).forEach(async lect => {
                            pronunciations[lect] = {
                                ipa: variant.pronunciations[lect].ipa.trim(),
                                irregular: variant.pronunciations[lect].ipa.trim() !== await get_pronunciation(phrase, lect),
                            };
                        });
                        variants[phrase] = <Lexc.Variant> {
                            pronunciations: pronunciations,
                            description: description,
                        };
                    };
                    return variants;
                })(),
            };
            // debug.logObj($Language.Phrasebook, 'Phrasebook');

            $Language = {...$Language};
            $phraseInput = '';
            $phrasePronunciations = (()=>{
                let pronunciations: Record<string, string> = {};
                Object.keys($Language.Pronunciations).forEach(lect => {
                    pronunciations[lect] = '';
                });
                return pronunciations;
            })();
            phraseDescription = '';
            variantInputs = [];
            $selectedCategory = category;
        }

        if (!!$Language.Phrasebook.hasOwnProperty(category) && !!$Language.Phrasebook[category].hasOwnProperty(newPhrase)) {
            vex.dialog.confirm({
                message: 'This phrase already exists in this category. Are you sure you want to overwrite it?',
                callback: (response: boolean) => {
                    if (response) commit();
                }
            });
        } else {
            commit();
        }
    }
</script>
<!-- Phrasebook Tab -->
<div class="tab-pane">
    {#if $selectedTab.includes(2)}

        <!-- Categories -->
        <Draggable panel=phrasecategories>
            <div class="container glasspane">
                <p>Categories</p>
                <hr />
                <div class="column scrolled" style="max-height:90%" id="category-body">
                    {#each Object.keys($Language.Phrasebook) as category}
                        <div
                            class="lex-entry capitalize"
                            class:selected={category === $selectedCategory}
                            on:mousedown={() => select(category)}
                            role="option"
                            aria-selected={category === $selectedCategory}
                            aria-roledescription="Select category"
                            tabindex="0"
                        >{category}</div>
                    {:else}
                        <p class="info">Categories will appear here.</p>
                    {/each}
                </div>
            </div>
        </Draggable>

        <!-- Phrasebook -->
        <Draggable panel=phrasebook>
            <div class="container glasspane" style='overflow: hidden'>
                <!-- Search Fields -->
                <div class="row">
                    <div class="column search-container">
                        {#if !searchPhrase}
                                <label for="search-phrase" style="position: absolute; top: .5em; left: 1em">Search by phrase…</label>
                        {/if}
                        <input id="search-phrase" type="text" class="search" bind:value={searchPhrase}/>
                    </div>
                    <div class="column search-container">
                        {#if !searchTags}
                                <label for="search-tags" style="position: absolute; top: .5em; left: 1em">Search by tags…</label>
                        {/if}
                        <input id="search-tags" type="text" class="search" bind:value={searchTags}/>
                    </div>
                </div>
                <div class="row">
                    <div class="column search-container">
                        {#if !searchDescription}
                            <label for="search-description" style="position: absolute; top: .5em; left: 1em">Search descriptions…</label>
                        {/if}
                        <input id="search-description" type="text" class="search" bind:value={searchDescription}/>
                    </div>
                    {#if $Language.UseLects}
                            <div class="column">
                                <label>Filter by lect:
                                    <select bind:value={lectFilter}>
                                        <option value=''>All</option>
                                        {#each $Language.Lects as lect}
                                            <option value={lect}>{lect}</option>
                                        {/each}
                                    </select>
                                </label>
                            </div>
                    {/if}
                </div>
            <!-- Book -->
            <div class="column scrolled" id="phrasebook-body" style="max-height: 88%;">
                {#if !!Object.keys($Language.Phrasebook).length}
                    {#each phraseKeys as phrase}
                        <PhraseEntry phrase={phrase} edit={() => editPhrase(phrase)} />
                    {/each}
                {:else}
                    <p class="info">Select a category from the left or add your first phrase entry.</p>
                {/if}
            </div>
        </div>
        </Draggable>

        <!-- Phrase Editor -->
        <Draggable panel=newphrase>
            <div class="container glasspane scrolled" style=height:94%>
                <div class="row">
                    <div class='column scrolled'>
            
                        <label for="phrase">Phrase</label>
                        <input type="text" bind:value={$phraseInput} on:input={() => {
                            lects.forEach(async lect => {
                                $phrasePronunciations[lect] = await get_pronunciation($phraseInput, lect);
                            });
                        }}/>
            
                        {#if $Language.UseLects}
                            {#each lects as lect}
                                <div class="row narrow">
                                    <div class="column text-right">
                                        <p class="lect">{lect}</p>
                                    </div>
                                    <div class="column text-left">
                                        <input type="text" class="pronunciation text-left" bind:value={$phrasePronunciations[lect]}/>
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <input type="text" class="pronunciation" bind:value={$phrasePronunciations.General}/>
                        {/if}
            
                        <SenseInput
                            index={'hide'}
                            bind:definition={phraseDescription}
                            bind:tags={tags}
                            bind:lects={lects}
                        />
                        <label>Category
                            <input type="text" bind:value={$categoryInput} />
                        </label>
                        <button on:click={addPhrase} class="hover-shadow hover-highlight">Add Phrase</button>
                    </div>
                    <div class="column scrolled" id="variants-body">
                        {#each variantInputs as _, i}
                            <VariantInput
                                {lects}
                                bind:phrase={variantInputs[i].phrase}
                                bind:pronunciations={variantInputs[i].pronunciations}
                                bind:description={variantInputs[i].description}
                                update={() => {
                                    lects.forEach(async lect => {
                                        variantInputs[i].pronunciations[lect] = {
                                            ipa: await get_pronunciation(variantInputs[i].phrase, lect),
                                            irregular: false,
                                        };
                                    });
                                }}
                            />
                        {:else}
                            <p class="info">Click the button below to add a variation for this phrase</p>
                        {/each}
                        <button on:click={addVariant} class="hover-shadow hover-highlight">+ Variant</button>
                    </div>
                </div>
            </div>
        </Draggable>

    {/if}
</div>
