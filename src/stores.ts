import { writable } from 'svelte/store';
import EditorJS from '@editorjs/editorjs';
// Initial states for all the global variables across the app
export let file_name = writable('Unnamed Language');

export let case_sensitive = writable(false);
export let ignore_diacritics = writable(true);
export let header_tags = writable('');

export let lexicon = writable({});
export let alphabet = writable('a b c d e f g h i j k l m n o p q r s t u v w x y z');
export let word_input = writable('');
export let word_pronunciation = writable('');

export let phrasebook = writable({});
export let phrase_input = writable('');
export let phrase_pronunciation = writable('');
export let phrase_description = writable('');
export let category_input = writable('');
export let selected_category = writable('');
export let variant_inputs = writable([]);

interface Romanizations {
    [index: string]: string;
}
let roms: Romanizations = {'th': 'θ'};
export let romanizations = writable(roms);
export let romans_input = writable('th > θ');
export let onsets = writable('');
export let medials = writable('');
export let codas = writable('');
export let vowels = writable('');
export let illegals = writable('');

export let Docs = writable(new EditorJS);

export let theme = writable('styles/dark.css');
export let autosave = writable(true);
