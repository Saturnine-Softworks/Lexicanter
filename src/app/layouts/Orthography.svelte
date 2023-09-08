<script lang='ts'>
    import { Language } from "../stores";
    import { parseRules, applyRules } from "../utils/sca";
    let selectedOrtho = '';
    let testInput = '';
    const vex = require('vex-js');

    let orthographyReplacement = {
        pattern: '',
        replacement: ''
    };
    let orthographyChangeEndMessage = '';

    /**
     * Binding directly to the Language store seems to be very slow, so this function is used to
     * update the store when the user clicks out of an input field.
     * @param event
     * @param attribute
     * @param index
     */
    function setAttribute(event: Event, attribute: string, index: number) {
        const target = event.target as HTMLInputElement;
        const value = target.value.trim();

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

        $Language.Orthographies[index][attribute] = value;
    }
</script>
<div class=tab-pane>
    <div class=row style:height=100%>
        <div class="column container scrolled" style:height=92vh>

            {#each $Language.Orthographies as orthography, i}
                <label>Name
                    <input type=text 
                        on:blur={(e) => {
                            setAttribute(e, 'name', i);
                        }}
                        style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                        value={orthography.name}
                        readonly={orthography.name==='Romanization'}
                    />
                </label>
                <label>Font
                    <input type=text 
                        on:blur={(e) => {
                            setAttribute(e, 'font', i);
                        }}
                        style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                        value={orthography.font}
                        readonly={orthography.name==='Romanization'}
                    />
                </label>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label>Root
                    {#if orthography.name === 'Romanization'}
                        <span>: Base input</span>
                    {:else}
                        <select bind:value={orthography.root}>
                            <option value=ipa>Base from pronunciation</option>
                            <option value=rom>Base from romanization</option>
                        </select>
                    {/if}
                </label>
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
                    <textarea
                        rows=3
                        class={orthography.name === 'Romanization'? 'text-center' : 'text-left'}
                        on:blur={(e) => {
                            setAttribute(e, 'rules', i);
                        }}
                        style:background-color={orthography.name === 'Romanization' ? 'transparent' : ''}
                        value={orthography.rules}
                        readonly={orthography.name === 'Romanization'}
                    />
                </label>
                {#if orthography.name !== 'Romanization'}
                    <button
                        class="hover-highlight hover-shadow"
                        on:click={() => {
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
                on:click={() => {
                    $Language.Orthographies = [
                        ...$Language.Orthographies,
                        {
                            name: `New Orthography ${$Language.Orthographies.length}`,
                            font: 'Gentium',
                            root: 'ipa',
                            lect: $Language.Lects[0],
                            rules: '',
                            display: true
                        }
                    ];
                }}
            >New Orthography</button>
        </div>
        <div class="column container scrolled" style:height=92vh>
            <select bind:value={selectedOrtho}>
                {#each $Language.Orthographies as orthography}
                    <option value={orthography.name}>{orthography.name}</option>
                {/each}
            </select>
            <label>Test Input
                <textarea bind:value={testInput} rows=6/>
                <textarea
                    rows=6
                    style:background-color=transparent
                    style:font-family={$Language.Orthographies.find(o => o.name === selectedOrtho)?.font || 'Gentium'}
                    value={(() => {
                        const settings = parseRules($Language.Orthographies.find(o => o.name === selectedOrtho)?.rules || '');
                        return applyRules(settings.rules, testInput, settings.categories);
                    })()}
                    readonly
                />
            </label>
            <br>
            <label>Change Orthography
                <div class="narrow">
                    Pattern: <input type='text' bind:value={orthographyReplacement.pattern}/>
                    Replacement: <input type='text' bind:value={orthographyReplacement.replacement}/>
                    <button on:click={
                        () => {
                            for (let word in $Language.Lexicon) {
                                if (word.includes(orthographyReplacement.pattern)) {
                                    try { 
                                        $Language.Lexicon[word.replace(orthographyReplacement.pattern, orthographyReplacement.replacement)] = $Language.Lexicon[word];
                                        delete $Language.Lexicon[word];
                                        orthographyChangeEndMessage = 'Change applied successfully.';
                                        window.setTimeout(() => {
                                            orthographyChangeEndMessage = '';
                                        }, 15000);
                                    } catch (e) {
                                        console.log(e);
                                        orthographyChangeEndMessage = 'An error occurred while applying the change. Please contact the developer for assistance and check the console.';
                                        window.setTimeout(() => {
                                            orthographyChangeEndMessage = '';
                                        }, 30000);
                                    }
                                }
                            }
                        }
                    }>Apply</button>
                    <span style:color=red>{orthographyChangeEndMessage}</span>
                </div>
            </label>

        </div>
    </div>
</div>
