<script lang='ts'>
    import { referenceLanguage } from '../../stores';
    import type { Language } from '../../types';
    import { get_pronunciation } from '../../utils/phonetics';
    let Language = $referenceLanguage as Language;
    $: Language = $referenceLanguage as Language;
    let selectedLect = Language.Lects[0];
    let testString = '';
</script>
<div class='scrolled' style='height: 100%'>
    <label>Pronunciations
        <select bind:value={selectedLect}>
            {#each Language.Lects as lect}
                <option value={lect}>{lect}</option>
            {/each}
        </select>
    </label>
    <textarea rows='12' class='pronunciation text-left' value={Language.Pronunciations[selectedLect]} readonly/>
    <textarea rows='2' bind:value={testString} />
    <textarea rows='3' class='pronunciation' value={get_pronunciation(testString, selectedLect, Language)} readonly/>

    <br><hr/><br>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    {#each Object.entries(Language.Phonotactics.General) as [pos, phones]}
        <label>{pos}
            <p class='pronunciation'>{phones}</p>
        </label><br>
    {/each}
</div>
