export type Syntax = { [index: string]: RegExp };
export type Theme = { [index: string]: string[] };

export const tadpole_syntax: Syntax = {
    linecomment: /(\/\/)(.*?)$/gm,
    blockcomment: /(\/\*)((?s:.*?))(\*\/)/gm,
    string_double: /("(?s:.*?)")/gm,
    string_single: /('(?s:.*?)')/gm,
    env_underscore: /(\W_\W)/gm,
    decl: /\b(rule|class|feature|input|output|generator|branch|restore)(\s+)([_A-Za-z][_A-Za-z0-9]*)(\s*)(=)/gm,
    keyword_decl: /\b(rule|class|symbol|feature|segmentation|syllables|input|output|generator|branch|from|modifier|config|macro|matcher|replacer|env|hooks|pre|post|add|resegment|bias)\b/gm,
    keyword_flow: /\b(in|except|or|then|also|else|default|match|with|rebuild|clear|explicit|enable|disable|all)\b/gm,
    keyword_ann: /\b(filter|converging|word|uniform|zipf|soft|hard|syl|before|after|at|ltr|rtl)\b/gm,
    binding: /((?:@\s*[_A-Za-z][_A-Za-z0-9]*\b)|(?:<\s*[_A-Za-z][_A-Za-z0-9]*\s*>))/gm,
    binding_imm: /(@\()((?s:.*))(\))/gm,
    syl_feature_matrix: /(\[\[)((?s:.*))(\]\])/gm,
    feature_matrix: /(\[)((?s:.*))(\])/gm,
    feature_name: /([-+*][_A-Za-z][_A-Za-z0-9]*)\b/gm,
    macro_call: /(\$\s*[_A-Za-z][_A-Za-z0-9]*)\b/gm,
    operator: /(=|->|\+|\?|\*|&&|&|>>|<<|:>|<:|\(!\)|\(~\)|!|\|)/gm,
    boolean: /\b(true|false)\b/gm,
    number: /\b([0-9]+(?:\.[0-9]+)?%?)/gm,
    name: /\b([_A-Za-z][_A-Za-z0-9]*)\b/gm,
};

export const default_tadpole_theme: Theme = {
    linecomment: ["darkcyan", "gray;font-style:italic"], // line comment
    blockcomment: ["darkcyan", "gray;font-style:italic", "darkcyan"], /* block comment */
    string_double: ["lightcoral"], // "this"
    string_single: ["pink"], // 'this'
    env_underscore: ["ghostwhite"],
    decl: ["olivedrab;font-weight:bold", "", "cadetblue", "", "silver"], // declarations, i.e. rule name =
    keyword_decl: ["olivedrab;font-weight:bold"], // declaration keywords, i.e. rule, class, symbol, macro
    keyword_flow: ["silver;font-style:italic"], // flow keywords, i.e. in, except, or, also
    keyword_ann: ["mediumaquamarine"], // annotation keywords, i.e. filter, uniform, soft, at
    binding: ["steelblue"], // @name or <name>
    binding_imm: ["steelblue", "skyblue", "steelblue"], // @(name)
    syl_feature_matrix: ["steelblue", "skyblue", "steelblue"], // [[ ... ]]
    feature_matrix: ["steelblue", "skyblue", "steelblue"], // [ ... ]
    feature_name: ["powderblue;font-style:italic"], // i.e. +feat, -feat
    macro_call: ["goldenrod"], // $some_macro
    operator: ["ghostwhite"],
    boolean: ["royalblue"], // true false
    number: ["seagreen"], // 12 3.4 5%
    name: ["cadetblue"], // user-defined names
}
