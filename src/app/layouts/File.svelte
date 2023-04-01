<script lang="ts">
    const fs = require('fs');
    const path = require('path');
    import { docsEditor, Language, selectedCategory, fileLoadIncrement } from '../stores';
    import type { OutputData } from '@editorjs/editorjs';
    import { userData, showOpenDialog, saveFile, openLegacy, saveAs, importCSV } from '../utils/files';
    import { writeRomans } from '../utils/phonetics';
    import { initializeDocs } from '../utils/docs';
    import * as diagnostics from '../utils/diagnostics';
    const vex = require('vex-js');
    $: loading_message = '';
    let csv = {
        headers: true,
        words: 1,
        pronunciations_bool: false,
        pronunciations: 2,
        definitions: 3,
        tags_bool: false,
        tags: 4,
    }
    $: csv;
    let oldPattern = ''; let newPattern = '';

    /**
     * Parses the contents of an opened .lexc file and loads the data into the app.
     * If the file is a legacy version, it is passed to the appropriate function.
     * @param {Object} contents - The contents of the opened file.
     */
    function read_contents (contents) {
        if (typeof contents.Version === 'number' || contents.Version === '1.8.x') {
            try { openLegacy[contents.Version](contents); }
            catch (err) {
                // TODO: window.alert() freezes text inputs on Windows computers and all instances need to be replaced with a custom dialog.
                window.alert(` 
                    The file you attempted to open was saved by an old version of Lexicanter (Version ~${contents.Version}), 
                    which is no longer supported. Please contact the developer for assistance; the file is likely recoverable.
                `);
            }
            return;
        }
        let errorMessage: string;
        try {
            errorMessage = 'There was a problem loading the settings of the file.'
            $Language.CaseSensitive = contents.CaseSensitive;
            $Language.IgnoreDiacritics = contents.IgnoreDiacritics;
            $Language.HeaderTags = contents.HeaderTags;
            $Language.UseLects = contents.UseLects;
            $Language.ShowEtymology = contents.ShowEtymology;
            $Language.ShowInflection = contents.ShowInflection;

            errorMessage = 'There was a problem loading the alphabet from the file.'
            $Language.Alphabet = contents.Alphabet;

            errorMessage = 'There was a problem loading the file’s lexicon data.'
            $Language.Lexicon = contents.Lexicon;
            $Language.Lects = contents.Lects;
            
            errorMessage = 'There was a problem loading the file’s phrasebook data.'
            $Language.Phrasebook = contents.Phrasebook;
            $selectedCategory = Object.keys($Language.Phrasebook)[0]; 

            errorMessage = 'There was a problem loading the file’s documentation data.'
            let docs_data: OutputData = contents.Docs;
            $Language.Docs = docs_data;
            $docsEditor.destroy();
            initializeDocs(docs_data);

            errorMessage = 'There was a problem loading the pronunciations rules from the file.'
            $Language.Pronunciations = contents.Pronunciations; 
            $Language.Lects.forEach(writeRomans);

            errorMessage = 'There was a problem loading the phonotactics rules from the file.'
            $Language.Phonotactics = contents.Phonotactics;

            errorMessage = 'There was a problem loading the inflection rules from the file.'
            let inflections = contents.Inflections;
            if (!contents.Inflections.categories) inflections.categories = '';
            $Language.Inflections = contents.Inflections;

            errorMessage = 'There was a problem loading the etymology data from the file.'
            $Language.Etymologies = contents.Etymologies;
        } catch (err) {
            vex.dialog.alert(errorMessage + ' Please contact the developer for assistance.');
            diagnostics.logError(errorMessage, err);
            diagnostics.debug.logObj(contents, 'File Contents');
        } finally {
            $fileLoadIncrement++;
            diagnostics.logAction(`Opened and read the contents of '${$Language.Name}'.'`);
        }
    }
    
    /**
     * Opens a .lexc file from the user app data folder.
     */
    async function openFile () {
        let contents;
        let dialog = (user_path: string) => {
            showOpenDialog(
                {
                    title: 'Open Lexicon',
                    defaultPath: `${user_path}${path.sep}Lexicons${path.sep}`,
                    properties: ['openFile'],
                },
                file_path => {
                    if (file_path === undefined) {
                        // stop orbit animation
                        document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
                            planet.style.animationPlayState = 'paused';
                        });
                        loading_message = 'No file selected.';
                        window.setTimeout(() => {
                            loading_message = '';
                        }, 5000);
                        return;
                    }
                    fs.readFile(file_path[0], 'utf8', (err, data: string) => {
                        if (err) {
                            console.log(err);
                            window.alert(
                                'There was an issue loading your file. Please contact the developer.'
                                );
                            diagnostics.logError('Attempted to open a file.', err);
                            document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
                                // loading anim stop
                                planet.style.animationPlayState = 'paused';
                            });
                            loading_message = 'Couldn’t open file.';
                            window.setTimeout(() => { loading_message = ''; }, 5000);
                            return;
                        }
                        contents = JSON.parse(data);
                        read_contents(contents);
                        $Language.Name = path.basename(file_path[0], '.lexc');
                        document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
                            // loading anim stop
                            planet.style.animationPlayState = 'paused';
                        });
                        loading_message = 'Done!';
                        window.setTimeout(() => { loading_message = ''; }, 5000);
                    });
                }
            );
        };
        document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
            // loading anim start
            planet.style.animationPlayState = 'running';
        });
        loading_message = 'Loading...';
        await userData(user_path => {
            if (!fs.existsSync(`${user_path}${path.sep}Lexicons${path.sep}`)) {
                fs.mkdir(`${user_path}${path.sep}Lexicons${path.sep}`, () => {
                    diagnostics.logAction(`Created the 'Lexicons' folder in the user data folder at '${user_path}'.`);
                    dialog(user_path);
                });
            } else { dialog(user_path); }
        });
    }
    
    /**
     * Allows the user to import a .lexc file from their computer.
     */
    async function importFile() {
        document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
            planet.style.animationPlayState = 'running';
        });
        loading_message = 'Loading...';

        let [file_handle] = await window.showOpenFilePicker();
        await file_handle.requestPermission({ mode: 'read' });
        let file = await file_handle.getFile();
        if (!file.name.includes('.lexc')) {
            window.alert('The selected file was not a .lexc file.');
            document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
                planet.style.animationPlayState = 'paused';
            });
            loading_message = 'Incorrect file type.';
            window.setTimeout(() => { loading_message = ''; }, 5000);
            return;
        }
        let string_contents = await file.text();
        let contents = JSON.parse(string_contents);
        read_contents(contents);
        $Language.Name = file.name.split('.')[0];

        document.querySelectorAll('.planet').forEach((planet: HTMLElement) => {
            planet.style.animationPlayState = 'paused';
        });
        loading_message = 'Done!';
        window.setTimeout(() => { loading_message = ''; }, 5000);
    }

    /**
     * This function is used to change the a given orthograph
     * to a new one, throughout the lexicon. 
     */
    function change_orthography() {
        oldPattern = oldPattern.replace(/\^/g, '÷');
        newPattern = newPattern.replace(/\^/g, '÷');
        for (let word in $Language.Lexicon) {
            let w = '÷' + word + '÷';
            if (w.includes($Language.CaseSensitive? oldPattern : oldPattern.toLowerCase())) {
                let r = new RegExp(oldPattern, $Language.CaseSensitive ? 'g' : 'gi');
                w = w.replace(r, newPattern);
                w = w.replace(/÷/gi, '');
                if (w in $Language.Lexicon) {
                    // if the new word exists, conjoin the definitions
                    $Language.Lexicon[w][1] = $Language.Lexicon[w][1] + '\n' + $Language.Lexicon[word][1];
                } else {
                    $Language.Lexicon[w] = $Language.Lexicon[word];
                }
                delete $Language.Lexicon[word];
            }
        }
        $Language.Lects.forEach(writeRomans); 
        $Language = {...$Language};
        oldPattern = ''; newPattern = '';
    }

