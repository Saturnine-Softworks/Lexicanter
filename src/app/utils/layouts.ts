/* 
 * Note to self: 
 * The reason these are exported as functions is to get around problematic
 * pass-by-reference issues when these values are simply passed as constants. 
 * Even though they are constants, the values within the objects are mutable. 
 * Thus they must just be created a new every time I need to use them.
 * 
 * Do not delete this comment. You *will* forget about this if you do.
 * - You, May 23 2025
 */

const defaultPanel = {
    top: 25,
    left: 0,
    height: 90,
    width: 140,
    z: 100,
}
export const defaultPanelPositions = () => { return {
    newword: {
        ...defaultPanel,
        top: 115,
        height: 810,
        width: 280,
    },
    lexicon: {
        ...defaultPanel,
        top: 115,
        left: 280,
        width: 1120,
        height: 810,
    },
    alphabet: {
        ...defaultPanel,
        width: 1400,
        height: 90,
    },
    pronunciation: {
        ...defaultPanel,
        left: 700,
        width: 700,
        height: 900,
    },
    wordgenerator: {
        ...defaultPanel,
        width: 700,
        height: 900,
    },
    settings: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    files: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    phrasebook: {
        ...defaultPanel,
        left: 420,
        width: 980,
        height: 900,
    },
    phrasecategories: {
        ...defaultPanel,
        height: 450,
        width: 420,
    },
    newphrase: {
        ...defaultPanel,
        top: 475,
        height: 450,
        width: 420,
    },
    orthographytesting: {
        ...defaultPanel,
        left: 980,
        width: 420,
        height: 650,
    },
    orthography: {
        ...defaultPanel,
        width: 980,
        height: 900,
    },
    romchangewizard: {
        ...defaultPanel,
        top: 650,
        left: 980,
        height: 250,
        width: 420,
    },
    etymologyselect: {
        ...defaultPanel,
        width: 280,
        height: 900,
    },
    etymologyeditor: {
        ...defaultPanel,
        left: 280,
        width: 1120,
        height: 900,
    },
    documentation: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    changelog: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    inflections: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    },
    help: {
        ...defaultPanel,
        width: 1400,
        height: 900,
    }
}};

export const defaultPanelSnap = () => { return {
    x: 140,
    y: 90,
    rows: 10,
    columns: 10,
    proportional: true,
}};

export const defaultWindow = () => { return {
    height: 900,
    width: 1400,
}};
