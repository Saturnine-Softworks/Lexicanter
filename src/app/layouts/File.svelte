<script lang="ts">
    const fs = require('fs');
    const path = require('path');
    import { docsEditor, Language, selectedCategory, selectedTab, fileLoadIncrement, defaultLanguage, dbid, dbkey, CurrentLayouts } from '../stores';
    import type { OutputData } from '@editorjs/editorjs';
    import type * as Lexc from '../types';
    import { userData, showOpenDialog, saveFile, openLegacy, saveAs, importCSV, retrieveFromDatabase } from '../utils/files';
    import Draggable from '../components/Draggable.svelte';
    import { writeRomans } from '../utils/phonetics';
    import { initializeDocs } from '../utils/docs';
    import Evolver from '../components/Evolver.svelte';
    import { verify } from '../../db/database';
    import { defaultPanelPositions, defaultPanelSnap, defaultWindow } from '../utils/layouts';

    const vex = require('vex-js');

    function selectSaveLocation () {
        showOpenDialog({
            properties: ['openDirectory'],
        }, file_path => {
            if (file_path === undefined) {
                return;
            }
            $Language.SaveLocation = file_path[0];
        });
    }

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

    /**
     * Parses the contents of an opened .lexc file and loads the data into the app.
     * If the file is a legacy version, it is passed to the appropriate function.
     * @param {Object} contents - The contents of the opened file.
     */
    async function read_contents (contents: Lexc.Language) {
        if (typeof contents.Version === 'number' || contents.Version === '1.8.x') {
            vex.dialog.alert(` 
                The file you attempted to open was saved by an old version of Lexicanter (Version ~${contents.Version}), 
                which is no longer supported. Please contact the developer for assistance; the file is likely recoverable.
            `);
            return;
        }

        if (contents.Version === '1.9') {
            try { openLegacy[contents.Version](contents); }
            catch (err) {
                vex.dialog.alert(` 
                    The file you attempted to open was saved by an old version of Lexicanter (Version ~${contents.Version}), 
                    which is no longer supported. Please contact the developer for assistance; the file is likely recoverable.
                `);
            }
            return;
        }
        let errorMessage: string;
        try {
            // clear language data
            $Language = structuredClone($defaultLanguage);

            errorMessage = 'There was a problem loading the settings of the file.'
            $Language.CaseSensitive = contents.CaseSensitive;
            $Language.IgnoreDiacritics = contents.IgnoreDiacritics;
            $Language.HeaderTags = contents.HeaderTags;
            $Language.UseLects = contents.UseLects;
            $Language.ShowEtymology = contents.ShowEtymology;
            $Language.ShowInflection = contents.ShowInflection;
            // check for the existence of properties so that 'undefined' is not assigned
            if (contents.hasOwnProperty('ShowPronunciation')) {
                $Language.ShowPronunciation = contents.ShowPronunciation;
            }
            if (contents.hasOwnProperty('OrderByDate')) {
                $Language.OrderByDate = contents.OrderByDate;
            } else {
                for (let word in contents.Lexicon) {
                    contents.Lexicon[word].Timestamp = Date.now();
                }
            }
            if (contents.hasOwnProperty('SaveLocation')) {
                $Language.SaveLocation = contents.SaveLocation;
            }
            if (contents.hasOwnProperty('FileVersion')) {
                $Language.FileVersion = contents.FileVersion
            }

            errorMessage = 'There was a problem loading the alphabet from the file.'
            $Language.Alphabet = contents.Alphabet;
            if (contents.hasOwnProperty('ShowAlphabet'))
                $Language.ShowAlphabet = contents.ShowAlphabet;

            errorMessage = 'There was a problem loading the file’s lexicon data.'
            $Language.Lexicon = contents.Lexicon;
            $Language.Lects = contents.Lects;
            
            errorMessage = 'There was a problem loading the file’s phrasebook data.'
            $Language.Phrasebook = contents.Phrasebook;
            $selectedCategory = Object.keys($Language.Phrasebook)[0];
            if (contents.hasOwnProperty('ShowPronunciation')) {
                $Language.ShowPhrasebook = contents.ShowPhrasebook;
            } else {
                // default to true if the setting is not present, because older versions always showed the phrasebook tab
                $Language.ShowPhrasebook = true;
            }

            errorMessage = 'There was a problem loading the file’s documentation data.'
            let docs_data: OutputData = contents.Docs;
            $Language.Docs = docs_data;
            $docsEditor?.destroy();
            initializeDocs(docs_data);

            errorMessage = 'There was a problem loading the pronunciations rules from the file.'
            $Language.Pronunciations = contents.Pronunciations; 
            $Language.Lects.forEach(writeRomans);

            errorMessage = 'There was a problem loading the orthography data from the file.'
            if (contents.hasOwnProperty('Orthographies')) {
                $Language.Orthographies = contents.Orthographies;
                $Language.ShowOrthography = contents.ShowOrthography;

                if (!$Language.Orthographies[0].hasOwnProperty('graphemy')) {
                    $Language.Orthographies.forEach((_, i) => {
                        $Language.Orthographies[i] = {
                            ...$Language.Orthographies[i],
                            graphemy: false,
                        }
                    });
                }
            }
            
            errorMessage = 'There was a problem loading the phonotactics rules from the file.'
            $Language.Phonotactics = contents.Phonotactics;

            errorMessage = 'There was a problem loading the inflection rules from the file.'
            let inflections = contents.Inflections;
            if (!contents.Inflections.some(inflection => inflection.categories)) 
                inflections.forEach(inflection => inflection.categories = '');
            $Language.Inflections = contents.Inflections;

            errorMessage = 'There was a problem loading the etymology data from the file.'
            $Language.Etymologies = contents.Etymologies;

            errorMessage = 'There was a problem loading the advanced phonotactics.';
            if (contents.hasOwnProperty('AdvancedPhonotactics')) {
                $Language.UseAdvancedPhonotactics = contents.UseAdvancedPhonotactics;
                // Constructs and Illegals fields were added at the same time in 2.1.13 - only need to check for one to know if both exist
                // REVIEW - This could also be achieved by checking if the file version is 2.1.13 or higher, which would require a Semantic Versioning parser.
                //          Could be worth finding a SemVer parser.
                if (!contents.AdvancedPhonotactics.hasOwnProperty('Constructs')) {
                    contents.AdvancedPhonotactics.Constructs = [{enabled:true, structures:''}];
                    contents.AdvancedPhonotactics.Illegals = [];
                }
                $Language.AdvancedPhonotactics = contents.AdvancedPhonotactics;
            }

            errorMessage = 'There was a problem loading the file’s theme.'
            if (contents.hasOwnProperty('FileTheme')) {
                $Language.FileTheme = contents.FileTheme;
            }

            errorMessage = 'There was a problem loading the layout.'
            if (contents.hasOwnProperty('Layouts')) {
                if (!contents.Layouts.hasOwnProperty('showZ')) contents.Layouts.showZ = false // setting added in later patch
                window.resizeTo(contents.Layouts.window.width, contents.Layouts.window.height);
                setTimeout(() => { 
                    // the window does not resize instantly, so waiting half a beat before 
                    // setting the panel settings ensures the window can fit everything
                    $Language.Layouts = contents.Layouts;
                    $CurrentLayouts = contents.Layouts;
                    $selectedTab = $CurrentLayouts.opentabs;
                }, 50);
            } else {
                window.resizeTo(defaultWindow().width, defaultWindow().height);
                $Language.Layouts = {
                    tabmode: "switch",
                    opentabs: [7],
                    window: defaultWindow(),
                    positions: defaultPanelPositions(),
                    snapping: defaultPanelSnap(),
                    showZ: false,
                };
                $selectedTab = [7];
                $CurrentLayouts = $Language.Layouts;
            }

            errorMessage = 'There was a problem syncing with the database.'
            if (contents.hasOwnProperty('UploadToDatabase')) {
                $Language.UploadToDatabase = contents.UploadToDatabase
                if ($Language.UploadToDatabase) {
                    if ($dbid === '' || $dbkey === '') {
                        vex.dialog.alert('The file you opened has database syncing turned on, but your user ID or account key are blank.');
                        return;
                    }
                    verify($dbid, $dbkey).then(verified => {
                        if (verified==='no connection') {
                            vex.dialog.alert('This file has cloud sync enabled, but you are not connected to the internet.');
                        } else if (verified) {
                            retrieveFromDatabase(contents.Name).then(queryResult => {
                                if (queryResult !== false) {
                                    if (queryResult.FileVersion === undefined) {
                                        vex.dialog.confirm({
                                            message: `The file in the database has no FileVersion number. Would you like to overwrite it with your local version?`,
                                            yesText: 'Upload Local Version',
                                            callback: (proceed: boolean) => {
                                                if (proceed) {
                                                    saveFile();
                                                    vex.dialog.alert('Saved and uploaded local file.')
                                                }
                                            }
                                        })
                                    } else if ( parseInt($Language.FileVersion, 36) < parseInt(queryResult.FileVersion, 36) ) {
                                        vex.dialog.confirm({
                                            message: `Detected a newer version of the file in the database (local: ${$Language.FileVersion} | online: ${queryResult.FileVersion}). Would you like to download the changes?`,
                                            yesText: 'Download Changes',
                                            callback: (proceed: boolean, download = queryResult) => {
                                                if (proceed) {
                                                    $Language = download;
                                                    initializeDocs(download.Docs);
                                                    saveFile();
                                                    vex.dialog.alert('Downloaded changes and saved.')
                                                } else {
                                                    vex.dialog.alert('Did not download changes. If you change your mind, click the Sync From Database button in the Settings tab. This will overwrite local changes.')
                                                }
                                            }
                                        })
                                    }
                                } else {
                                    vex.dialog.alert('No file of this name was found in your ownership in the database.');
                                }
                            });
                        } else {
                            vex.dialog.alert('One or both of your User ID and Key is invalid.');
                        }
                    });
                }
            }

        } catch (err) {

            vex.dialog.alert('An error has occurred and has been logged to the console. Please contact the developer for assistance.');
            console.error(err);
            console.log(contents);
        } finally {
            $fileLoadIncrement++;
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
                        document.querySelectorAll('.planet').forEach((planet: Element) => {
                            (planet as HTMLElement).style.animationPlayState = 'paused';
                        });
                        loading_message = 'No file selected.';
                        window.setTimeout(() => {
                            loading_message = '';
                        }, 5000);
                        return;
                    }
                    fs.readFile(file_path[0], 'utf8', (err: NodeJS.ErrnoException, data: string) => {
                        if (err) {
                            console.log(err);
                            window.alert(
                                'There was an issue loading your file. Please contact the developer.'
                                );
                            console.error(err);
                            document.querySelectorAll('.planet').forEach((planet: Element) => {
                                // loading anim stop
                                (planet as HTMLElement).style.animationPlayState = 'paused';
                            });
                            loading_message = 'Couldn’t open file.';
                            window.setTimeout(() => { loading_message = ''; }, 5000);
                            return;
                        }
                        contents = JSON.parse(data);
                        read_contents(contents);
                        $Language.Name = path.basename(file_path[0], '.lexc');
                        document.querySelectorAll('.planet').forEach((planet: Element) => {
                            // loading anim stop
                            (planet as HTMLElement).style.animationPlayState = 'paused';
                        });
                        loading_message = 'Done!';
                        window.setTimeout(() => { loading_message = ''; }, 5000);
                    });
                }
            );
        };
        document.querySelectorAll('.planet').forEach((planet: Element) => {
            // loading anim start
            (planet as HTMLElement).style.animationPlayState = 'running';
        });
        loading_message = 'Loading...';
        await userData(user_path => {
            if (!fs.existsSync(`${user_path}${path.sep}Lexicons${path.sep}`)) {
                fs.mkdir(`${user_path}${path.sep}Lexicons${path.sep}`, () => {
                    console.log(`Created the 'Lexicons' folder in the user data folder at '${user_path}'.`);
                    dialog(user_path);
                });
            } else { dialog(user_path); }
        });
    }
    
    /**
     * Allows the user to import a .lexc file from their computer.
     */
    async function importFile() {
        document.querySelectorAll('.planet').forEach((planet: Element) => {
            (planet as HTMLElement).style.animationPlayState = 'running';
        });
        loading_message = 'Loading...';

        let [file_handle] = await window.showOpenFilePicker();
        await file_handle.requestPermission({ mode: 'read' });
        let file = await file_handle.getFile();
        if (!file.name.includes('.lexc')) {
            window.alert('The selected file was not a .lexc file.');
            document.querySelectorAll('.planet').forEach((planet: Element) => {
                (planet as HTMLElement).style.animationPlayState = 'paused';
            });
            loading_message = 'Incorrect file type.';
            window.setTimeout(() => { loading_message = ''; }, 5000);
            return;
        }
        let string_contents = await file.text();
        let contents = JSON.parse(string_contents);
        read_contents(contents);
        $Language.Name = file.name.split('.')[0];

        document.querySelectorAll('.planet').forEach((planet: Element) => {
            (planet as HTMLElement).style.animationPlayState = 'paused';
        });
        loading_message = 'Done!';
        window.setTimeout(() => { loading_message = ''; }, 5000);
    }

