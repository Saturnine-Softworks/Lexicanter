<script lang="ts">
    const { ipcRenderer } = require('electron');
    const vex = require('vex-js');
    vex.registerPlugin(require('vex-dialog'));
    vex.defaultOptions.className = 'vex-theme-os';
	import Lexicon from './components/Lexicon.svelte';
	import Phrasebook from './components/Phrasebook.svelte';
	import Phonology from './components/Phonology.svelte';
    import Documentation from './components/Documentation.svelte';
	import File from './components/File.svelte';
	import Settings from './components/Settings.svelte';
    import { theme, autosave } from './stores';
    import { saveFile } from './scripts/files';
    import * as diagnostics from './scripts/diagnostics';

    const tabs = [Lexicon, Phrasebook, Phonology, Documentation, File, Settings]
    const tab_btns = ['Lexicon', 'Phrasebook', 'Phonology', 'Documentation', 'File', 'Settings'];
    $: selectedTab = 0;

    /**
     * This block listens for the 'app-close' event, which is sent by the main
     * process, and if the user has autosave enabled, saves the file before
     * closing the app. If the user does not have autosave enabled, it prompts
     * the user to confirm that they want to exit. The 'close' event is sent
     * to the main process when app exit is confirmed. 
     */
    ipcRenderer.on('app-close', _ => {
        if ($autosave) {
                diagnostics.logAction('Autosaving before exit.');
            saveFile().then(_ => {
                window.setTimeout(() => ipcRenderer.send('close'), 1000); // Give time for the notification to show
            });
        } else {
            if ( window.confirm('You may have unsaved changes. Are you sure you want to exit?') )
                ipcRenderer.send('close');
        }
    });
    let version: string;
    ipcRenderer.invoke('getVersion').then((v: string) => version = v);
</script>

<link rel="stylesheet" href="{$theme}" />

<body id="body">
    <div class='tab-container'>
        <div class="button-container">
            <p class="version-info"><i>v</i>{version}</p>
            {#each tab_btns as tab, i}
                <button on:click={() => selectedTab = i}
                    class:selected={selectedTab === i} class='hover-highlight'>{tab}</button>
            {/each}
        </div>
        {#each tabs as tab, i}
            <div class:collapsed={selectedTab !== i}>
                <svelte:component this={tab}/>
            </div>
        {/each}
    </div>
</body>
