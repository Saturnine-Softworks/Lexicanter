<script lang="ts">
    import { Language, phraseInput, phrasePronunciation, selectedCategory, categoryInput } from "../stores";
    import type * as Lexc from "../scripts/types"
    import { get_pronunciation } from "../scripts/phonetics";
    import PhraseEntry from "./PhraseEntry.svelte";
    import VariantInput from "./VariantInput.svelte";
    $categoryInput = $selectedCategory;
    let search_phrase = '';
    let search_description = '';
    let phrase_keys = [];
    $: collapsedPanel = false;
    $: phraseDescription = ''
    $: variantInputs = [];

    /**
     * Searches the phrasebook within the currently selected category
     * for entries matching the search terms. Phrases which contain only
     * a match in one of their variants are also included.
     * @returns {Array} An array of keys matching the search terms.
     */ 
    function searchBook() {
        if (!$selectedCategory) return [];
        let scope: Lexc.PhraseCategory = $Language.Phrasebook[$selectedCategory];
        let phrase_search = search_phrase.trim();
        let descript_search = search_description.toLowerCase().trim();
        if (!phrase_search && !descript_search) return Object.keys(scope);

        let keys = [];
        for (let entry in scope) {
            let term = '^' + entry + '^';
            let phrase_match = !phrase_search
            let descript_match = !descript_search

            if (term.includes(phrase_search))
                phrase_match = true;
            if (scope[entry].description.toLowerCase().includes(descript_search)) 
                descript_match = true;

            for (let variant in scope[entry].variants) {
                let v_term = '^' + variant + '^';
                if (v_term.includes(phrase_search))
                    phrase_match = true;
                if (scope[entry].variants[variant].description .toLowerCase().includes(descript_search))
                    descript_match = true;
            }

            if (phrase_match && descript_match) 
                keys.push(entry);
        }
        return keys;
    }
    // any time $selectedCategory, search_phrase, or search_description changes, update phrase_keys
    $: $selectedCategory, search_phrase, search_description, (() => {phrase_keys = searchBook()})(); 

    /**
     * Changes the selected category and updates the category input field.
     * @param {string} category
     */
    function select(category) {
        $selectedCategory = category;
        $categoryInput = category;
    }

    /**
     * Removes a phrase from the phrasebook and moves it to the input fields, including all variants.
     * @param {string} phrase
     */ 
    function editPhrase(phrase: string): void {
        $phraseInput = phrase;
        $phrasePronunciation = (() => {
            let pronunciations = '';
            for (let pronunciation of Object.values($Language.Phrasebook[$selectedCategory][phrase].pronunciations)) {
                pronunciations += pronunciation.ipa + '\n';
            }
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
        delete $Language.Phrasebook[$selectedCategory][phrase]; $Language.Phrasebook = $Language.Phrasebook;
    }
    
    /**
     * Adds a new blank variant to the variant_inputs array.
     */ 
    function add_variant() {
        variantInputs = [...variantInputs, {
            phrase: '',
            pronunciation: '',
            description: '',
        }];
    }

    /**
     * Adds a phrase from the input fields to the phrasebook, including all variants,
     * and clears the input fields.
     */ 
    function addPhrase() {
        let newPhrase = $phraseInput.trim();
        if (!newPhrase) return;
        let description = phraseDescription.trim();
        if (!description) return;
        let category = $categoryInput.trim();
        if (!category) return;
        let pronunciation = $phrasePronunciation.trim();

        if (!!$Language.Phrasebook[category][newPhrase]) {
            let confirmation = window.confirm(
                'This phrase already exists in this category. Are you sure you want to overwrite it?'
            );
            if (!confirmation) return;
        }

        $Language.Phrasebook[category][newPhrase] = {
            pronunciations: { 
                General: {
                    ipa: pronunciation,
                    irregular: pronunciation !== get_pronunciation(newPhrase),
                }
            },
            lects: [],
            tags: [],
            description: description,
            variants: {},
        };
        for (let variant of variantInputs) {
            let phrase = variant.phrase.trim();
            if (!phrase) continue;
            let description = variant.description.trim();
            if (!description) continue;
            let pronunciation = variant.pronunciation.trim();
            $Language.Phrasebook[category][newPhrase].variants[phrase] = {
                pronunciations: {
                    General: {
                        ipa: pronunciation,
                        irregular: pronunciation !== get_pronunciation(phrase),
                    }
                },
                lects: [],
                tags: [],
                description: description,
            };
        };

        $Language.Phrasebook = $Language.Phrasebook;
        $phraseInput = '';
        $phrasePronunciation = '';
        phraseDescription = '';
        variantInputs = [];
        $selectedCategory = category;
    }
</script>
<!-- Phrasebook Tab -->
<div class="tab-pane">
    <div class="row" style="height: 58vh;">
        <!-- Categories -->
        <div class="container column" style="max-width: 18%;">
            <p>Categories</p>
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
        <div class="container column">
            <!-- Search Fields -->
            <div class="row">
                <div class="column search-container">
                    {#if !search_phrase}
                         <label for="search-phrase" style="position: absolute; top: .5em; left: 1em">Search by phrase…</label>
                    {/if}
                    <input id="search-phrase" type="text" class="search" bind:value={search_phrase}/>
                </div>
                <div class="column search-container">
                    {#if !search_description}
                        <label for="search-description" style="position: absolute; top: .5em; left: 1em">Search descriptions…</label>
                    {/if}
                    <input id="search-description" type="text" class="search" bind:value={search_description}/>
                </div>
            </div>
            <!-- Book -->
            <div class="column scrolled" id="phrasebook-body" style="max-height: 90%;">
                {#if !!Object.keys($Language.Phrasebook).length}
                    {#each phrase_keys as phrase}
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
                <label for="phrase">Phrase</label>
                <input type="text" bind:value={$phraseInput} on:input={() => $phrasePronunciation = get_pronunciation($phraseInput)} />
                <input type="text" class="pronunciation" bind:value={$phrasePronunciation} />
                <label for="description">Description</label>
                <textarea id="description" bind:value={phraseDescription}></textarea>
                <br>
                <label for="category">Category</label>
                <input type="text" bind:value={$categoryInput} />
                <button on:click={addPhrase} class="hover-shadow hover-highlight">Add Phrase</button>
            </div>
            <div class="column scrolled" style="max-height: 100%" id="variants-body">
                {#each variantInputs as _, i}
                    <VariantInput 
                        bind:phrase={variantInputs[i].phrase} 
                        bind:pronunciation={variantInputs[i].pronunciation}
                        bind:description={variantInputs[i].description}
                        on:update={() => variantInputs[i].pronunciation = get_pronunciation(variantInputs[i].phrase)}
                    />
                {:else}
                    <p class="info">Click the button below to add a variation for this phrase</p>
                {/each}
                <button on:click={add_variant} class="hover-shadow hover-highlight">+ Variant</button>
            </div>
        </div>
    </div>
</div>
