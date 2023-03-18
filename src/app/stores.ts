import { get, writable, type Writable } from 'svelte/store';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import type * as Lexc from './types'; 

// Initial state for the language data
export const Language: Writable<Lexc.Language> = writable({
    Version: '2.0.0',
    Name: 'Unnamed Language',
    CaseSensitive: false,
    IgnoreDiacritics: true,
    ShowEtymology: false,
    ShowInflection: false,
    Inflections: [],
    UseLects: false,
    HeaderTags: '',
    Alphabet: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
    Lexicon: <Lexc.Lexicon> { },
    Etymologies: <Lexc.Etymologies> { },
    Relatives: { },
    Pronunciations: <Lexc.Pronunciations> {
        General: 'place > holder'
    },
    Phonotactics: <Lexc.Phonotactics> {
        General: <Lexc.PhonotacticsLect> {
            Onsets: '',
            Medials: '',
            Codas: '',
            Vowels: '',
            Illegals: '',
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

export const docsEditor = writable(new EditorJS);

export const theme = writable('styles/dark.css');
export const autosave = writable(true);
export const fileLoadIncrement = writable(0);

get(Language).Phonotactics;
