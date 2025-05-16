<svelte:options runes></svelte:options>
<script lang="ts">
    const { ipcRenderer } = require('electron');

    const vex = require('vex-js');
    vex.registerPlugin(require('vex-dialog'));
    vex.defaultOptions.className = 'vex-theme-os';
    
    // @ts-ignore // the tab name "File" really irks typescript
	import File from './layouts/File.svelte';
	import Lexicon from './layouts/Lexicon.svelte';
    import Etymology from './layouts/Etymology.svelte';
	import Phrasebook from './layouts/Phrasebook.svelte';
	import Phonology from './layouts/Phonology.svelte';
    import Documentation from './layouts/Documentation.svelte';
	import Settings from './layouts/Settings.svelte';
    import Changelog from './layouts/Changelog.svelte';
    import Inflection from './layouts/Inflection.svelte';
    import Orthography from './layouts/Orthography.svelte';
    import Wiki from './layouts/Wiki.svelte';
    import Reference from './layouts/Reference.svelte';

    import { theme, autosave, selectedTab, Language, referenceLanguage, panelSnap } from './stores';
    import { saveFile } from './utils/files'

    const tabs     = [ Lexicon,   Etymology,   Phrasebook,   Inflection,   Phonology,   Orthography,   Documentation,   File,   Settings,   Changelog, Wiki]
    const tab_btns = ['Lexicon', 'Etymology', 'Phrasebook', 'Inflection', 'Phonology', 'Orthography', 'Documentation', 'File', 'settings', 'history', 'help'];

    /**
     * This block listens for the 'app-close' event, which is sent by the main
     * process, and if the user has autosave enabled, saves the file before
     * closing the app. If the user does not have autosave enabled, it prompts
     * the user to confirm that they want to exit. The 'close' event is sent
     * to the main process when app exit is confirmed.
     */
    ipcRenderer.on('app-close', () => {
        if ($autosave) {
            saveFile().then(_ => {
                window.setTimeout(() => ipcRenderer.send('close'), 1000); // Give time for the notification to show
            });
        } else {
            if ( window.confirm('You may have unsaved changes. Are you sure you want to exit?') )
                ipcRenderer.send('close');
        }
    });

    ipcRenderer.on('adjustGrid', adjustSnapGrid);

    function adjustSnapGrid() {
        if (!$panelSnap.proportional) return;
        $panelSnap.x = Math.round(window.outerWidth / $panelSnap.columns)
        $panelSnap.y = Math.round((window.outerHeight-25) / $panelSnap.rows)
    }

    let version: string = $state('');
    ipcRenderer.invoke('getVersion').then((v: string) => version = v);

    let platform: string = $state('');
    ipcRenderer.invoke('platform').then((p: string) => platform = p);
</script>

<link rel="stylesheet" href="{$Language.FileTheme === 'default'? $theme : $Language.FileTheme}" />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<main id="main" spellcheck="false">
    <div class='tab-container'>
        <div class="row">
            <div class="column" style={$referenceLanguage? 'width: 66%' : 'width: 100%'}>
                <p class="window-control">
                    <button class="hover-highlight close material-icons" onclick={() => ipcRenderer.send('buttonclose')}>close</button>
                    <button class="hover-highlight minimize material-icons" onclick={() => ipcRenderer.send('minimize')}>remove</button>
                    <button class="hover-highlight maximize material-icons" onclick={() => ipcRenderer.send('maximize')}>fullscreen</button>
                </p>
                <div class="button-container">
                    {#if !$referenceLanguage}
                        <p class="version-info">v{version}-{platform} —</p>
                    {/if}
                    {#each tab_btns as tab, i}
                        {#if (tab !== 'Etymology' && tab !== 'Inflection' && tab !== 'Orthography' && tab !== 'Phrasebook')
                            || (tab === 'Phrasebook' && $Language.ShowPhrasebook)
                            || (tab === 'Etymology' && $Language.ShowEtymology)
                            || (tab === 'Inflection' && $Language.ShowInflection)
                            || (tab === 'Orthography' && $Language.ShowOrthography)
                        }
                            <button 
                                class:selected={$selectedTab === i} 
                                class='hover-highlight tab-button'
                                style={
                                    ['settings', 'history', 'help'].includes(tab)
                                        ? 'font-family: "Material Icons"; font-size: 1em; vertical-align: bottom; height: 1.8em;'
                                        : ''
                                }
                                onclick={() => $selectedTab = i}
                            > {tab} </button>
                        {/if}
                    {/each}
                </div>
                    {#each tabs as Tab, i}
                    <div class:collapsed={$selectedTab !== i}>
                            <Tab/>
                    </div>
                {/each}
            </div>

            {#if $referenceLanguage}
                <div class="column tab-pane reference" style="width: 33%">
                    <Reference/>
                </div>
            {/if}

        </div>
    </div>
</main>
<svelte:window 
    on:resize={adjustSnapGrid}
></svelte:window>