import { marked } from 'marked';
export function markdownToHtml(text: string): string {
    text = text.replaceAll(/__(.+)__/g, '<u>$1</u>'); // manually handle underlining
    text = marked.parse(text, { 
        breaks: true, 
        smartypants: true,
    });
    return text;
}
