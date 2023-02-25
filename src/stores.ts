import { get, writable, type Writable } from 'svelte/store';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import type * as Lexc from './scripts/types'; 

// Initial state for the language data
export let Language: Writable<Lexc.Language> = writable({
    Version: '2.0.0',
    Name: 'Unnamed Language',
    CaseSensitive: false,
    IgnoreDiacritics: true,
    HeaderTags: '',
    Lexicon: <Lexc.Lexicon> { },
    Alphabet: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
    Pronunciations: <Lexc.Pronunciations> {
        General: 'th > θ'
    },
    Phonotactics: <Lexc.Phonotactics> {
        General: <Lexc.PhonotacticsLect> {
            Onsets: [ ],
            Medials: [ ],
            Codas: [ ],
            Vowels: [ ],
            Illegals: ['÷']
        }
    },
    Lects: ['General'],
    Phrasebook: <Lexc.Phrasebook> { },
    Docs: <OutputData> {
        blocks: [ ]
    },
    Diagnostics: <Lexc.Diagnostic[]> [ ]
});

// Initial states for all the global variables across the app
export let wordInput = writable('');
export let wordPronunciation = writable('');

export let phraseInput = writable('');
export let phrasePronunciation = writable('');
export let categoryInput = writable('');
export let selectedCategory = writable('');

export let pronunciationRules: Writable<Lexc.PronunciationRules> = writable({General: {th: 'θ'}});

export let docsEditor = writable(new EditorJS);

export let theme = writable('styles/dark.css');
export let autosave = writable(true);
export let useDialects = writable(false);

get(Language).Phonotactics
