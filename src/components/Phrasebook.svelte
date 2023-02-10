<script lang="ts">
    import { phrasebook, phrase_input, phrase_description, phrase_pronunciation, 
        selected_category, category_input, variant_inputs } from "../stores";
    import { get_pronunciation } from "../scripts/phonetics";
    import PhraseEntry from "./PhraseEntry.svelte";
    import VariantInput from "./VariantInput.svelte";
    $category_input = $selected_category;
    let search_phrase = '';
    let search_description = '';
    let phrase_keys = [];
    $: collapsedPanel = false;

    /**
     * Searches the phrasebook within the currently selected category
     * for entries matching the search terms. Phrases which contain only
     * a match in one of their variants are also included.
     * @returns {Array} An array of keys matching the search terms.
     */ 
    function search_book() {
        if (!$selected_category) return [];
        let scope = $phrasebook[$selected_category];
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
    // any time $selected_category, search_phrase, or search_description changes, update phrase_keys
    $: $selected_category, search_phrase, search_description, (() => {phrase_keys = search_book()})(); 

    /**
     * Changes the selected category and updates the category input field.
     * @param {string} category
     */
    function select(category) {
        $selected_category = category;
        $category_input = category;
    }

    /**
     * Removes a phrase from the phrasebook and moves it to the input fields, including all variants.
     * @param {string} phrase
     */ 
    function edit_phrase(phrase) {
        $phrase_input = phrase;
        $phrase_pronunciation = $phrasebook[$selected_category][phrase].pronunciation;
        $phrase_description = $phrasebook[$selected_category][phrase].description;
        $variant_inputs = [];
        for (let variant in $phrasebook[$selected_category][phrase].variants) {
            $variant_inputs = [...$variant_inputs, {
                phrase: variant,
                pronunciation: $phrasebook[$selected_category][phrase].variants[variant].pronunciation,
                description: $phrasebook[$selected_category][phrase].variants[variant].description,
            }];
        }
        delete $phrasebook[$selected_category][phrase]; $phrasebook = $phrasebook;
    }
    
    /**
     * Adds a new blank variant to the variant_inputs array.
     */ 
    function add_variant() {
        $variant_inputs = [...$variant_inputs, {
            phrase: '',
            pronunciation: '',
            description: '',
        }];
    }

    /**
     * Adds a phrase from the input fields to the phrasebook, including all variants,
     * and clears the input fields.
     */ 
    function add_phrase() {
        let new_phrase = $phrase_input.trim();
        if (!new_phrase) return;
        let description = $phrase_description.trim();
        if (!description) return;
        let category = $category_input.trim();
        if (!category) return;
        let pronunciation = $phrase_pronunciation.trim();

        if (!!$phrasebook[category][new_phrase]) {
            let confirmation = window.confirm(
                'This phrase already exists in this category. Are you sure you want to overwrite it?'
            );
            if (!confirmation) return;
        }

        $phrasebook[category][new_phrase] = {
            pronunciation: pronunciation,
            description: description,
            variants: {},
        };
        for (let variant of $variant_inputs) {
            let phrase = variant.phrase.trim();
            if (!phrase) continue;
            let description = variant.description.trim();
            if (!description) continue;
            let pronunciation = variant.pronunciation.trim();
            $phrasebook[category][new_phrase].variants[phrase] = {
                pronunciation: pronunciation,
                description: description,
            };
        };

        $phrasebook = $phrasebook;
        $phrase_input = '';
        $phrase_pronunciation = '';
        $phrase_description = '';
        $variant_inputs = [];
        $selected_category = category;
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
                {#each Object.keys($phrasebook) as category}
                    <div class="lex-entry capitalize" class:selected={category === $selected_category} on:mousedown={() => select(category)}>
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
                {#if !!Object.keys($phrasebook).length}
                    {#each phrase_keys as phrase}
                        <PhraseEntry phrase={phrase} on:edit={() => edit_phrase(phrase)} />
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
                <input type="text" bind:value={$phrase_input} on:input={() => $phrase_pronunciation = get_pronunciation($phrase_input)} />
                <input type="text" class="pronunciation" bind:value={$phrase_pronunciation} />
                <label for="description">Description</label>
                <textarea id="description" bind:value={$phrase_description}></textarea>
                <br>
                <label for="category">Category</label>
                <input type="text" bind:value={$category_input} />
                <button on:click={add_phrase} class="hover-shadow hover-highlight">Add Phrase</button>
            </div>
            <div class="column scrolled" style="max-height: 100%" id="variants-body">
                {#each $variant_inputs as _, i}
                    <VariantInput 
                        bind:phrase={$variant_inputs[i].phrase} 
                        bind:pronunciation={$variant_inputs[i].pronunciation}
                        bind:description={$variant_inputs[i].description}
                        on:update={() => $variant_inputs[i].pronunciation = get_pronunciation($variant_inputs[i].phrase)}
                    />
                {:else}
                    <p class="info">Click the button below to add a variation for this phrase</p>
                {/each}
                <button on:click={add_variant} class="hover-shadow hover-highlight">+ Variant</button>
            </div>
        </div>
    </div>
</div>
