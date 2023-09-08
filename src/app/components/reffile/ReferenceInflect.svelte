<script lang='ts'>
    import { referenceLanguage } from '../../stores';
    import type { Language } from '../../types';
    let Language = $referenceLanguage as Language;
    $: Language = $referenceLanguage as Language;
    import EditorJS from '@editorjs/editorjs';
    import Table from '@editorjs/table';
    import Header from '@editorjs/header';
    import Underline from '@editorjs/underline';
    import { Monospace } from '../../utils/docs';
    enum LogLevels { // REVIEW - monkeypatch gets around type check error, can't import this from @editorjs/editorjs/types for ...reasons.
        VERBOSE = 'VERBOSE',
        INFO = 'INFO',
        WARN = 'WARN',
        ERROR = 'ERROR',
    }
    let editors: EditorJS[] = [];

    function writeEditors(exclude: number) {
        for (let i = editors.length; i > 0; i--) {
            editors[i-1].destroy();
            editors.pop();
        }
        Language.Inflections.filter((_, j) => j !== exclude).forEach((inflection, i) => {
            const config = {
                holder: `ref inflection ${i}`,
                data: inflection.tables,
                tools: {
                    underline: Underline,
                    monospace: Monospace,
                    table: {
                        class: Table,
                        inlineToolbar: true,
                        config: {
                            rows: 3,
                            cols: 3,
                            withHeadings: true,
                        },
                    },
                    header: {
                        class: Header,
                        inlineToolbar: true,
                    }
                },
                minHeight: 30,
                logLevel: LogLevels.ERROR,
                readOnly: true
            }
            const editor = new EditorJS(config);
            editors.push(editor);
        });
    }

    import { onMount } from 'svelte';
    onMount(() => {
        writeEditors(Infinity);
    });
</script>
<div class="scrolled" style="height: 100%">
    {#each Language.Inflections as inflection, i}
        <div class="row" style="width:66%">
            <div class="column">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label>Tags
                    <div> <p class='lex-body'>{inflection.tags.join(' ')}</p> </div>
                </label>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label>RegEx Filter
                    <div> <p class='lex-body'>/{inflection.filter}/</p> </div>
                </label>
            </div>
            <div class="column">
                <label>Rule Categories
                    <div>
                        <textarea class="text-left pronunciation" rows="3" value={inflection.categories} readonly/>
                    </div>
                </label>
            </div>
        </div>
        <div class='codex-editor' id={`ref inflection ${i}`} style='font-family: Gentium'></div>
        <br><br>
    {/each}
</div>
