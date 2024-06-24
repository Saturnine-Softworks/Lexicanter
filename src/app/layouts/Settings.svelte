<script lang="ts">
    import { theme, autosave, pronunciations, wordInput, dbid, dbkey, fileLoadIncrement, docsEditor } from '../stores';
    import { userData, saveFile, showOpenDialog, retrieveFromDatabase } from '../utils/files';
    import { Language } from '../stores';
    import type * as Lexc from '../types';
    const fs = require('fs');
    const path = require('path');
    const vex = require('vex-js');
    import { debug, logAction } from '../utils/diagnostics';
    import { get_pronunciation } from '../utils/phonetics';
    import TagSelector from '../components/TagSelector.svelte';
    import { verifyHash } from '../utils/verification';
    import { initializeDocs } from '../utils/docs';

    let tag: string = '';
    let onlineFileVersion: string = '';
    let localFileVersion: string = $Language.FileVersion;
    async function getOnlineFileVersion() {
        if (verifyHash($dbid, $dbkey)) {
            let file = await retrieveFromDatabase();
            if (file) {
                return file.FileVersion;
            } else return null;
        }
    }
    async function setFileVersions() {
        onlineFileVersion = await getOnlineFileVersion();
        localFileVersion = $Language.FileVersion;
    }
    $: $fileLoadIncrement, setFileVersions();

    userData(user_path => {
        let settings = {
            autosave: true,
            theme: 'styles/dark.css',
            dbid: '',
            dbkey: '',
        }
        
        // This block of code is responsible for managing user settings. It first checks if a 'settings' file exists.
        // If it doesn't, it creates one and sets up default settings, including 'autosave' and 'theme'.
        // It also checks for 'autosave_pref.txt' and 'theme.txt' files to import settings from, if they exist.
        // After setting up, it writes the settings to a 'settings' file in JSON format.
        // If the 'settings' directory does exist, it reads the 'settings' file and imports the settings from there.
        if (!fs.existsSync(user_path + path.sep + 'settings.json')) {
            if (fs.existsSync(user_path + path.sep + 'autosave_pref.txt')) {
                settings.autosave = fs.readFileSync(user_path + path.sep + 'autosave_pref.txt', 'utf8') === 'true';
                $autosave = fs.readFileSync(user_path + path.sep + 'autosave_pref.txt', 'utf8') === 'true';
                fs.unlinkSync(user_path + path.sep + 'autosave_pref.txt');
            } else {
                settings.autosave = true;
            }
            fs.writeFileSync(user_path + path.sep + 'settings.json', 'styles/dark.css');

            if (fs.existsSync(user_path + path.sep + 'theme.txt')) {
                settings.theme = fs.readFileSync(user_path + path.sep + 'theme.txt', 'utf8')
                    .readFileSync(user_path + path.sep + 'theme.txt', 'utf8')
                    .toString();
                $theme = settings.theme;
                fs.unlinkSync(user_path + path.sep + 'theme.txt');
            } else {
                settings.theme = 'styles/dark.css';
            }
            $dbid = ''; $dbkey = '';
            fs.writeFileSync(user_path + path.sep + 'settings.json', JSON.stringify(settings, null, 4));
        } else {
            settings = JSON.parse(fs.readFileSync(user_path + path.sep + 'settings.json', 'utf8'));
            $autosave = settings.autosave;
            $theme = settings.theme;
            $dbid = settings.dbid; inputID = settings.dbid;
            $dbkey = settings.dbkey; inputKey = settings.dbkey;
        }

    });

    let inputID: string = '';
    let inputKey: string = '';
    $: disabledDatabase = !$Language.UploadToDatabase;
    function setDatabaseAccount () {
        if (inputID === '' || inputKey === '') {
            vex.dialog.alert('Please enter both your User ID and Key.');
            return;
        }
        if (verifyHash(inputID, inputKey)) {
            $dbid = inputID;
            $dbkey = inputKey;
            userData(user_path => {
                let settings = {
                    autosave: $autosave,
                    theme: $theme,
                    dbid: $dbid,
                    dbkey: $dbkey,
                }
                fs.writeFileSync(user_path + path.sep + 'settings.json', JSON.stringify(settings, null, 4));
            });
            vex.dialog.alert('Successfully verified your User ID and Key.');
        } else {
            vex.dialog.alert('One or both of the User ID and Key you entered is invalid.');
        }
    }

    async function syncFromDatabase () {
        if ($dbid === '' || $dbkey === '') {
            vex.dialog.alert('Please enter both your User ID and Key.');
            return;
        }
        if (verifyHash($dbid, $dbkey)) {
            const queryResult = await retrieveFromDatabase();
            if (queryResult !== false) {
                $Language = queryResult;
                $docsEditor.destroy();
                initializeDocs(queryResult.Docs);
                vex.dialog.alert('Successfully synced from database.');
            } else {
                vex.dialog.alert('No file of this name was found in your ownership in the database.');
            }
        } else {
            vex.dialog.alert('One or both of your User ID and Key is invalid.');
        }
    }

    /**
     * When the user changes selected theme from the dropdown in the Settings tab,
     * this function updates the preferred theme setting stored in user app data.
     */
    function change_theme() {
        userData(user_path => {
            let settings = {
                autosave: $autosave,
                theme: $theme,
                dbid: $dbid,
                dbkey: $dbkey,
            }
            fs.writeFileSync(user_path + path.sep + 'settings.json', JSON.stringify(settings, null, 4));
        });
    }

    /**
     * When the user clicks the "Choose Custom Theme" button in the Settings tab,
     * this function opens a file picker dialog and allows the user to select
     * a .css file. The file is then copied to the user's app data folder and 
     * the theme is updated to use the new file.
     */ 
    async function custom_theme() {
        let [file_handle] = await window.showOpenFilePicker();
        await file_handle.requestPermission({ mode: 'read' });
        let file = await file_handle.getFile();
        if (!file.name.includes('.css')) {
            vex.dialog.alert('The selected file was not a .css file.');
            return;
        }
        let contents = await file.text();
        let theme_path;
        await userData(user_path => {
            let themes_dir = user_path + path.sep + 'user_themes' + path.sep;
            if (!fs.existsSync(themes_dir)) {
                fs.mkdirSync(themes_dir);
            }
            theme_path = user_path + path.sep + 'user_themes' + path.sep + file.name;
            fs.writeFile(theme_path, contents, 'utf8', err => {
                if (err) throw err;
                $theme = theme_path;
            });
            fs.writeFile(user_path + path.sep + 'theme.txt', theme_path, err => {
                if (err) throw err;
            });
        });
    }

    /**
     * When the user changes the autosave setting in the Settings tab, this function
     * updates the preferred autosave setting stored in user app data.
     */ 
    function change_autosave_pref () {
        let settings = {
            autosave: $autosave,
            theme: $theme,
            dbid: $dbid,
            dbkey: $dbkey,
        }
        userData(user_path => {
            fs.writeFileSync(user_path + path.sep + 'settings.json', JSON.stringify(settings, null, 4));
        });
        if ($autosave) {
            var autosave_tracker = window.setInterval(
                saveFile,
                600000 /* 10 minutes */,
                false
            );
        } else {
            window.clearInterval(autosave_tracker);
        };
    };

    /**
     * Changes the name of a lect in the $Language.Lects array and updates
     * all instances of that lect in the file.
     * @param lect The name of the lect to be changed
     * @param name The new name of the lect
     * @param index The index of the lect in the $Language.Lects array
     */
    function changeLectName(lect: string, name: string, index: number): void {
        if (name === '') {
            vex.dialog.alert('The lect name cannot be blank.');
            return;
        }
        if (name === lect) {
            vex.dialog.alert('The lect name is unchanged.');
            return;
        }
        if ($Language.Lects.includes(name)) {
            vex.dialog.alert('A lect with that name already exists.');
            return;
        }
        $Language.Lects[index] = name;
        $Language.Lects = [...$Language.Lects];
        Object.keys($Language.Lexicon).forEach((word: string) => {
            if ($Language.Lexicon[word].pronunciations.hasOwnProperty(lect)) {
                $Language.Lexicon[word].pronunciations[name] = $Language.Lexicon[word].pronunciations[lect];
                delete $Language.Lexicon[word].pronunciations[lect];
            }
            $Language.Lexicon[word].Senses.forEach((sense: Lexc.Sense) => {
                if (sense.lects.includes(lect)) {
                    sense.lects.splice(sense.lects.indexOf(lect), 1);
                    sense.lects.push(name);
                }
            })
        });
        Object.keys($Language.Phrasebook).forEach(category => {
            Object.keys($Language.Phrasebook[category]).forEach((p: string, i: number) => {
                const phrase = $Language.Phrasebook[category][p];
                if (phrase.pronunciations.hasOwnProperty(lect)) {
                    phrase.pronunciations[name] = phrase.pronunciations[lect];
                    delete phrase.pronunciations[lect];
                }
                if (phrase.lects.includes(lect)) {
                    $Language.Phrasebook[category][p].lects.splice(phrase.lects.indexOf(lect), 1);
                    $Language.Phrasebook[category][p].lects.push(name);
                }
            })
        });

        $Language.Orthographies.forEach(ortho => {
            if (ortho.lect === lect) ortho.lect = name;
        });
        $Language.Pronunciations[name] = $Language.Pronunciations[lect];
        if ($pronunciations.hasOwnProperty(lect)) {
            $pronunciations[name] = $pronunciations[lect];
            delete $pronunciations[lect];
        }
        delete $Language.Pronunciations[lect];
    }

    function deleteLect (lect: string, i: number) {
        $Language.Lects.splice(i, 1);
        $Language.Lects = [...$Language.Lects];
        delete $Language.Pronunciations[lect];
        delete $pronunciations[lect]
        Object.keys($Language.Lexicon).forEach((word: string) => {
            if ($Language.Lexicon[word].pronunciations[lect]) {
                delete $Language.Lexicon[word].pronunciations[lect];
            }
            $Language.Lexicon[word].Senses.forEach((sense: Lexc.Sense, i: number) => {
                if (sense.lects.includes(lect)) {
                    sense.lects.splice(sense.lects.indexOf(lect), 1);
                }
                if (!sense.lects) {
                    $Language.Lexicon[word].Senses.splice(i, 1);
                }
            })
        });
        Object.keys($Language.Phrasebook).forEach(category => {
            Object.keys($Language.Phrasebook[category]).forEach((p: string, i: number) => {
                const phrase = $Language.Phrasebook[category][p];
                if (phrase.pronunciations[lect]) {
                    delete phrase.pronunciations[lect];
                }
                if (phrase.lects.includes(lect)) {
                    $Language.Phrasebook[category][p].lects.splice(phrase.lects.indexOf(lect), 1);
                }
                if (!phrase.lects) {
                    const {[p]: _, ...rest} = $Language.Phrasebook[category];
                    $Language.Phrasebook[category] = rest;
                }
            })
        });

        $Language.Orthographies.forEach(ortho => {
            if (ortho.lect === lect) ortho.lect = $Language.Lects[0];
        });
        $Language.Lexicon = {...$Language.Lexicon};
    }

    function confirmUseLectsChange () {
        if (!$Language.UseLects) {
            vex.dialog.confirm({
                message: `Are you sure you want to disable lect features? Only the data for the lect "${$Language.Lects[0]}" will be kept.`,
                callback: ((response: boolean) => {
                    if (response) {
                        let keep = $Language.Lects[0];
                        $Language.Lects = ['General'];

                        Object.keys($Language.Lexicon).forEach((word: string) => {
                            $Language.Lexicon[word].Senses = $Language.Lexicon[word].Senses.filter((sense: Lexc.Sense) => {
                                return sense.lects.includes(keep);
                            })
                            $Language.Lexicon[word].Senses.forEach((sense: Lexc.Sense) => {
                                sense.lects = ['General'];
                            })
                            if (!$Language.Lexicon[word].Senses) {
                                delete $Language.Lexicon[word];
                            }
                            $Language.Lexicon[word].pronunciations = {
                                General: $Language.Lexicon[word].pronunciations[keep]
                            }
                        });
                        $Language.Pronunciations = {
                            General: $Language.Pronunciations[keep]
                        }
                        $pronunciations = {
                            General: $pronunciations[keep]
                        }
                    } else { $Language.UseLects = true; }
                })
            });
        }
    }

    function importRelative() {
        let contents: Lexc.Language;
        const dialog = (user_path: string) => {
            showOpenDialog(
                {
                    title: 'Import Related Lexicon',
                    defaultPath: `${user_path}${path.sep}Lexicons${path.sep}`,
                    properties: ['openFile'],
                },
                file_path => {
                    if (!file_path) return;
                    fs.readFile(file_path[0], 'utf8', (err, data: string) => {
                        if (err) {
                            console.log(err);
                            vex.dialog.alert('There was an issue loading your file. Please contact the developer.');
                        }
                        try {
                            contents = JSON.parse(data);
                            if (!String(contents.Version).match(/^2\.[0-9]*\.[0-9]*$/)) {
                                vex.dialog.alert(`
                                    This file was saved with an old version of the app (~${contents.Version})
                                    and is not compatible with the current version of Lexicanter. Please contact
                                    the developer; the file may be recoverable.
                                `);
                                return;
                            }
                            const commit = (overwrite: boolean) => {                  
                                // add an etymology entry for each word in the relative lexicon
                                for (const word in contents.Lexicon) {
                                    if (!$Language.Lexicon[word] && (!$Language.Etymologies[word] || overwrite)) {
                                        $Language.Etymologies[word] = {
                                            descendants: [],
                                            source: contents.Name,
                                        };
                                    }
                                }
                            }
                            if (contents.Name in $Language.Relatives) {
                                vex.dialog.confirm({
                                    message: `A relative lexicon with the name "${contents.Name}" already exists. Would you like to overwrite it?`,
                                    callback: (response: boolean) => {
                                        if (response) {
                                            $Language.Relatives[contents.Name] = contents.Lexicon;
                                            commit(true);
                                        }
                                    }
                                })
                            } else {
                                $Language.Relatives = {
                                    ...$Language.Relatives,
                                    [contents.Name]: contents.Lexicon
                                };
                                commit(false);
                            }
                        } catch (err) {
                            vex.dialog.alert('There was an issue loading the file. Please contact the developer.');
                            return;
                        }
                    });
                }
            );
        };
        userData(user_path => {
            if (!fs.existsSync(`${user_path}${path.sep}Lexicons${path.sep}`)) {
                fs.mkdir(`${user_path}${path.sep}Lexicons${path.sep}`, () => {
                    logAction(`Created the 'Lexicons' folder in the user data folder at '${user_path}'.`);
                    dialog(user_path);
                });
            } else { dialog(user_path); }
        });
    }
