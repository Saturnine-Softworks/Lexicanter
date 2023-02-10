<script lang='ts'>
    import { createEventDispatcher } from 'svelte';

    export let phrase = '';
    export let pronunciation = '';
    export let description = '';

    const dispatch = createEventDispatcher();
    const update = () => dispatch('update');
</script>

<div class="variant-div">
    <input type="text" on:keyup={update} bind:value={phrase}/>
    <input type="text" class="pronunciation" bind:value={pronunciation}>
    <textarea bind:value={description}></textarea>
    <br>
</div>
