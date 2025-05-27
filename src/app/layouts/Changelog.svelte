<svelte:options runes/>
<script lang='ts'>
    import Draggable from "../components/Draggable.svelte";
    import { selectedTab } from "../stores";

    const [MAJOR, MINOR, PATCH] = [0, 1, 2];
    
    interface ChangelogEntry {
        type: number;
        notes: string[];
    }
    
    const changelog: Record<string, ChangelogEntry> = {
        '2.2.2': {
            type: PATCH,
            notes: [
                'Added a toggle to Settings for whether or not to automatically download experimental updates.',
                'Fixed a CSS issue with displaying Graphemy-rendered characters.',
                'Fixed a couple of ways that a soft crash could be achieved via the Graphemy typesetter settings being set to null values.',
                'Fixed a display bug causing some users to be unable to view the number of entries in their lexicons.',
            ]
        },
        '2.2.1': {
            type: PATCH,
            notes: [
                'Windows and Linux users can now actually use the Graphemy features added in the previous update. Before, a startup error prevented this \
                without preventing the app itself from running. This has been resolved. ',
            ]
        },
        '2.2.0': {
            type: MINOR,
            notes: [
                'Integrated the typesetter from <a href=\'https://codeberg.org/zhuriel/graphemy\'>Graphemy</a>, an app by Zhuriel for when fonts aren’t enough. \
                You can now set up and display new orthographies using your Graphemy files.',
                'You can now choose which orthographies display in the lexicon and phrasebook separately.',
                'The Phrasebook tab can now be turned off in settings.',
                'The Alphabetization settings can be completely hidden from the Lexicon panels in settings.',
                'The UI has been largely overhauled. By default, you will see all the same familiar panels in the same tabs, but you may notice that they have \
                their own window bars and can move them around, resize them, and minimize and maximize them now.',
                'There is a new mode for displaying the tabs: the defeault is now "Switch" mode, and you can change this to "Toggle" mode. This allows you to open\
                any panels you want all at once.',
                'You can export/import layouts as JSON files. Your layout settings are now saved per-file.',
                'Fixed an issue where adding a new lect to all words via the button in the multi-lect settings would not properly update pronunciations.',
                'Fixed an issue where files set to sync to the cloud would repeatedly falsely alert the user that their ID and Key are invalid when offline.',
                'Made some adjustments to the Magnolia theme which I find more aesthetically pleasing. There have also been some small adjustments to the app-wide styling.',
                'Speed and stability improvements. (The majority of the app is now running Svelte 5 in "Runes" mode.)'
            ]
        },
        '2.1.22': {
            type: PATCH,
            notes: [
                'Fixed a bug introduced in the last patch which made it impossible to add entries to the lexicon with more than one sense.',
                'Fixed a bug introduced in the last patch specific to macOS which caused the app to use the wrong dock icon.'
            ]
        },
        '2.1.21': {
            type: PATCH,
            notes: [
                'Security and accessibility improvements.',
                'Back-end improvements for development cycle: Upgraded from Svelte 4 to Svelte 5, and migrated from Rollup to Vite',
                'New markdown export option!',
                'Updated/fixed plain text export; removed plain text import (outdated, impractical).',
                'Updated/fixed CSV import/export.',
                'Removed tooltips since they caused several issues and were generally not useful to users.'
            ]
        },
        '2.1.20': {
            type: PATCH,
            notes: [
                'Improved formatting options on the documentation tab, including the long-requested feature of paragraph alignment. \
                Also, ordered and unordered lists, collapsible sections, callouts, citations, and annotations.',
                'You can now delete files from the cloud. The app will prompt you to confirm this action, and it will not delete the file locally.'
            ]
        },
        '2.1.19': {
            type: PATCH,
            notes: [
                'Fixed a bug with the lexicon description search which caused the exact match <code>!</code> and begins-word <code>^</code> functions not to work.',
                'Fixed a bug causing the alphabetizer to soft crash the app if you used parentheses in your alphabet. Other RegEx-reserved characters will work now as well.'
            ]
        },
        '2.1.18': {
            type: PATCH,
            notes: [
                'Fixed problems with the search bars in the Phrasebook tab which made them virtually useless.',
                'Fixed another case where documentations would not be initialized when loading a database synced file on multiple devices.',
                'Changes to how the changelog in managed under the hood (yes, really).'
            ]
        },
        '2.1.17': {
            'type': PATCH,
            'notes': [
                'Fixed a bug with downloading lexicons on multiple devices and the documentation being left out.'
            ]
        },
        '2.1.16': {
            'type': PATCH,
            'notes': [
                'Fixed a bug that occurred with lexicon searching in some files, related to case-sensitivity.'
            ]
        },
        '2.1.15': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug which caused the search fields in the lexicon and phrasebook to find no matches in certain cases.',
                'Changed the way that the app recognizes when changes have been made to the version of your file in the database.',
                'A few quality of life features related to the previous change, including the ability to see the local and online file version numbers in Settings.'
            ]
        },
        '2.1.14': {
            'type': PATCH,
            'notes': [
                'Fixed a bug with the orthography pattern replacement features which caused it to only replace the first instance of a pattern in each word.',
                'Added the ability to use ^ or # as word-end characters in the orthography pattern replacement fields.',
                'Fixed a reported bug with the Illegals field of the Advanced Phonotactics word generator which caused that field not to save its contents.',
                'Fixed a bug with database syncing which caused the setting to not save for files.',
                'Files should now automatically detect when you have changes in the database on loading, and will prompt you to download the changes.'
            ]
        },
        '2.1.13': {
            'type': PATCH,
            'notes': [
                'Added an Illegals field to the Advanced Phonotactics word generator options.',
                'Added the Structures inputs to the Advanced Phonotactics word generator options and the corresponding syllable category syntax for this feature.',
                '(Finally) wrote the documentation on the word generator, which can be found in the Help tab.'
            ]
        },
        '2.1.12': {
            'type': PATCH,
            'notes': [
                'Added a new default text to the Pronunciations field in the Phonology tab to better guide beginners.',
                'Added an indicator on entries in the lexicon tab to show if their pronunciation was manually edited and thus not automatically updated by pronunciation rules.'
            ]
        },
        '2.1.11': {
            'type': PATCH,
            'notes': [
                'Added secondary location file saving, for those of you who want your lexicon files to save to another location on your computer every time you save.',
                'Added database syncing! Get your account credentials from the Lexicanter Discord bot, and then you can sync your files to the bot and between devices.',
                'A minor change to how app settings are saved. The old app settings files are now deprecated and will eventually no longer be supported.'
            ]
        },
        '2.1.10': {
            'type': PATCH,
            'notes': [
                'New tooltips have been added throughout the app.',
                'New All Hallow\'s Eve 2023 theme in the Holiday collection!'
            ]
        },
        '2.1.9': {
            'type': PATCH,
            'notes': [
                'Hot fix for a bug which caused data saved by the advanced word generator not to be loaded open re-opening a file.',
                'A new feature will be coming in 2.2 which requires a change to the way lexicon entries are formatted internally, which this update prepares for.'
            ]
        },
        '2.1': {
            'type': MINOR,
            'notes': [
                'Introduced a plain text import feature for convenient clonging on the move.',
                'Added a reference window for loading secondary files in read-only mode.',
                'Support for custom fonts via new Orthographies feature.',
                'Under-the-hood file structure adjustments and read logic improvements.',
                'New phonological evolution tools!',
                'An alternative type of word generator for more advanced syllable structures.',
                'The option to save theme preferences on a file-by-file basis.',
                'New themes: Magnolia by Saturnine, Crabapple by Maarz, and Eostre 2023 (a holiday theme released for beta users earlier this year).',
                'A number of bugs removed; probably some bugs added. Please report them if you find them!'
            ]
        },
        '2.0.18': {
            'type': PATCH,
            'notes': [
                'By request, added a new dropdown to Tag inputs which allows you to select from pre-existing tags in your lexicon.',
                'By request, added a new Help tab. It hosts the same information as the wiki, but is accessible offline.',
                'The Settings, Changelog, and Help tabs, as well as the window control buttons, now use Material Icons.'
            ]
        },
        '2.0.17': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug with the inflections generation.',
                'Fixed an issue with tag searching.',
                'The font weight has been changed to an appropriate Book weight to improve readability on some systems and to many eyes.'
            ]
        },
        '2.0.16': {
            'type': PATCH,
            'notes': [
                'Fixed a small bug with the new sound change engine.'
            ]
        },
        '2.0.15': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug with HTML export.',
                'Related to the above fix, technical limitations now prevent your theme from being exported with your HTML. Solutions are being investigated.'
            ]
        },
        '2.0.14': {
            'type': PATCH,
            'notes': [
                'Fixed CSV export.',
                'Fixed a reported bug with HTML export.',
                'Fixed some reported and unreported issues with the sound change engine.',
                'There is now a text input designated for specifying categories for sound changes in an inflection group, to make everyone\'s life easier.',
                'Minor optimizations and performance improvements.'
            ]
        },
        '2.0.13': {
            'type': PATCH,
            'notes': [
                'Linux support!'
            ]
        },
        '2.0.12': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug which caused HTML export to fail. Expect expanded HTML export options in the future.',
                'Minor optimizations.'
            ]
        },
        '2.0.11': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug which caused a semi-rare soft-crash in certain cases when dealing with multiple lects. Again.'
            ]
        },
        '2.0.10': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug which caused a semi-rare soft-crash in certain cases when dealing with multiple lects.',
                'Fixed a reported bug which caused CSV import to fail, and improved CSV import options.'
            ]
        },
        '2.0.9': {
            'type': PATCH,
            'notes': [
                'You can now write multiple rules separated by a semicolon, which allows for multiple rules per table cell in the inflection tables.',
                'Fixed a reported bug which caused a soft crash when attempting to edit the last word in the lexicon if it had an inflections dropdown open.'
            ]
        },
        '2.0': {
            'type': MAJOR,
            'notes': [
                'There is now a new sound change engine under the hood. Your old rules may no longer work; for assistance, you can contact the developer.',
                'Lexicon entries can now be separated into multiple Senses, each of which can have their own tags.',
                'There are new features accessible via new Advanced Settings. These include:',
                'New Lect features allow you to denote the ways your language may vary, particularly in semantics and pronunciation.',
                'New Inflection features, which include a new tab, which allows you to create inflectional paradigms for your language.',
                'New Etymology features, which include a new tab, allows you to create etymologies trees and view them in the lexicon.',
                'Check out the new wiki page or tutorial video for more in-depth information!',
                'New app icons by Lyiusa!',
                'New themes: Juniper by Saturnine, and Midnight and Bone by Maarz!'
            ]
        },
        '1.11.4': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug causing markdown not to work in variant descriptions of phrases.'
            ]
        },
        '1.11.3': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug causing the alphabetizer pre-check to send false alerts when certain combining diacritics on certain characters were in the alphabet in certain orders.'
            ]
        },
        '1.11.2': {
            'type': PATCH,
            'notes': [
                'The app now saves backup versions of your files in case things go wrong.',
                'Fixed a reported bug that caused the app to sometimes exit too quickly and not save when autosave was enabled.'
            ]
        },
        '1.11.1': {
            'type': PATCH,
            'notes': [
                'Fixed a reported bug causing the Ignore Diacritics setting to be ignored during alphabet checks when adding words to the lexicon.'
            ]
        },
        '1.11': {
            'type': MINOR,
            'notes': [
                'When you attempt to add a word to the lexicon, there is now an alert if the word contains characters (or polygraphs) not present in your alphabet.',
                'Fixed a reported bug causing external links to not display correctly in the Lexicon tab specifically.',
                'Fixed a reported bug preventing the app from warning you that it will not save if there is no file name given.',
                'Fixed a minor bug with the Terminal theme when exported for HTML.'
            ]
        },
        '1.10': {
            'type': MINOR,
            'notes': [
                'Added three new themes: Pomegranate, Wisteria, and Terminal.',
                'The word entry panel in the Lexicon tab is now collapsible.',
                'The Phrasebook now has active overwrite protection to prevent you from deleting your work by mistake.',
                'You can now search for an exact whole-word match in definitions and tags fields by using ! as a prefix.',
                'For HTML exports, the appearance on mobile devices has been improved.',
                'Minor bug fixes for opening new windows from the File tab.',
                'Lots of under-the-hood changes for the app\'s appearance in preparation for future features.'
            ]
        },
        '1.9.5': {
            'type': PATCH,
            'notes': [
                'Fixed a bug causing app-quit to be impossible sometimes.',
                'Fixed some minor bugs with the styles.',
                'Fixed a bug causing monospace toggle in the docs tab to be undoable.',
                'Fixed a bug causing external hyperlinks not to use the preferred browser, and in some cases not open at all.'
            ]
        },
        '1.9.4': {
            'type': PATCH,
            'notes': [
                'You can now hyperlink to entries in the lexicon. The link format is lex::word.',
                'The documentation tab would previously not adjust to the width of the window. That has been fixed.'
            ]
        },
        '1.9': {
            'type': MINOR,
            'notes': [
                'Overhauled the Documentation tab, which now uses integrated EditorJS technology. Markdown is no longer supported in this tab, in favor of the new WYSIWYG style with a toolbar visible when you highlight text.',
                'Note: The first time you load a file from an older version, there may be some formatting quirks. Most of these should sort themselves out after saving in the new version and re-loading. Please contact the developer if you run into persistent issues.',
                'Fixed a bug with the Open New Window button which caused it to fail to open new windows.',
                'The button to edit phrasebook entries has been changed to right-click instead of left-click to make it more difficult to accidentally overwrite work in progress, and to allow for highlighting text.',
                'An HTML Docs-Only export option has been added.'
            ]
        },
        '1.8.14': {
            'type': PATCH,
            'notes': [
                'Fixed a few minor bugs with markdown parsing.',
                'Added monospace markdown with ``this`` syntax.',
                'Fixed a reported bug which affected the orthography testing area.'
            ]
        },
        '1.8': {
            'type': MINOR,
            'notes': [
                'File storage has been migrated to make auto-save possible.',
                'Categories can now be defined and used in your Pronunciations rules. See the docs page for more info.',
                'Five new color themes: Light, Marine, Glade, Leatherbound, and Purple Maar (contributed by Maarz).',
                'You can now load in your own custom CSS color themes.',
                'Definitions, descriptions, and documentation sections now support simple markdown.',
                'There\'s a new space in the Phonology tab to test your pronunciation rules.',
                'Tag searches no longer require an exact match.',
                'Several minor bug fixes, including one reported about tables being editable in the HTML export.'
            ]
        }
    }
