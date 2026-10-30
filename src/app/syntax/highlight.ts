import type { Syntax, Theme } from './syntax'

export function highlight(text: string, syntax: Syntax, theme: Theme ):string {
    const syntax_array = Object.values(syntax)
    const rgx = new RegExp(syntax_array.map(pattern => pattern.source).join('|'), 'gm');
    function marker(term: string) {
        // replacer function
        const idx = syntax_array.findIndex(key => term.match(RegExp(key, 'gm')));
        let output = '';
        const matches = RegExp(syntax_array[idx], 'gm').exec(term);
        matches?.forEach((capture, i) => {
            try {
                if (!capture) return;
                if (i == 0 && matches.length > 1) return;
                const style = 
                `color:${theme[(Object.keys(syntax)[idx])][i-(matches.length > 1? 1:0)]}`;
                output += `<editorhl style="${style}">${capture}</editorhl>`;
            } catch (e) { console.error(e, matches) }
        })
        return output;
    }
    return text
			.replace(rgx, (term) => marker(term)) // highlight
			.replace(new RegExp("&", "gm"), "&amp")  // prevent incidental HTML tags
	    .replace(new RegExp("<(?!/?editorhl)", "gm"), "&lt"); // from rendering as HTML
}