</script>
<!-- App Settings -->
<div class="tab-pane">
    <div class="row" style="height: 95vh">
        <div class="container column scrolled" style="height: 90vh;">
            <br><br>
            <p>Appearance Settings</p> <br>
            <label>Color Theme
                <select 
                    name="theme-select" id="theme-select" 
                    bind:value={$theme} 
                    on:change={change_theme}
                >
                    <optgroup label="Simple Themes">
                        <option value="styles/dark.css">☾ Dark</option>
                        <option value="styles/light.css">☀ Light</option>
                    </optgroup>
                    <optgroup label="The Saturnine Collection">
                        <option value="styles/marine.css">☾ Marine</option>
                        <option value="styles/glade.css">☾ Glade</option>
                        <option value="styles/pomegranate.css">☾ Pomegranate</option>
                        <option value="styles/magnolia.css">☾ Magnolia</option>
                        <option value="styles/juniper.css">☀ Juniper</option>
                        <option value="styles/leatherbound.css">☀ Leatherbound</option>
                        <option value="styles/wisteria.css">☀ Wisteria</option>
                    </optgroup>
                    <optgroup label="The Maarz Collection">
                        <option value="styles/purple_maar.css">☾ Purple Maar</option>
                        <option value="styles/terminal_green.css">☾ Terminal</option>
                        <option value="styles/midnight.css">☾ Midnight</option>
                        <option value="styles/crabapple.css">☾ Crabapple</option>
                        <option value="styles/bone.css">☀ Bone</option>
                    </optgroup>
                    <optgroup label="The Holiday Collection">
                        <option value="styles/eostre2023.css">☀ Ēostre 2023</option>
                        <option value="styles/hallowseve2023.css">☾ All Hallow's Eve 2023</option>
                    </optgroup>
                </select>
            </label>
            <br>
            <button class="hover-highlight hover-shadow" on:click={()=>{$Language.FileTheme = $theme}}> Set Current Theme as Default for This File </button>
            <button class="hover-highlight hover-shadow" on:click={()=>{$Language.FileTheme = 'default'}}> Clear File Theme </button>
            <br>
            <button class="hover-highlight hover-shadow" on:click={custom_theme}> Load Custom Theme… </button>

            <br><hr/><br>

            <p>Save Settings</p> <br>
            <label>Auto-Save
                <input type="checkbox" bind:checked={$autosave} on:change={change_autosave_pref}/>
            </label>

            <div class=narrow>
                <label>Database Uploading
                    <p class=info>If you wish, your files can be saved to an online database so that you can sync your files across multiple 
                        devices and the discord bot. To get your User ID and Key, please go to the Saturn's Sojourn discord server and use 
                        the command <code>/account</code>.
                    </p>
                    <span>Uploading is {$Language.UploadToDatabase? 'On' : 'Off'} for this file.
                        <input type=checkbox bind:checked={$Language.UploadToDatabase}/>
                    </span>
                    {#if $Language.UploadToDatabase && verifyHash($dbid, $dbkey)}
                        Local File Version: {localFileVersion} <br>
                        Online File Version: {onlineFileVersion} <br>
                        <button class='hover-highlight hover-shadow' on:click={setFileVersions}>Refresh</button>
                    {/if}
                    <span>User ID: <input class:pronunciation={disabledDatabase} type=text bind:value={inputID} disabled={disabledDatabase}/></span>
                    <br>
                    <span>Key: <input class:pronunciation={disabledDatabase} type=text bind:value={inputKey} disabled={disabledDatabase}/></span>
                    <button on:click={setDatabaseAccount}>Authenticate</button>
                    <p class=info>Your ID and Key are saved to the app's internal settings, not to your file, but turning on uploading is saved per-file.</p>
                    <br>
                    <button class='hover-highlight hover-shadow' on:click={syncFromDatabase}>Sync From Database</button>
                    <p class=info>This will overwrite the current file with the latest version of the file with the same name and User ID in the database.</p>
                </label>
            </div>

            <br><hr/><br>

            <p>Lexicon Settings</p> <br>
            <label>Manage Tags<br>
                <TagSelector on:select={e => tag = e.detail? e.detail.trim() : ''}/>
                <p>Selected: {tag}</p>
                {#if !!tag}
                    <button class="hover-highlight hover-shadow" on:click={()=>{
                        Object.keys($Language.Lexicon).forEach(word => {
                            $Language.Lexicon[word].Senses.forEach((sense, i) => {
                                if (sense.tags.includes(tag)) {
                                    $Language.Lexicon[word].Senses[i].tags.splice(sense.tags.indexOf(tag), 1);
                                }
                            });
                        });
                        tag = '';
                    }}>Delete Tag</button>
                    <button class="hover-highlight hover-shadow" on:click={()=>{
                        vex.dialog.prompt({
                            message: 'New tag name:',
                            callback: (newName) => {
                                if (newName) {
                                    Object.keys($Language.Lexicon).forEach(word => {
                                        $Language.Lexicon[word].Senses.forEach((sense, i) => {
                                            if (sense.tags.includes(tag)) {
                                                $Language.Lexicon[word].Senses[i].tags.splice(sense.tags.indexOf(tag), 1);
                                                $Language.Lexicon[word].Senses[i].tags.push(newName);
                                            }
                                        });
                                    });
                                    tag = newName;
                                }
                            }
                        });
                    }}>Edit Tag</button>
                {/if}
            </label>

            <br><hr/><br>

            <p>Advanced Settings</p> <br>
            <label>Show Multi-Lect Features
                <input type="checkbox" bind:checked={$Language.UseLects} on:change={confirmUseLectsChange}/>
                {#if $Language.UseLects}
                    {#each $Language.Lects as lect, lectIndex}
                        <div class="narrow">
                            <p style="display: inline-block" id={`${lectIndex}`}>{lect}</p>
                            <button class="hover-highlight hover-shadow" style="display: inline-block" on:click={() => {
                                if ($Language.Lects.length === 1) {
                                    vex.dialog.alert('You cannot delete the last lect.');
                                    return;
                                };
                                vex.dialog.confirm({
                                    message: `Are you sure you want to delete the lect "${lect}"? This action cannot be undone.`,
                                    callback: function (response) {
                                        if (response) {
                                            deleteLect(lect, lectIndex);
                                            debug.log(`Deleted lect: ${lect}`);
                                        }
                                    }
                                });
                            }}> ⌫ </button>
                            <button class="hover-highlight hover-shadow" style="display: inline-block" on:click={() => {
                                vex.dialog.prompt({
                                    message: 'Edit Lect Name',
                                    placeholder: `${lect}`,
                                    callback: function (response) {
                                        if (response === false) {
                                            return debug.log('User cancelled the Edit Lect Name dialog.');
                                        }
                                        changeLectName(lect, response, lectIndex);
                                        debug.log(`Edited lect name: ${lect} to ${response}`);
                                    }
                                })
                            }}> ✎ </button>
                            <button class="hover-highlight hover-shadow" style="display: inline-block;" on:click={() => {
                                vex.dialog.confirm({
                                    message: `Add all words in the lexicon to the lect ‘${lect}’?`,
                                    callback: function (response) {
                                        if (response) {
                                            for (let word in $Language.Lexicon) {
                                                $Language.Lexicon[word].Senses.forEach(sense => {
                                                    if (!sense.lects.includes(lect)) {
                                                        sense.lects.push(lect);
                                                    }
                                                });
                                            };
                                            debug.log(`Added all words to lect: ${lect}`);
                                            vex.dialog.alert(`Added all senses of all words to the lect ‘${lect}’.`);
                                        }
                                    }
                                });
                            }}> ◎ </button>
                        </div>
                    {/each}
                    <button class="hover-highlight hover-shadow" on:click={() => { 
                        vex.dialog.prompt({
                            message: 'Add a New Lect',
                            placeholder: `New ${$Language.Name} Lect`,
                            callback: function (response) {
                                if (response === false) {
                                    return debug.log('User cancelled the Add Lect dialog.');
                                }
                                $Language.Lects = [...$Language.Lects, response];
                                $Language.Pronunciations[response] = 'place > holder';
                                $pronunciations[response] = get_pronunciation($wordInput, response);
                                logAction(`Added a new lect: ${response}`);
                                // debug.log(`Added a new lect: ${response}`)
                            }
                        })
                    }}> + Lect </button>
                {/if}
            </label>
            <label>Show Pronunciations
                <input type="checkbox" bind:checked={$Language.ShowPronunciation}/>
            </label>
            <br><br>
            <label>Show Etymology Features
                <input type="checkbox" bind:checked={$Language.ShowEtymology}/>
                {#if $Language.ShowEtymology}
                    <button class="hover-highlight hover-shadow" 
                        on:click={() => {
                            importRelative();
                        }}
                    > Import Related Lexicon </button>
                    {#each Object.keys($Language.Relatives) as relative}
                        <div class="narrow">
                            <p style="display: inline-block;">{relative}</p>
                            <button class="hover-highlight hover-shadow" style="display: inline-block;" on:click={() => {
                                vex.dialog.confirm({
                                    message: `Are you sure you want to delete "${relative}"? This will remove any etymology connections its entries may have.`,
                                    callback: function (response) {
                                        if (response) {
                                            $Language.Etymologies = Object.fromEntries(Object.entries($Language.Etymologies).filter(([_, value]) => value.source !== relative));
                                            delete $Language.Relatives[relative];
                                            logAction(`Deleted relative: ${relative}`);
                                        }
                                    }
                                });
                            }}> ⌫ </button>
                        </div>
                    {/each}
                {/if}
            </label>
            <br><br>
            <label>Show Automatic Inflection Features
                <input type="checkbox" bind:checked={$Language.ShowInflection}/>
            </label>
            <br><br>
            <label>Show Alternate Orthography Features
                <input type=checkbox bind:checked={$Language.ShowOrthography}/>
                {#if $Language.ShowOrthography}
                    <label>Display Orthographies
                        {#each $Language.Orthographies as orthography}
                            <div class="row narrow">
                                <div class=column style:align=right>
                                    <input type=checkbox bind:checked={orthography.display}/>
                                </div>
                                <div class="column text-left">
                                    <p>{orthography.name}</p>
                                </div>
                            </div>
                        {/each}
                    </label>
                {/if}
            </label>
        </div>
    </div>
</div>
