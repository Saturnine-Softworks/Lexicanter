<script lang='ts'>
    const { ipcRenderer } = require('electron');
    import { referenceLanguage } from '../stores';
    import ReferenceLex from '../components/reffile/ReferenceLex.svelte';
    import ReferenceTrees from '../components/reffile/ReferenceTrees.svelte';
    import ReferenceDocs from '../components/reffile/ReferenceDocs.svelte';
    import ReferencePhono from '../components/reffile/ReferencePhono.svelte';
    import ReferenceBook from '../components/reffile/ReferenceBook.svelte';
    import ReferenceInflect from '../components/reffile/ReferenceInflect.svelte';

    const tab_btns = ['Lex', 'Etym.', 'Phrases', 'Inflect.', 'Phono.', 'Docs'];
    const tabs = [ReferenceLex, ReferenceTrees, ReferenceBook, ReferenceInflect, ReferencePhono, ReferenceDocs];
    let selectedTab = 0;

    let version: string;
    ipcRenderer.invoke('getVersion').then((v: string) => version = v);

    let platform: string;
    ipcRenderer.invoke('platform').then((p: string) => platform = p);
</script>
{#if typeof $referenceLanguage === 'object'}
    <div class="button-container">
        <p class="version-info">β{version}-{platform} —</p>
        {#each tab_btns as tab, i}
            {#if (tab !== 'Etym.' && tab !== 'Inflect.')
                || (tab === 'Etym.' && $referenceLanguage.ShowEtymology)
                || (tab === 'Inflect.' && $referenceLanguage.ShowInflection)
            }
                <button class:selected={selectedTab === i} class='hover-highlight tab-button'
                    on:click={() => selectedTab = i}
                > {tab}
                </button>
            {/if}
        {/each}
    </div>

    {#each tabs as tab, i}
        <div class:collapsed={selectedTab !== i}>
            <div class="container" style="height:92vh">
                <svelte:component this={tab}/>
            </div>
        </div>
    {/each}
{/if}
