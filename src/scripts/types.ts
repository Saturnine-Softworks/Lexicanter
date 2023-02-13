import type { OutputData } from "@editorjs/editorjs";

export interface Sense {
    pronunciation: string;
    definition: string;
    tags: string[];
}
export interface Word {
    [index: number]: Sense;
}
export interface Lexicon {
    [index: string]: Word;
}
export interface Variant {
    pronunciation: string;
    description: string;
}
export interface Phrase {
    pronunciation: string;
    description: string;
    variants: { [index: string]: Variant };
}
export interface Phrasebook {
    [index: string]: Phrase;
}
export interface Language {
    Version: number;
    Name: string;
    Lexicon: Lexicon;
    Phrasebook: Phrasebook;
    Alphabet: string;
    Romanization: string;
    Phonotactics: {
        Onsets: string[];
        Medials: string[];
        Codas: string[];
        Vowels: string[];
        Illegals: string[];
    }
    Docs: OutputData;
    HeaderTags: string;
    CaseSensitive: boolean;
    IgnoreDiacritics: boolean;
}