</script>
<!-- File Tab -->
<div class="tab-pane">
    <div class="row" style="height: 95vh">
        <div class="column container" style="overflow-y:auto">
            <p>Document</p>
            <label for="file-name">Name</label>
            <input type="text" id="file-name" bind:value={$Language.Name}/>
            <br>
            <div class="narrow row">
                <div class="column">
                    <button on:click={saveFile} class="hover-highlight hover-shadow">Save…</button>
                    <button on:click={openFile} class="hover-highlight hover-shadow">Open…</button>
                    <p class="info">Save your lexicon or open a previously saved one.</p>
                </div>
                <div class="column"> 
                    <div class="milkyWay">
                        <!-- Loader -->
                        <div class="sun"></div>
                        {#each ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as planet}
                             <div class="planet {planet}"></div>
                        {/each}
                    </div>
                    <p>{loading_message}</p>
                </div>
                <div class="column">
                    <button on:click={saveAs.lexc} class="hover-highlight hover-shadow">Export…</button>
                    <button on:click={importFile} class="hover-highlight hover-shadow">Import…</button>
                    <p class="info">Export and import your own copies of the lexicon file.</p>
                </div>
            </div>
            <br>
            <p>Lexicon Header Tags</p>
            <div class="narrow">
                <textarea bind:value={$Language.HeaderTags}></textarea>
                <p class="info">
                    Entries with these tags will be sorted separately at the top of the lexicon.
                </p>
            </div>
            <br>
            <button class="hover-highlight hover-shadow"
                on:click={() => window.open('index.html', '_blank', 'height=900, width=900')}>Open New Window</button>
            <br>
            <p>Change Pronunciations & Orthography</p>
            <div class="narrow">
                <label for="ortho-pattern">Orthography Pattern</label>
                <input id="ortho-pattern" type="text" bind:value={oldPattern}/>
                <label for="new-pattern">Replace With</label>
                <input id="new-pattern" type="text" bind:value={newPattern}/>
                <button class="hover-highlight hover-shadow" on:click={change_orthography}>Commit Change</button>
            </div>
            <br>
            <p>Export Lexicon</p>
            <p>HTML</p>
            <div class="row narrow">
                <div class="column">
                    <button on:click={saveAs.html.lexicon} class="hover-highlight hover-shadow">Lexicon Only</button>
                </div>
                <div class="column">
                    <button on:click={saveAs.html.all} class="hover-highlight hover-shadow">Lexicon & Docs</button>
                </div>
                <div class="column">
                    <button on:click={saveAs.html.docs} class="hover-highlight hover-shadow">Documentation Only</button>
                </div>
            </div>
            <button on:click={saveAs.txt} class="hover-highlight hover-shadow">Text File</button>
            <button on:click={saveAs.csv} class="hover-highlight hover-shadow">CSV</button>
            <button on:click={saveAs.json} class="hover-highlight hover-shadow">JSON</button>
            <br>
            <p>Import Lexicon from CSV</p>
            <div class="narrow">
                <div class="row">
                    <div class="column">
                        <label>Words Column
                            <input type="number" bind:value={csv.words}/>
                        </label>
                    </div>
                    <div class="column">
                        <label>Pronunciations Column
                            <input type="checkbox" bind:value={csv.pronunciations_bool}/>
                            {#if csv.pronunciations_bool}
                                <input type="number" bind:value={csv.pronunciations}/>
                            {/if}
                        </label>
                    </div>
                    <div class="column">
                        <label>Definitions Column
                            <input type="number" bind:value={csv.definitions}/>
                        </label>
                    </div>
                    <div class="column">
                        <label>Tags Column
                            <input type="checkbox" bind:value={csv.tags_bool}/>
                            {#if csv.tags_bool}
                                <input type="number" bind:value={csv.tags}/>
                            {/if}
                        </label>
                    </div>

                </div>
            </div>
            <label for="row-one-is-labels">First Row Is Column Labels</label>
            <input type="checkbox" id="row-one-is-labels" bind:checked={csv.headers}/>
            <button on:click={() => 
                importCSV(
                    csv.headers, 
                    csv.words, 
                    csv.definitions, 
                    csv.pronunciations_bool? csv.pronunciations : false,
                    csv.tags_bool? csv.tags : false
                )
            } class="hover-highlight hover-shadow">Import</button>
            <br><br>
        </div>
    </div>
</div>
