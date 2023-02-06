import { get } from 'svelte/store';
import { case_sensitive, ignore_diacritics, alphabet, header_tags } from '../stores.js';

export function alphabetize(lexicon) {
    let priority_tags = get(header_tags).toLowerCase().trim().split(/\s+/);
    let $alphabet = get(alphabet);
    let $ignore_diacritics = get(ignore_diacritics);
    let $case_sensitive = get(case_sensitive);
    1 <= 2 >= 1
    let all_words = structuredClone(lexicon);
    let tag_ordered_lexes = [];
    for (let tag of priority_tags) {
        tag_ordered_lexes.push([]);
        for (let word in all_words) {
            if (lexicon[word][3].includes(tag)) {
                tag_ordered_lexes[tag_ordered_lexes.length - 1].push(word);
            }
        }
        for (let w of tag_ordered_lexes[tag_ordered_lexes.length - 1]) {
            delete all_words[w];
        }
    }
    let remaining_words = [];
    for (let w in all_words) {
        remaining_words.push(w);
    }
    tag_ordered_lexes.push(remaining_words);

    // Lowercase alphabet if case-sensitivity is unticked
    $alphabet = $case_sensitive? $alphabet.trim() : $alphabet.trim().toLowerCase();
    let order = $alphabet.split(/\s+/);
    // to make sure we find the largest tokens first, i.e. for cases where 'st' comes before 'str' alphabetically
    let find_in_order = Array.from(new Set(order)).sort(
        (a, b) => b.length - a.length
    ); // descending, ensures uniqueness

    let final_sort = [];
    for (let group of tag_ordered_lexes) {
        let lex = {};
        let list = [];
        for (let word of group) {
            // case sensitivity
            let w = $case_sensitive? word : word.toLowerCase();

            // diacritic sensitivity
            w = $ignore_diacritics? w.normalize('NFD').replace(/\p{Diacritic}/gu, '') : w;

            for (let token of find_in_order) {
                w = w.replace(
                    new RegExp(`${token}`, 'g'),
                    `${order.indexOf(token)}.`
                );
            }
            let append = w.split('.');
            for (let i of append) {
                append[append.indexOf(i)] = +i || 0;
            }
            lex[word] = append;
            list.push(append);
        }
        list.sort((a, b) => {
            for (let i of a) {
                let j = b[a.indexOf(i)];
                if (i === j) {
                    continue;
                }
                return i - j;
            }
            return 0;
        });
        let sorted = [];
        for (let key in lex) {
            sorted.push([key, list.indexOf(lex[key])]);
        } // [ [word, index], [word, index], ...]
        sorted.sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < sorted.length; i++) {
            sorted[i] = sorted[i][0];
        }
        for (let i of sorted) {
            final_sort.push(i);
        }
    }
    return final_sort;
}
