<svelte:options runes/>
<script lang='ts'>
    import { Language, fileLoadIncrement, selectedTab } from '../stores';
    import EditorJS, { type EditorConfig } from '@editorjs/editorjs';
    import Draggable from '../components/Draggable.svelte';
    import Table from '@editorjs/table';
    import Header from '@editorjs/header';
    import Underline from '@editorjs/underline';
    const vex = require('vex-js');
    enum LogLevels { // REVIEW - monkeypatch gets around type check error, can't import this from @editorjs/editorjs/types for ...reasons.
        VERBOSE = 'VERBOSE',
        INFO = 'INFO',
        WARN = 'WARN',
        ERROR = 'ERROR',
    }
    function changeTags(e: Event, i: number) {
        const element = e.currentTarget as HTMLInputElement;
        $Language.Inflections[i].tags = element.value.split(/\s+/g);
    }

    function remakeEditors(exclude: number) {
        for (let i = editors.length; i > 0; i--) {
            editors[i-1].destroy();
            editors.pop();
        }
        $Language.Inflections.filter((_, j) => j !== exclude).forEach((inflection, i) => {
            const config = {
                holder: `inflection ${i}`,
                data: inflection.tables,
                tools: {
                    underline: Underline,
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
            }
            const editor = new EditorJS(config as unknown as EditorConfig);
            editors.push(editor);
        });
    }

    let incrementCheck = 0;
    $effect(() => {
        if ($fileLoadIncrement !== incrementCheck) {
            incrementCheck = $fileLoadIncrement;
            remakeEditors(-1);
        }
    })

    function addEditor() {
        const config = {
            holder: `inflection ${$Language.Inflections.length - 1}`,
            data: {
                blocks: [
                    {
                        type: 'header',
                        data: {
                            text: 'New Inflections Group',
                            level: 1
                        }
                    },
                    {
                        type: 'table',
                        data: {
                            withHeadings: false,
                            content: [
                                ['', '', ''],
                                ['', '', ''],
                                ['', '', '']
                            ]
                        }
                    },
                    {
                        type: 'paragraph',
                        data: {
                            text: 'Table cells containing sound change rules will be used to generate inflected forms. \
                            Apply them to your words in your lexicon by providing the lexicon tags they apply to and an \
                            optional Regular Expression filter.'
                        }
                    }
                ]
            },
            tools: {
                underline: Underline,
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
        }
        const editor = new EditorJS(config as unknown as EditorConfig);
        editors.push(editor);
    }
    async function saveEditors(): Promise<string> {
        for (let i = 0; i < editors.length; i++) {
            editors[i].save().then((outputData) => {
                $Language.Inflections[i].tables = outputData;
            }).catch((error) => {
                console.error(`Error while saving editor.\nindex: ${i}\nobject at i: ${editors[i]}\neditors.length: ${editors.length}\nmessage:\n ${String(error)}`);
            });
            await editors[i].isReady;
        }
        // $Language.Inflections = $Language.Inflections; // svelte 3/4 assignment update trigger
        return 'done';
    }

    let editors: EditorJS[] = [];

</script>
<div class=tab-pane spellcheck={false}>
    <div hidden={!$selectedTab.includes(3)}>
        <Draggable panel=inflections auto_maximize={$selectedTab.includes(3) && $Language.Layouts.tabmode==='switch'}>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class=row style=height:97%>
                <div class='container column scrolled' onfocusout={saveEditors}>

                    {#each $Language.Inflections as inflection, i}
                    
                        <div class=row style=width:66%>
                            <div class=column>
                                <label>Tags
                                    <div>
                                        <textarea rows=1 onchange={ (e) => changeTags(e, i) } value={inflection.tags.join(' ')}></textarea>
                                    </div>
                                </label>
                                <label>RegEx Filter
                                    <div>
                                        <p style='display: inline'>/</p>
                                        <input style='display: inline' type='text' bind:value={inflection.filter} />
                                        <p style='display: inline'>/</p>
                                    </div>
                                </label>
                            </div>
                            <div class="column">
                                <label>Rule Categories
                                    <div>
                                        <textarea class=text-left rows=3 bind:value={inflection.categories}></textarea>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Table Editor -->
                        <div class=codex-editor id={`inflection ${i}`} style='font-family: Gentium'></div>
                        
                        <div class=narrow>
                            <!-- Delete Inflections Group Button -->
                            <button class='hover-highlight hover-shadow' style='display: inline' onclick={()=>{
                                vex.dialog.confirm({
                                    message: 'Are you sure you want to delete this inflection group? This action is irreversible.',
                                    callback: (response: boolean) => {
                                        if (response) {
                                            saveEditors();
                                            window.setTimeout(() => {
                                                remakeEditors(i);
                                                $Language.Inflections = $Language.Inflections.filter((_, index) => index !== i);
                                            }, 666);
                                        }
                                    }
                                })
                            }}>Delete</button>
                        
                        </div>

                        <br><br>
                    {/each}

                    <!-- Add Inflections Group Button -->
                    <button style='hover-highlight hover-shadow' onclick={() => {
                        saveEditors().then(() => {
                            $Language.Inflections = [
                                ...$Language.Inflections,
                                {
                                    tags: [],
                                    filter: '.+',
                                    categories: '',
                                    tables: {
                                        blocks: [
                                            {
                                                type: 'header',
                                                data: {
                                                    text: 'New Inflections Group',
                                                    level: 1
                                                }
                                            },
                                            {
                                                type: 'table',
                                                data: {
                                                    withHeadings: false,
                                                    content: [
                                                        ['', '', ''],
                                                        ['', '', ''],
                                                        ['', '', '']
                                                    ]
                                                }
                                            },
                                            {
                                                type: 'paragraph',
                                                data: {
                                                    text: 'Table cells containing sound change rules will be used to generate inflected forms. \
                                                    Apply them to your words in your lexicon by providing the lexicon tags they apply to and an \
                                                    optional Regular Expression filter.'
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                            addEditor();
                        });
                    }}>Add Inflections Group</button>
                </div>
            </div>
        </Draggable>
    </div>
</div>
