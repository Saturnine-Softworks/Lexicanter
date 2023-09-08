/**
 * @file Custom types for the language data.
 */

import type { OutputData } from '@editorjs/editorjs';

export type Diagnostic = {
    Time: string,
    Version: string,
    OS: string,
    Action: string,
    Error?: string,
}

/**
 * `Sense` is an object with a `definition` string, a `dialects` array of strings, and a `tags` array of strings.
 * @property {string} definition - The definition for this sense of a word.
 * @property {string[]} dialects - The specific lects to which this sense applies. A blank array indicates that the sense is present in all dialects.
 * @property {string[]} tags - The tags for this sense of a word.
 */
export type Sense = {
    definition: string;
    lects: string[];
    tags: string[];
}

/**
 * `EntryPronunciations` objects store the pronunciations of a word in each lect.
 * @property {string} [index: string] - string;
 */
export type EntryPronunciations = {
    [index: string]: {
        ipa: string;
        irregular: boolean;
    }
}

/**
 * A Word is an object with a pronunciation and an array of Senses.
 * @property {string} pronunciation - The pronunciation of the word.
 * @property {Sense[]} Senses - An array of Sense objects.
 */
export type Word = {
    pronunciations: EntryPronunciations;
    Senses: Sense[];
}

/**
 * Lexicon is an object whose keys are strings and whose values are Words.
 * @property {Word} [index: Word] - This is the type of the index of the object. 
 * The index is a string, and the value is a {@link Word}.
 */
export type Lexicon = {
    [index: string]: Word;
}

/**
 * A Variant is an object with a pronunciation and a description.
 * @property {string} pronunciations - The pronunciations of the variant phrase.
 * @property {string} description - The description of the variant phrase.
 */
export type Variant = {
    pronunciations: EntryPronunciations;
    description: string;
}

/**
 * `Phrase` is an object with a `pronunciation` string, a `description` string, and a `variants` object
 * whose keys are strings and whose values are {@link Variant}s.
 * @property {string} pronunciation - The pronunciation of the phrase.
 * @property {string} description - The description of the phrase.
 * @property {Object} variants - This is a dictionary of all the variants of the phrase. The key is the variant
 * phrase string, and the value is the Variant object.
 */
export type Phrase = {
    pronunciations: EntryPronunciations;
    description: string;
    lects: string[];
    tags: string[];
    variants: { [index: string]: Variant };
}

export type PhraseCategory = {
    [index: string]: Phrase;
}

/**
 * A Phrasebook is an object that has a string indices and {@link Phrase} values.
 * @property {Phrase} [index: Phrase] - Phrase
 */
export type Phrasebook = {
    [index: string]: PhraseCategory;
}

/**
 * The `Dialect` type has five properties, each of which is an array of strings.
 * @property {string[]} Onsets - The possible consonants and clusters that can start a word.
 * @property {string[]} Medials - The medial consonants and clusters that can be used word-medially.
 * @property {string[]} Codas - The consonants and clusters that can appear at the end of a word.
 * @property {string[]} Vowels - The vowels that can be used in the language.
 * @property {string[]} Illegals - These are the combinations that are not allowed in the language.
 */
export type PhonotacticsLect = {
    Onsets: string;
    Medials: string;
    Codas: string;
    Vowels: string;
    Illegals: string;
}

/**
 * `Phonotactics` is an object whose keys are strings and whose values are {@link PhonotacticsLect}s.
 * @property {Dialect} [index: Dialect] - The name of the dialect and its corresponding {@link PhonotacticsLect} object.
 */
export type Phonotactics = {
    [index: string]: PhonotacticsLect;
}

export type AdvancedPhonotactics = {
    Categories: {
        [index: string]: string[];
    }
    Syllables: string[];
}

/**
 * `Pronunciations` is a type that is used to represent the values of the text inputs for each dialect from the 
 * Pronunciations field in the Phonology tab. 
 * @property {string} [index: string] - string;
 */
export type Pronunciations = {
    [index: string]: string;
}

/**
 * `Descendant` is a type that is used to represent a child entry of a word. 
 * @property {string} word - The name of the parent entry.
 * @property {string | ['current language']} source - The name of the language in which the parent entry is written, or
 * 'current language' if the parent entry was chosen from the lexicon.
 */ 
export type Descendant = {
    name: string;
    source: '<< THIS LANGUAGE >>' | string;
}

export type Etymologies = {
    [index: string]: {
       descendants: Descendant[];
       source: '<< THIS LANGUAGE >>' | string;
    };
}

export type Orthography = {
    name: string;
    font: string;
    root: 'rom' | 'ipa';
    lect: string;
    rules: string;
    display: boolean;
}

/**
 * A language is a collection of words, phrases, organization and configuration settings, and sets of pronunciation rules.
 * Below are all the places where the name of key should be the name of a lect:
 * ```
 * Language.Lexicon.Word.pronunciations[lect]
 * Language.Phrasebook.Phrase.pronunciations[lect]
 * Language.Phrasebook.Phrase.Variant.pronunciations[lect]
 * Language.Phonotactics[lect]
 * Language.Pronunciations[lect]
 * ```
 * Additionally, the values of the following keys should be arrays of lect names:
 * ```
 * Language.Lexicon.Word.Senses.lects
 * Language.Phrasebook.Phrase.lects
 * Language.Phrasebook.Phrase.variants.lects
 * ```
 * @property {number} Version - The version of the app which the language was saved with. This is used to determine how to load the language.
 * @property {string} Name - The name of the language.
 * @property {Lexicon} Lexicon - A {@link Lexicon} object that contains all the words in the language.
 * @property {Phrasebook} Phrasebook - A {@link Phrasebook} object that contains all the phrases in the language.
 * @property {string} Alphabet - Space-separated tokens representing the alphabetization order for the lexicon.
 * @property {string} Pronunciations - The values of the text inputs for each dialect from the Pronunciations field in the Phonology tab.
 * @property {Phonotactics} Phonotactics - A {@link Phonotactics} object that contains the phonotactics rules.
 * @property {OutputData} Docs - An {@link OutputData} object that contains the documentation for the language saved by EditorJS.
 * @property {string} HeaderTags - This is a string of lexicon tags that will be placed at the top of the lexicon display.
 * @property {boolean} CaseSensitive - Whether or not alphabetization and pronunciation rules are case sensitive.
 * @property {boolean} IgnoreDiacritics - Whether or not alphabetization and pronunciation rules ignore diacritics.
 */
export type Language = {
    Version: string;
    Name: string;
    Lexicon: Lexicon;
    Etymologies: Etymologies;
    Relatives: { [index: string]: Lexicon }
    Inflections: { tags: string[], filter: string, tables: OutputData, categories: string }[];
    ShowInflection: boolean;
    Phrasebook: Phrasebook;
    Alphabet: string;
    Pronunciations: Pronunciations;
    Orthographies: Orthography[];
    ShowPronunciation: boolean;
    ShowOrthography: boolean;
    Phonotactics: Phonotactics;
    UseAdvancedPhonotactics: boolean;
    AdvancedPhonotactics: AdvancedPhonotactics;
    Lects: string[];
    Docs: OutputData;
    HeaderTags: string;
    CaseSensitive: boolean;
    IgnoreDiacritics: boolean;
    ShowEtymology: boolean;
    UseLects: boolean;
    Diagnostics: Diagnostic[];
    FileTheme: string;
}
