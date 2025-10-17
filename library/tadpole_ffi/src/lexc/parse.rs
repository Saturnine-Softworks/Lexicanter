/*
 * courtesy of Zhuriel
 * https://codeberg.org/zhuriel/tadpole_lexc/src/branch/master/src/parse.rs
 * pulled Oct 17 2025
 */

use tadpole::{
    RawDirective,
    definitions::DefDirective,
    transform::{EnvironmentDef, EnvironmentRuleDef, SimpleRuleDef, matcher::MatcherDef},
};

use nom::{
    IResult, Parser,
    branch::alt,
    bytes::complete::tag,
    character::{
        complete::{anychar, none_of, space0},
        one_of,
    },
    combinator::{eof, map, opt, recognize},
    multi::{many1, separated_list1},
    sequence::{delimited, preceded, terminated},
};

use crate::lexc::LexcElem;

pub(crate) fn parse_lexc_line(input: &str) -> IResult<&str, RawDirective> {
    alt((parse_lexc_class, parse_lexc_rule)).parse(input)
}

fn parse_lexc_class(input: &str) -> IResult<&str, RawDirective> {
    map(
        (
            space0,
            none_of(" \t\n:"),
            space0,
            tag("::"),
            space0,
            separated_list1(
                (space0, tag(","), space0),
                recognize(many1(none_of(" \t\n,"))),
            ),
            space0,
            (opt(tag("\n")), eof),
        ),
        |(_, name, _, _, _, chars, _, _)| {
            RawDirective::Def(DefDirective::DefineClass(
                String::from(name),
                (chars as Vec<&str>).into_iter().map(String::from).collect(),
            ))
        },
    )
    .parse(input)
}

fn parse_lexc_rule(input: &str) -> IResult<&str, RawDirective> {
    map(
        (
            space0,
            opt(terminated(seq_matcher, space0)),
            alt((tag(">"), tag("/"))),
            space0,
            opt(terminated(seq_replacer, space0)),
            opt((
                tag("/"),
                opt(space0),
                opt(seq_matcher),
                opt(space0),
                tag("_"),
                opt(space0),
                opt(seq_matcher),
                opt(space0),
            )),
            (opt(tag("\n")), eof),
        ),
        |(_, matcher, _, _, replacer, env, _)| {
            let matcher_def = matcher.unwrap_or(LexcElem::Null);
            let replacer_def = replacer.unwrap_or(LexcElem::Null);
            if let Some((_, _, pre, _, _, _, post, _)) = env {
                let env = EnvironmentDef::new(
                    pre.map(|m| Box::new(m) as Box<dyn MatcherDef>),
                    post.map(|m| Box::new(m) as Box<dyn MatcherDef>),
                );
                RawDirective::Transform(
                    "_".to_string(),
                    Box::new(EnvironmentRuleDef::new(
                        Box::new(matcher_def),
                        Box::new(replacer_def),
                        env,
                    )),
                )
            } else {
                RawDirective::Transform(
                    "_".to_string(),
                    Box::new(SimpleRuleDef::new(
                        Box::new(matcher_def),
                        Box::new(replacer_def),
                    )),
                )
            }
        },
    )
    .parse(input)
}

fn seq_matcher(input: &str) -> IResult<&str, LexcElem> {
    map(
        many1(alt((
            repeat_matcher,
            alt_matcher,
            inv_matcher,
            elem_matcher,
        ))),
        |mut seq| {
            if seq.len() == 1 {
                seq.remove(0)
            } else {
                LexcElem::Seq(seq)
            }
        },
    )
    .parse(input)
}

fn repeat_matcher(input: &str) -> IResult<&str, LexcElem> {
    map(
        (alt((alt_matcher, inv_matcher, elem_matcher)), one_of("?*+")),
        |(inner, repeat)| match repeat {
            '?' => LexcElem::Optional(Box::new(inner)),
            '*' => LexcElem::RepeatAny(Box::new(inner)),
            '+' => LexcElem::RepeatOne(Box::new(inner)),
            _ => unreachable!(),
        },
    )
    .parse(input)
}

fn alt_matcher(input: &str) -> IResult<&str, LexcElem> {
    map(
        (
            tag("{"),
            space0,
            separated_list1((space0, tag(","), space0), seq_matcher),
            space0,
            tag("}"),
        ),
        |(_, _, list, _, _)| LexcElem::Alt(list),
    )
    .parse(input)
}

fn inv_matcher(input: &str) -> IResult<&str, LexcElem> {
    map((tag("!"), elem_matcher), |(_, inner)| {
        LexcElem::Invert(Box::new(inner))
    })
    .parse(input)
}

fn elem_matcher(input: &str) -> IResult<&str, LexcElem> {
    alt((
        delimited(tag("("), seq_replacer, tag(")")),
        lexc_reserved,
        lexc_char,
    ))
    .parse(input)
}

fn seq_replacer(input: &str) -> IResult<&str, LexcElem> {
    map(
        many1(alt((
            repeat_replacer,
            alt_replacer,
            inv_replacer,
            elem_replacer,
        ))),
        |mut seq| {
            if seq.len() == 1 {
                seq.remove(0)
            } else {
                LexcElem::Seq(seq)
            }
        },
    )
    .parse(input)
}

fn repeat_replacer(input: &str) -> IResult<&str, LexcElem> {
    map(
        (
            alt((alt_replacer, inv_replacer, elem_replacer)),
            one_of("?*+"),
        ),
        |(inner, repeat)| match repeat {
            '?' => LexcElem::Optional(Box::new(inner)),
            '*' => LexcElem::RepeatAny(Box::new(inner)),
            '+' => LexcElem::RepeatOne(Box::new(inner)),
            _ => unreachable!(),
        },
    )
    .parse(input)
}

fn alt_replacer(input: &str) -> IResult<&str, LexcElem> {
    map(
        (
            tag("{"),
            space0,
            separated_list1((space0, tag(","), space0), seq_replacer),
            space0,
            tag("}"),
        ),
        |(_, _, list, _, _)| LexcElem::Alt(list),
    )
    .parse(input)
}

fn inv_replacer(input: &str) -> IResult<&str, LexcElem> {
    map((tag("!"), elem_replacer), |(_, inner)| {
        LexcElem::Invert(Box::new(inner))
    })
    .parse(input)
}

fn elem_replacer(input: &str) -> IResult<&str, LexcElem> {
    alt((
        map(tag("_"), |_| LexcElem::Capture),
        delimited(tag("("), seq_replacer, tag(")")),
        lexc_reserved,
        lexc_char,
    ))
    .parse(input)
}

fn lexc_char(input: &str) -> IResult<&str, LexcElem> {
    alt((
        map(none_of(" \t\n\\>/+*?{}()^#_"), |ch| {
            LexcElem::Char(String::from(ch))
        }),
        map(preceded(tag("\\"), anychar), |ch| {
            LexcElem::Char(String::from(ch))
        }),
    ))
    .parse(input)
}

fn lexc_reserved(input: &str) -> IResult<&str, LexcElem> {
    alt((
        map(tag("."), |_| LexcElem::Wildcard),
        map(one_of("^#"), |_| LexcElem::WordBoundary),
    ))
    .parse(input)
}
