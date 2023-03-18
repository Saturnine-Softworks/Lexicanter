// string format: "pattern/subsitution/context"
function applyRule(rule: string, input: string, categories): string {
    // eslint-disable-next-line prefer-const
    let [pattern, sub, context] = rule.split('/');
    input = ' ' + input + ' ';
    let result = input;

    //SECTION - Preprocess the rule
    const unionRule = /\{(.+)\}/gi;
    const boundaryRule = /\^|#/gi;
    const negativeRule = /\{!(.+(?:\s+.+)*)\}/gi;
    const commaUnionRule = /\s*,\s*/g;
    const spaceRule = /\s+/g;
    const nullRule = /[∅⦰]/g;

    pattern = pattern
        .replaceAll(boundaryRule, '\\s')
        .replaceAll(negativeRule, '(?:(?!$1).)')
        .replaceAll(unionRule, '(?:$1)')
        .replaceAll(commaUnionRule, '|')
        .replaceAll(spaceRule, '')
    ;
    sub = sub
        .replaceAll(spaceRule, '')
        .replaceAll(nullRule, '')
    ;
    context = context
        .replaceAll(boundaryRule, '\\s')
        .replaceAll(negativeRule, '(?:(?!$1).)')
        .replaceAll(unionRule, '(?:$1)')
        .replaceAll(commaUnionRule, '|')
        .replaceAll(spaceRule, '')
    ;

    //SECTION - Construct RegExp rule string and map category appearances
    let regString = '(' + context.replace('_', `)${pattern}(`) + ')';
    Object.entries(categories).forEach(([symbol, values]: [string, string[]]) => {
        regString = regString.replaceAll(symbol, `(?:${values.join('|')})`);
    });
    const patternCatMap = pattern.split('').filter(char => char in categories);
    const subCatMap = sub.split('').filter(char => char in categories);
    const contextCatMap = context.split('').filter(char => char in categories);

    function getSlice(match): string {
        //SECTION - Get the index of the pattern in the context, accounting for varying category token lengths
        let expandedContext = context.replaceAll('\\b', '');
        let matchContext = [];
        if (contextCatMap.length > 0) {
            contextCatMap.forEach(symbol => {
                const matchMatches = match.match(new RegExp(`(?:${categories[symbol].join('|')})`, 'gi'));
                matchContext.push([symbol, matchMatches]);
            });
            matchContext = [...new Set(matchContext)].sort((a, b) => b.length - a.length);
        }
        matchContext.forEach(([symbol, matches]) => {
            matches.forEach(match => {
                expandedContext = expandedContext.replace(symbol, match);
            });
        });
        const indexOfPattern = expandedContext.indexOf('_');
        
        //SECTION - Get the slice of the match that corresponds to the pattern

        const patternLength = 
            !patternCatMap[0]
                ? pattern.length 
                : context === '_'
                    ? match.length
                    : (():number => {
                        let length = 0;
                        Object.entries(categories).filter(
                            ([symbol,]: [string, string[]]) => patternCatMap.includes(symbol)
                        ).forEach(([, values]: [string, string[]]) => {
                            const candidate = values.find(value => match.includes(value));
                            length += candidate? candidate.length : 0;
                        });
                        return length;
                    })();

        return match.slice( 
            indexOfPattern, 
            indexOfPattern + patternLength
        );
    }

    //SECTION - Apply the rule
    const matches: string[] = input.match(new RegExp(regString, 'gi'));
    if (matches && sub.includes('_')) {
        matches.forEach(match => {
            const slice = getSlice(match);
            result = result.replace(slice, sub.replaceAll('_', slice));
        });
    } else result = result.replaceAll(new RegExp(regString, 'gi'), `$1${sub}$2`);
    
    if (!!subCatMap[0] && !!patternCatMap[0]) {
        let catMap: string[][] = [];
        matches;
        regString;
        if (matches) { 
            catMap = matches.map(match => {

                const slice = getSlice(match);

                //SECTION - Create the map
                const map = [
                    slice,
                    subCatMap[patternCatMap
                        .indexOf(Object.keys(categories)
                            .find(symbol => categories[symbol]
                                .some((value: string) => 
                                    value === slice
                                )
                            )
                        )
                    ]
                ];
                return [
                    map[0],
                    map[1],
                    categories[map[1]][ categories[ patternCatMap[subCatMap.indexOf(map[1])] ].indexOf(map[0]) ]
                        ? categories[map[1]][ categories[ patternCatMap[subCatMap.indexOf(map[1])] ].indexOf(map[0]) ]
                        : map[0]
                ];
            });
            matches.forEach((match, i) => {
                result = result
                    .replace(
                        match.replace(catMap[i][0], catMap[i][1]), 
                        match.replace(catMap[i][0], catMap[i][2])
                    );
            });
        }
    }
    /* console.log(
        input, '::', pattern + '/' + sub + '/' + context, '-> ', result
    ); */
    return result.trim();
}

export function applyRules(rules: string[], input: string, categories): string {
    let result = input;
    rules.forEach(rule => {
        result = applyRule(rule, result, categories);
    });
    return result;
}

export function parseRules(rules: string): {rules: string[], categories: {[index: string]: string[]}} {
    const result = {
        rules: rules
            .split('\n')
            .map(rule => rule.trim())
            .filter(rule => rule.match(/^.*(?:\/|>).*/)) // p > s || p / s
            .map(rule => rule.match(/\/.*_.*$/) // p > s / _ || p / s / _
                ? rule 
                : rule.match(/\/\s*$/) // p > s / || p / s /
                    ? rule + '_'
                    : rule + '/_'
            )
            .map(rule => rule.split(/(?:\/|>)/).map(part => part.trim()).join('/')),
        categories: Object.fromEntries(
            rules
                .split('\n')
                .map(rule => rule.trim())
                .filter(rule => rule.match(/^.*::.*$/))
                .map(rule => rule.split('::'))
                .map(([symbol, values]) => [ symbol.trim(), values.split(',').map(value => value.trim()) ])
        )
    };
    /* console.log(
        'rules:', result.rules, '|| categories:', result.categories
    ); */
    return result;
}


/* const rules = `
à/ebis/_#
`;
const input = 'zucà';
console.log(
    input, '-->',
    applyRules(parseRules(rules).rules, input, parseRules(rules).categories),
); */
