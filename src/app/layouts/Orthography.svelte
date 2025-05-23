<svelte:options runes/>
<script lang=ts>
    import { Language, selectedTab } from "../stores";
    import { parseRules, applyRules } from "../utils/sca";
    import type { GraphemyOptions, Orthography } from "../types";
    import { showOpenDialog } from "../utils/files";
    import { graphemify } from "../../interop/interop";
    import Draggable from "../components/Draggable.svelte";
    import { readFile } from "fs";
    import path from "path";
    import { preprocess_ortho } from "../utils/phonetics";
    let selectedOrtho = $state('');
    let testInput = $state('');
    const vex = require('vex-js');

    let orthographyReplacement = $state({
        pattern: '',
        replacement: ''
    });
    let orthographyChangeEndMessage = $state('');

    /**
     * Binding directly to the Language store seems to be very slow, so this function is used to
     * update the store when the user clicks out of an input field.
     * @param event
     * @param attribute
     * @param index
     */
    function setAttribute(event: Event, attribute: keyof Orthography, index: number) {
        const target = event.target as HTMLInputElement;
        let value: string = target.value.trim();

        if (attribute === 'name') {
            if ([value, ...$Language.Orthographies.filter(o => o.name === value)].length-1 > 1) {
                vex.dialog.alert('The name must be unique.');
                target.value = `New Orthography ${index}`;
                return;
            }
            if (value === '') {
                vex.dialog.alert('The name cannot be blank.');
                target.value = `New Orthography ${index}`;
                return;
            }
        }

        $Language.Orthographies[index] = {
            ...$Language.Orthographies[index],
            [attribute]: value
        }

    }

