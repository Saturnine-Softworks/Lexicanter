// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as diagnostics from './diagnostics';
import { get } from 'svelte/store';
import { Language } from '../stores';
import type * as Lexc from '../types';
const Lang = () => get(Language);

/**
 * Takes a Lexicon object and returns an array of words in the alphabetical order
 * of the language, defined by the Alphabet property in the language file, and 
 * with the any words which contain any HeaderTags at the top.
 * @param lexicon - the lexicon object
 * @returns An array of words, sorted by the alphabetical order of the language.
 */
export function alphabetize(lexicon: Lexc.Lexicon): string[] {
    let priority_tags = Lang().HeaderTags.toLowerCase().trim().split(/\s+/);
    if (!priority_tags[0]) priority_tags = [];
    let $alphabet = Lang().Alphabet;
    const $ignore_diacritics = Lang().IgnoreDiacritics;
    const $case_sensitive = Lang().CaseSensitive;
    const all_words = structuredClone(lexicon);
    const tag_ordered_lexes = [];
    for (const tag of priority_tags) {
        tag_ordered_lexes.push([]);
        for (const word in all_words) {
            if ((():string[] => {
                const tags = [];
                all_words[word].Senses.forEach((sense: Lexc.Sense) => {
                    tags.push(...sense.tags);
                });
                return tags;
            })().includes(tag)) {
                tag_ordered_lexes[tag_ordered_lexes.length - 1].push(word);
            }
        }
        for (const w of tag_ordered_lexes[tag_ordered_lexes.length - 1]) {
            delete all_words[w];
        }
    }
    const remaining_words = [];
    for (const w in all_words) {
        remaining_words.push(w);
    }
    tag_ordered_lexes.push(remaining_words);

    // Lowercase alphabet if case-sensitivity is unticked
    $alphabet = $case_sensitive? $alphabet.trim() : $alphabet.trim().toLowerCase();
    const order = $alphabet.split(/\s+/);
    // to make sure we find the largest tokens first, i.e. for cases where 'st' comes before 'str' alphabetically
    const find_in_order = Array.from(new Set(order)).sort(
        (a, b) => b.length - a.length
    ); // descending, ensures uniqueness

    const final_sort = [];
    for (const group of tag_ordered_lexes) {
        const lex = {};
        const list = [];
        for (const word of group) {
            // case sensitivity
            let w: string = $case_sensitive? word : word.toLowerCase();

            // diacritic sensitivity
            w = $ignore_diacritics? w.normalize('NFD').replace(/\p{Diacritic}/gu, '') : w;

            for (const token of find_in_order) {
                w = w.replace(
                    new RegExp(`${token}`, 'g'),
                    `${order.indexOf(token)}.`
                );
            }
            const append: (string | number)[] = w.split('.');
            for (const i of append) {
                append[append.indexOf(i)] = +i || 0;
            }
            lex[word] = append;
            list.push(append);
        }
        list.sort((a, b) => {
            for (const i of a) {
                const j = b[a.indexOf(i)];
                if (i === j) {
                    continue;
                }
                return i - j;
            }
            return 0;
        });
        const sorted = [];
        for (const key in lex) {
            sorted.push([key, list.indexOf(lex[key])]);
        } // [ [word, index], [word, index], ...]
        sorted.sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < sorted.length; i++) {
            sorted[i] = sorted[i][0];
        }
        for (const i of sorted) {
            final_sort.push(i);
        }
    }
    return final_sort;
}

type valid = string & { __brand: 'valid' };
/**
 * Takes a word and returns false if it contains any characters not in the alphabet.
 * The function takes case sensitivity and diacritic sensitivity into account.
 * @param word - the word to check
 * @returns false if the word contains any characters not in the alphabet.
 */
export function alphabetPrecheck(word: string): word is valid {
    // check in order of length descending, solves combining diacritcs issue (i.e. 'a' would be removed from 'å', leaving the ring)
    const alphabet = Lang().Alphabet.trim().split(/\s+/).sort((a, b) => b.length - a.length);
    word = Lang().CaseSensitive? word : word.toLowerCase();
    word = Lang().IgnoreDiacritics? word.normalize('NFD').replace(/\p{Diacritic}/gu, '') : word;
    alphabet.forEach((token) => {
        word = word.replaceAll(token, '');
        // debug.log(`alphabetPrecheck: ${word} | ${token}`, false);
    });
    return !word.replaceAll(/\s+/g, '');
}
