<script lang="ts">
    import { Language, phraseInput, phrasePronunciations, selectedCategory, categoryInput } from "../stores";
    import { debug } from '../utils/diagnostics';
    import type * as Lexc from '../types';
    import { get_pronunciation } from '../utils/phonetics';
    import PhraseEntry from '../components/PhraseEntry.svelte';
    import VariantInput from '../components/VariantInput.svelte';
    import SenseInput from '../components/SenseInput.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    const vex = require('vex-js');
    $categoryInput = $selectedCategory;
    let searchPhrase = '';
    let searchDescription = '';
    let searchTags = '';
    let lectFilter = '';
    let phraseKeys: string[] = [];
    let collapsedPanel = false;
    let phraseDescription = ''
    let variantInputs = [];
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
            let pronunciations = {};
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
        let pronunciations = {};
        console.log($phrasePronunciations, lects);
        Object.keys($phrasePronunciations).filter(lect => lects.includes(lect)).forEach(lect => {
            console.log(lect)
            pronunciations[lect] = {
                ipa: $phrasePronunciations[lect].trim(),
                irregular: $phrasePronunciations[lect].trim() !== get_pronunciation(newPhrase, lect),
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
                    let variants = {};
                    for (const variant of variantInputs) {
                        const phrase = variant.phrase.trim();
                        if (!phrase) continue;
                        const description = variant.description.trim();
                        if (!description) continue;
                        let pronunciations: Lexc.EntryPronunciations = {};
                        Object.keys(variant.pronunciations).forEach(lect => {
                            pronunciations[lect] = {
                                ipa: variant.pronunciations[lect].trim(),
                                irregular: variant.pronunciations[lect].trim() !== get_pronunciation(phrase, lect),
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
                let pronunciations = {};
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
    <div class="row" style="height: 58vh;">
        <!-- Categories -->
        <div class="container column" style="max-width: 18%;">
            <p use:tooltip={{position:'bottom'}} title="This panel will fill with category names as you assign phrases to new ones.">
                Categories</p>
            <hr />
            <div class="column scrolled" style="max-height: 90%;" id="category-body">
                {#each Object.keys($Language.Phrasebook) as category}
                    <div class="lex-entry capitalize" class:selected={category === $selectedCategory} on:mousedown={() => select(category)}>
                            {category}
                    </div>
                {:else}
                    <p class="info">Categories will appear here.</p>
                {/each}
            </div>
        </div>
        <div class="container column" style='overflow: hidden'>
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
                        <PhraseEntry phrase={phrase} on:edit={() => editPhrase(phrase)} />
                    {/each}
                {:else}
                    <p class="info">Select a category from the left or add your first phrase entry.</p>
                {/if}
            </div>
        </div>
    </div>
    <!-- Phrase Editor -->
    <div class="container collapsible-row" style="height: 34vh;">
        <div class="row" style="width: 100vh">
            <button class="collapser-h" on:click={() => collapsedPanel = !collapsedPanel}></button>
        </div>
        <div class="row" class:collapsed={collapsedPanel} style="height: 92%">
            <div class="column scrolled" style="max-height: 100%">
                
                <label for="phrase" use:tooltip={{position:'right'}} title="Write a new phrase in your language here. The pronunciation is updated the same as in the Lexicon tab.">
                    Phrase</label>
                <input type="text" bind:value={$phraseInput} on:input={() => {
                    lects.forEach(lect => {
                        $phrasePronunciations[lect] = get_pronunciation($phraseInput, lect);
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

                <label><p use:tooltip={{position:'right'}} title="Use this field to assign this phrase to a category, or to create a new one with this phrase as its first member.">Category</p>
                    <input type="text" bind:value={$categoryInput} />
                </label>

                <button on:click={addPhrase} class="hover-shadow hover-highlight">Add Phrase</button>
            </div>
            <div class="column scrolled" style="max-height: 100%" id="variants-body">
                {#each variantInputs as _, i}
                    <VariantInput
                        lects={lects}
                        bind:phrase={variantInputs[i].phrase} 
                        bind:pronunciations={variantInputs[i].pronunciations}
                        bind:description={variantInputs[i].description}
                        on:update={() => {
                            lects.forEach(lect => {
                                variantInputs[i].pronunciations[lect] = get_pronunciation(variantInputs[i].phrase, lect);
                            });
                        }}
                    />
                {:else}
                    <p class="info">Click the button below to add a variation for this phrase</p>
                {/each}
                <button on:click={addVariant} class="hover-shadow hover-highlight"
                    use:tooltip={{position:'bottom', autoPosition: true}} title="If there are multiple ways to say your phrase, you can add variant entries for it along with descriptions."
                >+ Variant</button>
            </div>
        </div>
    </div>
</div>