</script>
<div class='tab-pane'>
    {#if $selectedTab.includes(9)}
        <Draggable panel=changelog>
            <div class='container glasspane scrolled'>
                <p class='info'>
                    Interested in testing the experimental versions, talking about languages, or worldbuilding? <br>
                    Join <a rel='noreferrer' target='_blank' href='https://discord.gg/uDk2XDhh8K'>Saturn's Sojourn</a>,
                    the home of Lexicanter on <a rel='noreferrer' target='_blank' href='https://discord.gg/uDk2XDhh8K'>Discord</a>!
                </p>
                <br>
                <p class='info'>
                    Support the continued developement of the app as a <a rel='noreferrer' target='_blank' href='https://patreon.com/saturnine_softworks'>patron</a>,
                </p>
                <p class='info'>
                    or by buying me a <a rel='noreferrer' target='_blank' href='https://ko-fi.com/saturnine_softworks'>coffee</a>!
                </p>
                <br><br>
                Below is a list of all changes made to the app since version 1.8, which is when the changelog was first added.<br>
                If you're looking for more information about how to use the app, check the Help tab or visit the
                <a rel='noreferrer' target='_blank' href='https://github.com/Saturnine-Softworks/Lexicanter/wiki'>Wiki</a>.<br> There is also
                an overview <a rel='noreferrer' target='_blank' href='https://www.youtube.com/watch?v=6_AwCC4XlvU&t=151s'>tutorial video</a> for release 2.0.
                <br> If you're still having trouble, or need to contact the developer, visit us in the
                <a rel='noreferrer' target='_blank' href='https://discord.gg/uDk2XDhh8K'>Discord server</a>.
            
                <br><hr/><br>
                {#each Object.keys(changelog) as version}
                    <p><u>{['Overhaul', 'Update', 'Patch'][changelog[version].type]} {version}</u></p>
                    <p style='width: 70%; margin: auto; text-align: left; line-height: 1.6'>
                        {#each changelog[version].notes as note}
                            • {@html note} <br>
                        {/each}
                    </p>
                    <br>
                {/each}
            </div>
        </Draggable>
    {/if}
</div>
