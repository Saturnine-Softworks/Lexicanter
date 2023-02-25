<script lang="ts">
    import { Language } from "../stores";
    export let definition = '';
    export let tags: string
    $: tags;
    export let lects: string[] = ['General'];
</script>

<br>
<label>Definition
    <textarea rows="6" bind:value={definition}></textarea>
</label>
<br>
<label for="tags">Tags</label>
<textarea id="tags" rows="1" bind:value={tags}></textarea>
<select multiple bind:value={lects}>
    {#each $Language.Lects as lect}
        <option value={lect}>{lect}</option>
    {/each}
</select>