</script>
<div class=tab-pane>
    {#if $selectedTab === 5}
        <Draggable panel=orthography>
            <div class="glasspane container scrolled">
                {#each $Language.Orthographies as orthography, i}
                    <label>Name
                        <input type=text
                            onblur={(e) => {
                                setAttribute(e, 'name', i);
                            }}
                            style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                            value={orthography.name}
                            readonly={orthography.name==='Romanization'}
                        />
                    </label>
                    {#if !orthography.graphemy}
                        <label>Font
                            <input type=text
                                onblur={(e) => {
                                    setAttribute(e, 'font', i);
                                }}
                                style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                                value={orthography.font}
                                readonly={orthography.name==='Romanization'}
                            />
                        </label>
                    {:else} <!-- Graphemy Typesetter Options -->
                        <br>
                        <i>File</i>: <u>{ orthography.font||"No file selected." }</u>
                        <button onclick={() => {
                            showOpenDialog({
                                title: 'Select Graphemy File',
                                properties: ['openFile'],
                            },
                            file_path => {
                                // Intellisense thinks that `file_path` is a string here, but at runtime it is actually an array of one string.
                                readFile(file_path[0], async (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        vex.dialog.alert("There was a problem reading the file.");
                                        return;
                                    }
                                    // let compressed = await compress(data.toString());
                                    console.log(data.toString())
                                    $Language.Orthographies[i].font = path.basename(file_path[0]);
                                    ($Language.Orthographies[i].graphemy as GraphemyOptions).engine = data.toString();
                                });
                            });
                        }}>Locate Graphemy (.gmy) File</button>
                        <br>
                        <div class='narrow'>
                            <div style=display:flex>
                                Maximum Width
                                <input type=range min=0 max=500
                                    bind:value={orthography.graphemy.bounds.width}
                                    onchange={(e)=>{
                                        if (!$Language.Orthographies[i].graphemy.hasOwnProperty('bounds')) return;
                                        ($Language.Orthographies[i].graphemy as GraphemyOptions).bounds.width = Number((e.target as HTMLInputElement).value);
                                    }}
                                />
                                <span class=info style='margin: auto 1em'>{($Language.Orthographies[i].graphemy as GraphemyOptions).bounds.width}</span>
                            </div>
                            <div style=display:flex>
                                Maximum Height
                                <input type=range min=0 max=500
                                    bind:value={orthography.graphemy.bounds.height}
                                    onchange={(e)=>{
                                        if (!$Language.Orthographies[i].graphemy.hasOwnProperty('bounds')) return;
                                        ($Language.Orthographies[i].graphemy as GraphemyOptions).bounds.height = Number((e.target as HTMLInputElement).value);
                                    }}
                                />
                                <span class=info style='margin: auto 1em'>{($Language.Orthographies[i].graphemy as GraphemyOptions).bounds.height}</span>
                            </div>
                        </div>
                    {/if}
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label>Root:
                        {#if orthography.name === 'Romanization'}
                            <span>Base input</span>
                        {:else}
                            <select bind:value={orthography.root}>
                                <option value=ipa>Base from pronunciation</option>
                                <option value=rom>Base from romanization</option>
                            </select>
                        {/if}
                    </label>
                    <br>
                    <p></p>
                    <label>Typesetter:
                        {#if orthography.name === 'Romanization'}
                            <span>Standard typeface</span>
                        {:else}
                            <select bind:value={orthography.typesetter}
                                onchange={(e) => {
                                    let val = (e.target as HTMLInputElement).value as 'standard'|'graphemy';
                                    $Language.Orthographies[i].typesetter = val;
                                    $Language.Orthographies[i].font = ""
                                    $Language.Orthographies[i].graphemy = val === 'standard'? false : {
                                        engine: "",
                                        bounds: {
                                            width: 100,
                                            height: 100,
                                        }
                                    } satisfies GraphemyOptions;
                                }}
                            >
                                <option value=standard> Standard typeface </option>
                                <option value=graphemy> Graphemy </option>
                            </select>
                        {/if}
                    </label>
                    <br>
                    {#if $Language.UseLects && orthography.root === 'ipa'}
                        <label>Lect
                            <select bind:value={orthography.lect}>
                                {#each $Language.Lects as lect}
                                    <option value={lect}>{lect}</option>
                                {/each}
                            </select>
                        </label>
                    {/if}
                    <br>
                    <label>Conversion Rules
                        <!-- svelte-ignore element_invalid_self_closing_tag -->
                        <textarea
                            rows=3
                            class={orthography.name === 'Romanization'? 'text-center' : 'text-left'}
                            onblur={(e) => {
                                setAttribute(e, 'rules', i);
                            }}
                            style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                            value={orthography.rules}
                            readonly={orthography.name === 'Romanization'}
                        ></textarea>
                    </label>
                    {#if orthography.name !== 'Romanization'}
                        <button
                            class="hover-highlight hover-shadow"
                            onclick={() => {
                                $Language.Orthographies = [
                                    ...$Language.Orthographies.slice(0, i),
                                    ...$Language.Orthographies.slice(i + 1)
                                ];
                            }}
                        >Delete</button>
                    {/if}
                {/each}
                <button
                    class="hover-highlight hover-shadow"
                    onclick={() => {
                        $Language.Orthographies = [
                            ...$Language.Orthographies,
                            {
                                name: `New Orthography ${$Language.Orthographies.length}`,
                                font: 'Gentium',
                                root: 'ipa',
                                typesetter: 'standard',
                                graphemy: false,
                                lect: $Language.Lects[0],
                                rules: '',
                                display: true,
                                displayInPhrasebook: true,
                            }
                        ];
                    }}
                >New Orthography</button>
                <br><br>
            </div>
        </Draggable>
        <Draggable panel=orthographytesting>
            <div class="glasspane container scrolled">
                <select bind:value={selectedOrtho}>
                    {#each $Language.Orthographies as orthography}
                        <option value={orthography.name}>{orthography.name}</option>
                    {/each}
                </select>
                <label>Test Input
                    <textarea bind:value={testInput} rows=6></textarea>
                    <svelte:boundary>
                        {@const ortho=$Language.Orthographies.find(o=>o.name===selectedOrtho)}
                        {#if ortho?.typesetter === 'standard'}
                            <textarea
                                rows=6
                                style:background-color=transparent
                                style:font-family={ortho.font || 'Gentium'}
                                value={(() => {
                                    const settings = parseRules(ortho.rules || '');
                                    return applyRules(settings.rules, testInput, settings.categories);
                                })()}
                                readonly
                            ></textarea>
                        {:else if ortho?.typesetter === 'graphemy' && ortho.graphemy}
                            {#await graphemify(
                                ortho.graphemy.engine, 
                                preprocess_ortho(testInput, ortho), 
                                ortho.graphemy.bounds.width, 
                                ortho.graphemy.bounds.height
                            )}
                                <i>generating...</i>
                            {:then svg} 
                                <span class=grapheme-svg>{@html svg}</span>
                            {/await}
                        {/if}
                    </svelte:boundary>
                </label>
            </div>
        </Draggable>
        <Draggable panel=romchangewizard>
            <div class="container glasspane scrolled">
                <label>Change Romanization (Destructive)
                    <div class="narrow">
                        Pattern: <input type='text' bind:value={orthographyReplacement.pattern}/>
                        Replacement: <input type='text' bind:value={orthographyReplacement.replacement}/>
                        <button onclick={
                            () => {
                                for (let word in $Language.Lexicon) {
                                    if (word.includes(orthographyReplacement.pattern)) {
                                        try {
                                            let newWord = '#' + word + '#'
                                            let pattern = orthographyReplacement.pattern.replaceAll('^', '#')
                                            newWord = newWord.replaceAll(pattern, orthographyReplacement.replacement)
                                            $Language.Lexicon[newWord] = $Language.Lexicon[word];
                                            delete $Language.Lexicon[word];
                                            orthographyChangeEndMessage = 'Change applied successfully.';
                                        } catch (e) {
                                            console.log(e);
                                            orthographyChangeEndMessage = 'An error occurred while applying the change. Please contact the developer for assistance and check the console.';
                                        }
                                    }
                                }
                            }
                        }>Apply</button>
                        <span style:color=red>{orthographyChangeEndMessage}</span>
                    </div>
                </label>
            </div>
        </Draggable>
    {/if}
</div>
