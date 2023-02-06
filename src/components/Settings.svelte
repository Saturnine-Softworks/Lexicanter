<script>
    import { theme, autosave } from '../stores.js';
    import { userData } from '../scripts/files.js'
    const fs = require('fs');
    const path = require('path');

    /**
     * When the app loads, this block runs to check if the user has
     * previously set a theme preference. If not, it creates a file in the
     * user's app data folder and sets the default value to 'styles/dark.css'. 
     * Otherwise, it reads the value from the file and sets the $theme store.
     */
    userData(user_path => {
        if (!fs.existsSync(user_path + path.sep + 'theme.txt')) {
            fs.writeFileSync(user_path + path.sep + 'theme.txt', 'styles/dark.css');
        }
        let theme_value = fs
            .readFileSync(user_path + path.sep + 'theme.txt', 'utf8')
            .toString();

        $theme = theme_value;
    });

    /**
     * When the app loads, this block runs to check if the user has
     * previously set an autosave preference. If not, it creates a file in the
     * user's app data folder and sets the default value to true. Otherwise,
     * it reads the value from the file and sets the $autosave store.
     */
    userData(user_path => {
        if (!fs.existsSync(user_path + path.sep + 'autosave_pref.txt')) {
            fs.writeFileSync(user_path + path.sep + 'autosave_pref.txt', 'false');
            $autosave = true;
        } else {
            $autosave = fs.readFileSync(user_path + path.sep + 'autosave_pref.txt', 'utf8') === 'true';
        }
    });

    /**
     * When the user changes selected theme from the dropdown in the Settings tab,
     * this function updates the preferred theme setting stored in user app data.
     */
    function change_theme() {
        userData(user_path => {
            fs.writeFile(user_path + path.sep + 'theme.txt', $theme, err => {
                if (err) { 
                    window.alert('There was a problem loading your theme. Please contact the developer for assistance.'); 
                    console.log(err) 
                };
            });
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
            window.alert('The selected file was not a .css file.');
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
                color_theme.href = theme_path;
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
        userData(user_path => {
            fs.writeFile(
                user_path + path.sep + 'autosave_pref.txt',
                String($autosave),
                'utf8',
                err => { if (err) throw err; }
            );
        });
        if ($autosave) {
            var autosave_tracker = window.setInterval(
                save_file,
                300000 /* 5 minutes */,
                false
            );
        } else {
            window.clearInterval(autosave_tracker);
        };
    };

</script>
<!-- App Settings -->
<div class="tab-pane">
    <div class="row" style="height: 95vh">
        <div class="container column scrolled" style="height: 90vh;">
            <p>Appearance Settings</p> <br>
            <label for="theme-select">Color Theme</label>
            <select name="theme-select" id="theme-select" bind:value={$theme} on:change={change_theme}>
                <optgroup label="Simple Themes">
                    <option value="styles/dark.css">☾ Dark</option>
                    <option value="styles/light.css">☀ Light</option>
                </optgroup>
                <optgroup label="The Saturnine Collection">
                    <option value="styles/marine.css">☾ Marine</option>
                    <option value="styles/glade.css">☾ Glade</option>
                    <option value="styles/pomegranate.css">☾ Pomegranate</option>
                    <option value="styles/leatherbound.css">☀ Leatherbound</option>
                    <option value="styles/wisteria.css">☀ Wisteria</option>
                </optgroup>
                <optgroup label="The Maarz Collection">
                    <option value="styles/purple_maar.css">☾ Purple Maar</option>
                    <option value="styles/terminal_green.css">☾ Terminal</option>
                </optgroup>
            </select>
            <br><br>
            <button on:click={custom_theme} class="hover-highlight hover-shadow">Load Custom Theme…</button>
            <br><br>
            <p>Saving Settings</p>
            <label for="auto-save">Auto-Save</label>
            <input type="checkbox" id="auto-save" bind:checked={$autosave} on:change={change_autosave_pref}/>
            <br><br>
            <p class="info">
                Join the home of the Lexicanter project on <a rel="noreferrer" target="_blank" href="https://discord.gg/uDk2XDhh8K">Discord</a>
            </p>
            <p class="info">
                Support the continued developement of the app as a <a rel="noreferrer" target="_blank" href="https://patreon.com/saturnine_softworks">patron</a>!
            </p>
            <br><br>
            <p><u>New in 1.10</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • Added three new themes: Pomegranate, Wisteria, and Terminal. <br>
                • The word entry panel in the Lexicon tab is now collapsible. <br>
                • The Phrasebook now has active overwrite protection to prevent you from deleting your work by mistake. <br>
                • You can now search for an exact whole-word match in definitions and tags fields by using <code>!</code> as a prefix. <br>
                • For HTML exports, the appearance on mobile devices has been improved. <br>
                • Minor bug fixes for opening new windows from the File tab. <br>
                • Lots of uner-the-hood changes for the app's appearance in preparation for future features.
                <br><br>
            </p>
            <p><u>Patch 1.9.5</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • Fixed a bug causing app-quit to be impossible sometimes. <br>
                • Fixed some minor bugs with the styles. <br>
                • Fixed a bug causing monospace toggle in the docs tab to be undoable. <br>
                • Fixed a bug causing external hyperlinks not to use the preferred browser, and is some cases not open at all.
            <br><br>
            </p>
            <p><u>Patch 1.9.4</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • You can now hyperlink to entries in the lexicon. The link format is <code>lex::word</code>. <br>
                • The documentation tab would previously not adjust to the width of the window. That has been fixed.
            <br><br>
            </p>
            <p><u>New in 1.9</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • Overhauled the Documentation tab, which now uses integrated <a href="https://editorjs.io/" 
                    target="_blank" rel="noreferrer">EditorJS</a> technology. <br> Markdown is no longer supported in this tab, 
                    in favor of the new WYSIWYG style with a toolbar visible when you highlight text. <br>
                • Note: The first time you load a file from an older version, there may be some formatting quirks. 
                    Most of these should sort themselves out after saving in the new version and re-loading. 
                    Please contact the developer if you run into persistent issues. <br>
                • Fixed a bug with the Open New Window button which caused it to fail to open new windows. <br>
                • The button to edit phrasebook entries has been change to right-click instead of left-click to
                    make it more difficult to accidentally overwrite work in progress, and to allow for
                    highlighting text. <br>
                • An HTML Docs-Only export option has been added.
            <br><br>
            </p>
            <p><u>Patch 1.8.14</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • Fixed a few minor bugs with markdown parsing.<br>
                • Added monospace markdown with <code>``this``</code> syntax.<br>
                • Fixed a reported bug which affected the orthography testing area.
            <br><br>
            <p><u>New in 1.8</u></p>
            <p style="width: 70%; margin: auto; text-align: left; line-height: 1.6">
                • File storage has been migrated to make auto-save possible. <br>
                • Categories can now be defined and used in your Pronunciations rules. See the <a
                    target="_blank" href="https://lexicanter.com/docs" rel="noreferrer">docs page</a> for more info.<br>
                • Five new color themes: Light, Marine, Glade, Leatherbound, and Purple Maar (contributed by <a
                    target="_blank" href="https://linktr.ee/maarzcreative" rel="noreferrer">Maarz</a>). <br>
                • You can now load in your own custom CSS color themes.<br>
                • Definitions, descriptions, and documentation sections now support simple <a target="_blank"
                    href="https://lexicanter.com/docs#markdown" rel="noreferrer">markdown</a>. <br>
                • There's a new space in the Phonology tab to test your pronunciation rules. <br>
                • Tag searches no longer require an exact match. <br>
                • Several minor bug fixes, including one reported about tables being editable in the HTML
                export.<br>
            </p>
            <br>
        </div>
    </div>
</div>
