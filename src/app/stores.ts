import { get, writable, type Writable } from 'svelte/store';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import type * as Lexc from './types'; 

const defaultPanel = {
    top: 25,
    left: 0,
    height: 90,
    width: 140,
}
export const defaultPanelPositions = {
    newword: {
        ...defaultPanel,
        top: 115,
        height: 810,
        width: 280,
    },
    lexicon: {
        top: 115,
        left: 280,
        width: 1120,
        height: 810,
    },
    alphabet: {
        ...defaultPanel,
        width: 1400,
        height: 90,
    },
    pronunciation: {
        ...defaultPanel,
        left: 700,
        width: 700,
        height: 900,
    },
    wordgenerator: {
        ...defaultPanel,
        width: 700,
        height: 900,
    },
    settings: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    files: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    phrasebook: {
        ...defaultPanel,
        left: 420,
        width: 980,
        height: 900,
    },
    phrasecategories: {
        ...defaultPanel,
        height: 450,
        width: 420,
    },
    newphrase: {
        ...defaultPanel,
        top: 475,
        height: 450,
        width: 420,
    },
    orthographytesting: {
        ...defaultPanel,
        left: 980,
        width: 420,
        height: 650,
    },
    orthography: {
        ...defaultPanel,
        width: 980,
        height: 900,
    },
    romchangewizard: {
        top: 650,
        left: 980,
        height: 250,
        width: 420,
    },
    etymologyselect: {
        ...defaultPanel,
        width: 280,
        height: 900,
    },
    etymologyeditor: {
        ...defaultPanel,
        left: 280,
        width: 1120,
        height: 900,
    },
    documentation: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    changelog: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    inflections: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    help: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    }
};

export const defaultPanelSnap = {
    x: 140,
    y: 90,
    rows: 10,
    columns: 10,
    proportional: true,
};

export const defaultWindow = {
    height: 900,
    width: 1400,
}

export const CurrentLayouts: Writable<Lexc.Layouts> = writable({
    positions: defaultPanelPositions,
    snapping: defaultPanelSnap,
    window: defaultWindow,
});

const Default: Lexc.Language = {
    Version: '2.1.15',
    FileVersion: '0',
    Name: 'Unnamed Language',
    CaseSensitive: false,
    IgnoreDiacritics: true,
    ShowEtymology: false,
    ShowInflection: false,
    Inflections: [],
    UseLects: false,
    HeaderTags: '',
    Alphabet: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
    ShowAlphabet: true,
    Lexicon: <Lexc.Lexicon> { },
    Etymologies: <Lexc.Etymologies> { },
    Relatives: { },
    Pronunciations: <Lexc.Pronunciations> {
        General: 'Use this field to write pronunciation rules to automatically transcribe your orthography in IPA. For example,\n'
        + 'th > θ\n'
        + 'This rule will automatically transcribe any ⟨th⟩ in your orthography as [θ].\n'
        + 'Rules can be much more complex than this. You can read the section on pronunciation rules in the Help tab for more information.\n\n'
        + 'The most common mistake has to do with the fact that rules are applied in order from top to bottom. For example, if you have the following rules,\n' 
        + 'e > ɛ\n'
        + 'ae > æ\n'
        + 'then the second rule will never be applied, because the first rule will always change ⟨e⟩ to [ɛ] before the second rule can be applied.\n'
        + 'The solution in almost all cases like this is to change the order of the rules so that the ones with the longest patterns are applied first.\n'
        + 'ae > æ\n'
        + 'e > ɛ\n'
        + 'Now both rules will be applied correctly. You can test this by removing the first set of rules from this demo.'
    },
    Orthographies: <Lexc.Orthography[]> [{
        name: 'Romanization',
        font: 'Gentium',
        root: 'rom',
        lect: 'General',
        graphemy: false,
        rules: 'Your romanized orthography is the base form of input.',
        display: true,
        displayInPhrasebook: true, // requested by Maarz
    }],
    ShowOrthography: false,
    ShowPronunciation: true,
    Phonotactics: <Lexc.Phonotactics> {
        General: <Lexc.PhonotacticsLect> {
            Onsets: '',
            Medials: '',
            Codas: '',
            Vowels: '',
            Illegals: '',
        }
    },
    UseAdvancedPhonotactics: false,
    AdvancedPhonotactics: <Lexc.AdvancedPhonotactics> {
        Categories: { },
        Syllables: [ ],
        Constructs: [{enabled:true, structures:''}],
        Illegals: [ ],
    },
    Lects: ['General'],
    Phrasebook: <Lexc.Phrasebook> { },
    ShowPhrasebook: false,
    Docs: <OutputData> {
        blocks: [ ]
    },
    Diagnostics: <Lexc.Diagnostic[]> [ ],
    FileTheme: 'default',
    Layouts: {
        positions: defaultPanelPositions,
        snapping: defaultPanelSnap,
        window: defaultWindow,
    },
    OrderByDate: false,
    SaveLocation: '',
    UploadToDatabase: false,
};
export const defaultLanguage: Writable<Lexc.Language> = writable(Default);

// Initial state for the language data
export const Language: Writable<Lexc.Language> = writable(structuredClone(Default));

export const selectedTab = writable(0);

// Initial states for all the global variables across the app
type PronunciationInputs = {
    [index: string]: string
}
export const wordInput = writable('');
export const pronunciations: Writable<PronunciationInputs> = writable((()=>{
    const inputs: PronunciationInputs = {};
    for (const lect of get(Language).Lects) {
        inputs[lect] = '';
    }
    return inputs;
})());

export const phraseInput = writable('');
export const phrasePronunciations: Writable<PronunciationInputs> = writable((()=>{
    const inputs: PronunciationInputs = {};
    for (const lect of get(Language).Lects) {
        inputs[lect] = '';
    }
    return inputs;
})());

export const categoryInput = writable('');
export const selectedCategory = writable('');

export const docsEditor: Writable<EditorJS> = writable(new EditorJS());

export const theme = writable('styles/dark.css');
export const autosave = writable(true);
export const fileLoadIncrement = writable(0);

export const hideDropdowns = writable(false);

export const dbid = writable(''); 
export const dbkey = writable('');
