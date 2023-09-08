<script lang='ts'>
    import { Language, defaultLanguage, referenceLanguage, docsEditor } from '../stores';
    import { parseRules, applyRules } from '../utils/sca';
    import { saveFile } from '../utils/files';
    import Etymology from '../layouts/Etymology.svelte';
    import { initializeDocs } from '../utils/docs';
    const vex = require('vex-js');
    let soundChanges: string = ''; let testChanges: string = ''; let newName: string = '';
    let usePronunciations: boolean = false; let baseLect: string = $Language.Lects[0];
    function soundChange(text: string) {
        const settings = parseRules(soundChanges);
        return applyRules(settings.rules, text, settings.categories);
    }
</script>
<div class="row narrow">
    <div class=column>
        <label>Sound Changes
            <br/>
            <label>Base From Pronunciations
                    <input type=checkbox bind:checked={usePronunciations}/>
                {#if usePronunciations && $Language.UseLects}
                    <br/>
                    <label>Lect
                        <select bind:value={baseLect}>
                            {#each $Language.Lects as lect}
                                <option value={lect}>{lect}</option>
                            {/each}
                        </select>
                    </label>
                {/if}
            </label>
            <textarea rows=5 class=text-left bind:value={soundChanges}/>
        </label>
        <label>Test Changes
            <textarea rows=3 bind:value={testChanges}/>
            <textarea rows=3 class=pronunciation value={soundChange(testChanges)} readonly/>
        </label>
    </div>
    <div class=column>
        <label>New Language Name
            <input type=text bind:value={newName}/>
        </label>
        <button class='hover-highlight hover-shadow'
            on:click={() => {
                if (newName === $Language.Name) {
                    vex.dialog.alert('The new language must have a different name.');
                    return;
                }
                saveFile();
                window.setTimeout(() =>{
                    // Open the old language in the reference panel
                    if ($referenceLanguage) $referenceLanguage = false;
                    $referenceLanguage = structuredClone($Language);
    
                    const newLanguage = structuredClone($defaultLanguage);
                    newLanguage.Name = newName;
                    newLanguage.ShowEtymology = true;
                    Object.keys($Language.Lexicon).forEach(word => {
                        let baseWord = `${word}`;
                        if (usePronunciations) {
                            if (!$Language.Lexicon[word].pronunciations.hasOwnProperty(baseLect)) return;
                            else baseWord = $Language.Lexicon[word].pronunciations[baseLect].ipa;
                        }
                        const newWord = soundChange(baseWord);
                        newLanguage.Lexicon[newWord] = structuredClone($Language.Lexicon[word]);
                        
                        // Clean up the new entry
                        newLanguage.Lexicon[newWord].pronunciations = {General: {ipa: newWord, irregular: false}};
                        newLanguage.Lexicon[newWord].Senses.forEach(sense => {sense.lects = ['General']});
    
                        // SECTION Etymology
    
                        // Store the lexicon of the current language as a relative
                        newLanguage.Relatives[$Language.Name] = structuredClone($Language.Lexicon);
                        
                        // Create entries for each lexicon entry and codify the language name for existing entries
                        if ($Language.Etymologies[word]) {
                            newLanguage.Etymologies[word] = $Language.Etymologies[word];
                            newLanguage.Etymologies[word].source = $Language.Name;
                            newLanguage.Etymologies[word].descendants.forEach(descendant => {
                                if (descendant.source === '<< THIS LANGUAGE >>') 
                                    descendant.source = $Language.Name;
                            });
                        } else {
                            newLanguage.Etymologies[word] = {
                                descendants: [], 
                                source: $Language.Name
                            };
                        }
    
                        // Write an entry for the new word
                        newLanguage.Etymologies[newWord] = {
                            descendants: [ ],
                            source: '<< THIS LANGUAGE >>'
                        };
    
                        // Add the new word to the descendants of the old word
                        newLanguage.Etymologies[word].descendants.push({
                            name: newWord,
                            source: '<< THIS LANGUAGE >>' 
                        });
                    });
    
                    $docsEditor.destroy(); initializeDocs(false);
                    $Language = newLanguage;
    
                    saveFile();
                }, 333);
            }}
        >Save File and Evolve Lexicon</button>
    </div>
</div>
