extern crate nom;
extern crate nom_unicode;
use std::vec;

use nom::{
    branch::alt,
    bytes::complete::{tag, take_until},
    character::complete::{alphanumeric0, alphanumeric1},
    combinator::{eof, map, recognize, rest},
    sequence::tuple,
    IResult
};
use nom_unicode::complete::space0;

fn category_parse(i: &str) -> IResult<&str, Vec<&str>> {
    map(
        tuple((
            space0,
            alphanumeric1,
            space0,
            tag("::"),
            space0,
            alt((take_until("\n"), take_until(";"), eof)),
            alt((tag("\n"), tag(";"), eof)),
            rest,
        )),
        |(_, name, _, _, _, items, _, remainder)| {
            vec!["_category", name, items, remainder]
        },
    )(i)
}

fn context_parser(i: &str) -> IResult<&str, &str> {
    map(
        tuple((
            tag("/"),
            space0,
            recognize(tuple((
                alphanumeric0,
                tag("_"),
                alphanumeric0
            ))),
            space0,
            alt((
                tag("\n"),
                tag(";"),
                eof
            ))
        )),
        |(_, _, context, _, _)| context,
    )(i)
}

fn rule_parse(i: &str) -> IResult<&str, Vec<&str>> {
    map(
        tuple((
            space0,
            alphanumeric1,
            space0,
            alt((tag(">"), tag("/"))),
            space0,
            alphanumeric0,
            space0,
            alt((
                context_parser,
                tag("\n"),
                tag(";"),
                eof
            )),
            rest,
        )),
        |(_, pattern, _, _, _, sub, _, context, remainder)| {
            vec!["_rule", pattern, sub, context, remainder]
        },
    )(i)
}

fn parse(i: &str) -> (String, Vec<&str>, String) {
    match alt((
        category_parse,
        rule_parse
    ))(i) {
        Ok(val) => {
            let (_, c) = val;
            match c[0] {
                "_category" => (
                    /* name      */ ["Name: ", c[1], " - Items:"].join(""),
                    /* items     */ c[2].split_whitespace().collect::<Vec<&str>>(),
                    /* remainder */ c[3].to_string(),
                ),
                "_rule" => (
                    /* pattern      */ ["Pattern: ", c[1]].join(""),
                    /* sub, context */ vec!["- Substitute:", c[2], "- Context:", c[3]],
                    /* remainder    */ c[4].to_string(),
                ),
                _ => (String::from("Unlabled line format."), vec![], String::new()),
            }
        }
        Err(e) => (format!("{:?}", e), vec![], String::new()),
    }
}

pub fn process(input: &String) -> String {
    let mut combined = String::new();
    let (name, items, remainder) = parse(&input);
    combined = format!("{}\n {}", combined, {
        format!("{} {}", name, items.join(" "))
    });
    if remainder != String::from("") {
        combined += &process(&remainder);
    }
    combined
}

fn main() -> () {
    let input = String::from("Cons :: m n b t d f g k r th sh
    Vows :: a e ae io u ou y è \na > e / _; i > ei;\no > u / w_");
    let result = process(&input);
    println!("Input:\n{}\n\nResult:{}", input, result);
}
