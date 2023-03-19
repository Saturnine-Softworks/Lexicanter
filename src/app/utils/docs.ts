import { docsEditor } from '../stores';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Underline from '@editorjs/underline';
/* eslint-disable @typescript-eslint/no-explicit-any */
enum LogLevels { // REVIEW - monkeypatch gets around type check error, can't import this from @editorjs/editorjs/types for ...reasons.
    VERBOSE = 'VERBOSE',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}
export class Monospace { // EditorJS custom class
    api: any;
    button: null | HTMLButtonElement;
    tag: string;
    iconClasses: any;

    static get CSS() {
        return 'cdx-monospace';
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.tag = 'CODE';
        this.iconClasses = {
            base: this.api.styles.inlineToolButton,
            active: this.api.styles.inlineToolButtonActive,
        };
    }
    static get isInline() {
        return true;
    }
    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.textContent = 'M';
        this.button.classList.add(this.api.styles.inlineToolButton);
        return this.button;
    }
    surround(range) {
        if (!range) {
            return;
        }
        const termWrapper = this.api.selection.findParentTag(this.tag, Monospace.CSS);
    
        // If start or end of selection is in the highlighted block
        if (termWrapper) {
            this.unwrap(termWrapper);
        } else {
            this.wrap(range);
        }
    }
    // Wrap selection with term-tag
    wrap(range) {
        const m = document.createElement(this.tag);
        m.classList.add(Monospace.CSS);
        /** SurroundContent throws an error if the Range splits a non-Text node with only one of its boundary points
         *  @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents}
         *  // range.surroundContents(span);
         */
        m.appendChild(range.extractContents());
        range.insertNode(m);
    
        // Expand (add) selection to highlighted block
        this.api.selection.expandToTag(m);
    }
    // Unwrap term-tag
    unwrap(termWrapper) {
        // Expand selection to all term-tag
        this.api.selection.expandToTag(termWrapper);

        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        const unwrappedContent = range.extractContents();
    
        // Remove empty term-tag
        termWrapper.parentNode.removeChild(termWrapper);
    
        // Insert extracted content
        range.insertNode(unwrappedContent);
    
        // Restore selection
        sel.removeAllRanges();
        sel.addRange(range);
    }
    checkState() {
        const termTag = this.api.selection.findParentTag(this.tag, Monospace.CSS);
        this.button.classList.toggle(this.iconClasses.active, !!termTag);
    }
    static get sanitize() {
        return {
            code: {
                class: Monospace.CSS,
            },
        };
    }
}

/**
 * Initialize the EditorJS instance for the docs tab.
 * If data is provided, it will be used to populate the editor.
 * If data is not provided, or is false, the editor
 * will be initialized with an empty document.
 * @param {Object} data
 */
export function initializeDocs(data: OutputData | false): void {
    const config = {
        holder: 'docs-tab',
        data: null,
        tools: {
            underline: Underline,
            monospace: Monospace,
            header: {
                class: Header,
                inlineToolbar: true,
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                config: {
                    placeholder:
                    'This panel can be used to document and describe your languge’s features in greater detail.',
                },
            },
            table: {
                class: Table,
                inlineToolbar: true,
                config: {
                    rows: 3,
                    cols: 3,
                    withHeadings: true,
                },
            },
        },
        logLevel: LogLevels.ERROR,
    };
    
    if (data) config.data = data;
    docsEditor.set(new EditorJS(config));
}
