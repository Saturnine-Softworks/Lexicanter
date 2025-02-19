import { docsEditor } from '../stores';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Underline from '@editorjs/underline';
import EditorjsList from '@editorjs/list';
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune';
import TextVariantTune from '@editorjs/text-variant-tune';
import ToggleBlock from 'editorjs-toggle-block';
// const MermaidTool = require('editorjs-mermaid');
import type { EditorConfig } from '@editorjs/editorjs';
/* eslint-disable @typescript-eslint/no-explicit-any */
enum LogLevels { // REVIEW - monkeypatch gets around type check error, can't import this from @editorjs/editorjs/types for ...reasons.
    VERBOSE = 'VERBOSE',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * Initialize the EditorJS instance for the docs tab.
 * If data is provided, it will be used to populate the editor.
 * If data is not provided, or is false, the editor
 * will be initialized with an empty document.
 * @param {Object} data
 */
export function initializeDocs(data: OutputData | false, holder='docs-tab'): void {
    const config = {
        holder: holder,
        data: null,
        tools: {
            underline: Underline,
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
            list: {
                class: EditorjsList,
                inlineToolbar: true,
            },
            toggle: {
                class: ToggleBlock,
                inlineToolbar: true,
            },
            alignment: {
                class: AlignmentTuneTool,
                config: {
                    default: "left",
                }
            },
            // mermaid: MermaidTool,
            textVariant: TextVariantTune,
        },
        tunes: [
            'alignment',
            'textVariant',
        ],
        logLevel: LogLevels.ERROR,
        readOnly: holder === 'ref-docs'
    };
    
    if (data) config.data = data;
    const editor = new EditorJS(config as EditorConfig);
    if (holder === 'docs-tab') {
        docsEditor.set(editor);
    }
}
