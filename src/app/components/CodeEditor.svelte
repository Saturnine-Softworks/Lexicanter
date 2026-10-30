<script lang=ts>
    import type { Syntax, Theme } from "../syntax/syntax";
    let { 
        content = $bindable(),
        highlight = $bindable((input, _s, _t) => {return input}),
        syntax = $bindable(),
        theme = $bindable()
    } : {
        content: string, 
        highlight: (arg0: string, arg1: Syntax, arg2: Theme) => string,
        syntax: Syntax,
        theme: Theme
    } = $props();
    function handle () {
        (document.getElementById('--code-editor-highlighting') as HTMLPreElement)
        .innerHTML = highlight(
        (document.getElementById('--code-editor-editing') as HTMLTextAreaElement).value,
        syntax, theme
        )
    }
    function sync_scroll() {
        let hl = document.getElementById('--code-editor-highlighting');
        let e  = document.getElementById('--code-editor-editing')
        hl!.scrollTop = e!.scrollTop;
        hl!.scrollLeft = e!.scrollLeft;
    }
</script>
<style>
    .--code-editor-container {
        position: relative;
        margin: 2em auto;
        padding: 10px;
        height: 80%;
        width: 80%;
        resize: both;
        overflow: hidden;
    }
    #--code-editor-editing, #--code-editor-highlighting {
        margin: 0px;
        padding: 10px;
        border: 0;
        width: calc(100% - 20px);
        max-width: calc(100% - 20px);
        height: calc(100% - 20px);
        max-height: calc(100% - 20px);
        position: absolute;
        top: 0;
        left: 0;
        overflow: auto;
        white-space: pre; /* Allows textarea to scroll horizontally */
        font-size: 15pt !important;
        font-family: monospace;
        line-height: 20pt;
    }
    #--code-editor-editing {
        z-index: 1; /* Move the textarea in front of the highlighted output */
        color: transparent;
        background: transparent;
        caret-color: white;
        resize: none;
    }
    #--code-editor-highlighting {
        z-index: 0;
    }
</style>
<div class=--code-editor-container>
    <pre id=--code-editor-highlighting></pre>
    <textarea
    id=--code-editor-editing
    bind:value={content}
    oninput={handle}
    onscroll={sync_scroll}
    spellcheck=false
    ></textarea>
</div>