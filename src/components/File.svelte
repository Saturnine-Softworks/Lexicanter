<script lang="ts">
    const fs = require('fs');
    const path = require('path');
    import { file_name, lexicon, phrasebook, alphabet, romans_input, 
        Docs, case_sensitive, ignore_diacritics, selected_category,
        onsets, medials, codas, vowels, illegals, header_tags
    } from '../stores.js';
    import { userData, showOpenDialog, save_file, openLegacy, saveAs, import_csv } from '../scripts/files.js';
    import { writeRomans } from '../scripts/phonetics.js';
    import { initialize_docs } from '../scripts/docs.js';
    $: loading_message = '';
    let csv_headers = true; let csv_words = 2; let csv_definitions = 3;
    let old_pattern = ''; let new_pattern = '';

    /**
     * Parses the contents of an opened .lexc file and loads the data into the app.
     * If the file is a legacy version, it is passed to the appropriate function.
     * @param {Object} contents - The contents of the opened file.
     */
    function read_contents (contents) {
        if (contents.Version < 2) {
            try { openLegacy[contents.Version](contents); }
            catch (err) {
                window.alert(`
                    The file you attempted to open was saved by an old version of Lexicanter (Version ~${contents.Version}), 
                    which is no longer supported. Please contact the developer for assistance; the file is likely recoverable.
                `);
            }
            return;
        }
        try {
            loading_message = 'Loading settings...';
            $case_sensitive = contents.CaseSensitive;
            $ignore_diacritics = contents.IgnoreDiacritics;
            $header_tags = contents.HeaderTags;
            loading_message = 'Loading alphabet...';
            $alphabet = contents.Alphabet;
            loading_message = 'Loading lexicon...';
            $lexicon = contents.Lexicon;
            loading_message = 'Loading phrasebook...';
            $phrasebook = contents.Phrasebook;
            loading_message = 'Loading documentation...';
            let docs_data = contents.Docs;
            $Docs.destroy();
            initialize_docs(docs_data);
            $selected_category = Object.keys($phrasebook)[0]; 
            loading_message = 'Loading romanizations...';
            $romans_input = contents.Romanization; writeRomans();
            loading_message = 'Loading phonotactics...';
            $onsets = contents.Phonotactics.Onsets.join(' ');
            $medials = contents.Phonotactics.Medials.join(' ');
            $codas = contents.Phonotactics.Codas.join(' ');
            $vowels = contents.Phonotactics.Vowels.join(' ');
            $illegals = contents.Phonotactics.Illegals.join(' ');
        } catch (err) {
            window.alert(
                'There was a problem loading the contents of the file. Please contact the developer for assistance.'
            );
            console.log(err);
        }
    }
    
    /**
     * Opens a .lexc file from the user app data folder.
     */
    async function open_file () {
        let contents;
        let dialog = user_path => {
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
                    fs.readFile(file_path[0], 'utf8', (err, data) => {
                        if (err) {
                            console.log(err);
                            window.alert(
                                'There was an issue loading your file. Please contact the developer.'
                            );
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
                        $file_name = path.basename(file_path[0], '.lexc');
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
                    dialog(user_path);
                });
            } else { dialog(user_path); }
        });
    }
    
    /**
     * Allows the user to import a .lexc file from their computer.
     */
    async function import_file() {
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
        $file_name = file.name.split('.')[0];

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
        old_pattern = old_pattern.replace(/\^/g, '÷');
        new_pattern = new_pattern.replace(/\^/g, '÷');
        for (let word in $lexicon) {
            let w = '÷' + word + '÷';
            if (w.includes($case_sensitive? old_pattern : old_pattern.toLowerCase())) {
                let r = new RegExp(old_pattern, $case_sensitive ? 'g' : 'gi');
                w = w.replace(r, new_pattern);
                w = w.replace(/÷/gi, '');
                if (w in $lexicon) {
                    // if the new word exists, conjoin the definitions
                    $lexicon[w][1] = $lexicon[w][1] + '\n' + $lexicon[word][1];
                } else {
                    $lexicon[w] = $lexicon[word];
                }
                delete $lexicon[word];
            }
        }
        writeRomans(); $lexicon = $lexicon;
        old_pattern = ''; new_pattern = '';
    }

</script>
<!-- File Tab -->
<div class="tab-pane">
    <div class="row" style="height: 95vh">
        <div class="column container" style="overflow-y:auto">
            <p>Document</p>
            <label for="file-name">Name</label>
            <input type="text" id="file-name" bind:value={$file_name}/>
            <br>
            <div class="narrow row">
                <div class="column">
                    <button on:click={save_file} class="hover-highlight hover-shadow">Save…</button>
                    <button on:click={open_file} class="hover-highlight hover-shadow">Open…</button>
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
                    <button on:click={import_file} class="hover-highlight hover-shadow">Import…</button>
                    <p class="info">Export and import your own copies of the lexicon file.</p>
                </div>
            </div>
            <br>
            <p>Lexicon Header Tags</p>
            <div class="narrow">
                <textarea bind:value={$header_tags}></textarea>
                <label for="header-tags" class="info">
                    Entries with these tags will be sorted separately at the top of the lexicon.
                </label>
            </div>
            <br>
            <button class="hover-highlight hover-shadow"
                on:click={() => window.open('index.html', '_blank', 'height=900, width=900')}>Open New Window</button>
            <br>
            <p>Change Pronunciations & Orthography</p>
            <div class="narrow">
                <label for="ortho-pattern">Orthography Pattern</label>
                <input id="ortho-pattern" type="text" bind:value={old_pattern}/>
                <label for="new-pattern">Replace With</label>
                <input id="new-pattern" type="text" bind:value={new_pattern}/>
                <button class="hover-highlight hover-shadow" on:click={change_orthography}>Commit Change</button>
            </div>
            <br>
            <p>Export Lexicon</p>
            <p>HTML</p>
            <div class="row narrow">
                <div class="column">
                    <button on:click={saveAs.html.all} class="hover-highlight hover-shadow">Everything</button>
                </div>
                <div class="column">
                    <button on:click={saveAs.html.docs} class="hover-highlight hover-shadow">Docs Only</button>
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
                        <label for="word-column">Words Column</label>
                        <input type="number" id="word-column" bind:value={csv_words}/>
                    </div>
                    <div class="column">
                        <label for="def-column">Definitions Column</label>
                        <input type="number" id="def-column" bind:value={csv_definitions}/>
                    </div>
                </div>
            </div>
            <label for="row-one-is-labels">First Row Is Column Labels</label>
            <input type="checkbox" id="row-one-is-labels" bind:checked={csv_headers}/>
            <button on:click={() => import_csv(csv_headers, csv_words, csv_definitions)} class="hover-highlight hover-shadow">Import</button>
            <br><br>
        </div>
    </div>
</div>