</script>

<!-- File Tab -->
<div class=tab-pane>
    {#if $selectedTab.includes(7)}
        <Draggable panel=files>
            <div class="glasspane container" style=overflow-y:auto>
                <label for=file-name>Language Name</label>
                <input type=text id=file-name bind:value={$Language.Name}/>
                <br>
                <div class='narrow row' style='max-width: 600px;'>
                    <div class=column>
                        <button on:click={saveFile} class="hover-highlight hover-shadow">Save…</button>
                        <button on:click={openFile} class="hover-highlight hover-shadow">Open…</button>
                        <p class="info">Save your lexicon or open a previously saved one.</p>
                    </div>
                    <div class=column>
                        <div class=milkyWay>
                            <!-- Loader -->
                            <div class=sun></div>
                            {#each ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as planet}
                                    <div class="planet {planet}"></div>
                            {/each}
                        </div>
                        <p>{loading_message}</p>
                    </div>
                    <div class=column>
                        <button on:click={saveAs.lexc} class='hover-highlight hover-shadow'>Export…</button>
                        <button on:click={importFile} class='hover-highlight hover-shadow'>Import…</button>
                        <p class=info>Export and import your own copies of the .lexc file.</p>
                    </div>
                </div>
                <div class=narrow>
                    <label for=save-locations>Secondary Save Locations</label>
                    <button id=save-locations class='hover-highlight hover-shadow' on:click={selectSaveLocation}>Choose Location…</button>
                    <p>Selected location: <u>{$Language.SaveLocation || 'None'}<u></p>
                </div>
                <br>
                <hr>
                <br>
                <p>Export to Other Formats</p>
                <div class="row narrow" style='max-width: 500px;'>
                    <div class="column">
                        <button on:click={saveAs.txt} class="hover-highlight hover-shadow">Plain Text<br>Lexicon Only</button>
                        <button on:click={saveAs.md} class="hover-highlight hover-shadow">Markdown<br>Lexicon Only</button>
                    </div>
                    <div class="column">
                        <button on:click={saveAs.html.lexicon} class="hover-highlight hover-shadow">HTML<br>Lexicon Only</button>
                        <button on:click={saveAs.html.all} class="hover-highlight hover-shadow">HTML<br>Lexicon + Docs</button>
                        <button on:click={saveAs.html.docs} class="hover-highlight hover-shadow">HTML<br>Documentation</button>
                    </div>
                    <div class="column">
                        <button on:click={saveAs.csv} class="hover-highlight hover-shadow">CSV<br>Lexicon Only</button>
                        <button on:click={saveAs.json} class="hover-highlight hover-shadow">JSON<br>Entire File</button>
                    </div>
                </div>
                <br>
                <hr>
                <br>
                <p>Lexicon Header Tags</p>
                <p class='info'>
                    Entries with these tags will be sorted separately at the top of the lexicon.
                </p>
                <div class=narrow>
                    <textarea bind:value={$Language.HeaderTags}></textarea>
                </div>
                <br>
                <hr>
                <br>
                <p>Evolve Language</p>
                <p class='info narrow'>
                    Evolve the current lexicon by applying a series of sound changes, and save as a new file.
                </p><br>
                <Evolver/>
                <br>
                <hr>
                <br>
                <p>Import Lexicon from CSV</p>
                <div class="narrow" style='max-width: 500px;'>
                    <div class="row">
                        <div class="column">
                            <label>Words Column
                                <input type="number" bind:value={csv.words}/>
                            </label>
                        </div>
                        {#if csv.pronunciations_bool}
                        <div class="column">
                            <label>Pronunciations Column
                                <input type="number" bind:value={csv.pronunciations}/>
                            </label>
                        </div>
                        {/if}
                        <div class="column">
                            <label>Definitions Column
                                <input type="number" bind:value={csv.definitions}/>
                            </label>
                        </div>
                        {#if csv.tags_bool}
                        <div class="column">
                            <label>Tags Column
                                <input type="number" bind:value={csv.tags}/>
                            </label>
                        </div>
                        {/if}
                    </div>
                    <div class="row">
                        <div class="column">
                            <label>Include Pronunciations
                                <input type="checkbox" bind:checked={csv.pronunciations_bool}/>
                            </label>
                        </div>
                        <div class="column">
                            <label>Include Tags
                                <input type="checkbox" bind:checked={csv.tags_bool}/>
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
                <br><br><br>
            </div>
        </Draggable>
    {/if}
</div>
