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
    UseLects: false,
    HeaderTags: '',
    Alphabet: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
    Lexicon: <Lexc.Lexicon> { },
    Etymologies: <Lexc.Etymologies> { },
    Relatives: { },
    Pronunciations: <Lexc.Pronunciations> {
        General: 
            `You can use this text field to define pronunciation rules for your language’s orthography. Rules are each defined on a separate line, like so:
            th > θ
            This rule will replace all instances of ‘th’ with the phoneme ‘θ’ for its pronunciation, which appears underneath each word in the lexicon.
            \nCategories can also be defined as so:
            V:: a, e, i, o, u
            \nCategories can be used in a number of ways. The following rule will replace all instances of ‘n’ with ‘m’ if the preceding character is a vowel:
            Vn > Vm
            Using another category, we can automatically convert all members of one category to another:
            L:: aː, eː, iː, oː, uː
            VV > L∅
            This rule will replace all double vowels (e.g. ‘aa’) with long vowels (e.g. ‘aː’). The null character ∅ is used to keep the left and right sides 
            of the rule the same length. All ‘∅’ characters are removed from the output.
            \nThe following extra categories and rule can be used to convert any vowel pair to a diphthong:
            D:: a̯, e̯, i̯, o̯, u̯
            2:: a, e, i, o, u
            V2 > VD
            A duplicate vowel category is needed (2) because only the first occurrence of each category used in a rule is able to be checked. 
            In other words, VV checks ‘aa, ‘ee’, ‘ii’, ‘oo’, and ‘uu’, but not ‘ae’, ‘ai’, ‘ao’, etc.
            \nThe underscore character can be used to represent any character. The following rule replaces every ‘y’ with ‘ɪ’ if it is followed by any character:
            y_ > ɪ_
            \nAnd the caret character can be used to represent the edge of a word. The following rule replaces every ‘y’ with ‘i’ if it is the last character in a word:
            y^ > i^
            \nAll lines in this text field which do not have a double-colon or greater-than sign are ignored so that you can annotate your rules as needed. 
            \nIf you experience technicaly difficulties or there appear to be bugs with these features, please contact the developer.`.replaceAll('            ', '')
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

get(Language).Phonotactics;
