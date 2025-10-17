/*
 * courtesy of Zhuriel
 * https://codeberg.org/zhuriel/tadpole_lexc/src/branch/master/src/lib.rs
 * pulled Oct 17 2025
 */

use tadpole::{
    Frontend, RawDirective,
    definitions::{DefDirective, Definitions},
    transform::{
        binding::HasBinding,
        matcher::{
            MatchError, Matcher, MatcherDef,
            base::{CharMatcher, ClassMatcher, NullMatcher, WildcardMatcher, WordBoundaryMatcher},
            combinator::{AlternativeMatcher, InverseMatcher, RepeatMatcher, SequenceMatcher},
        },
        replacer::{
            ReplaceError, Replacer, ReplacerDef,
            base::{BindingReplacer, CharReplacer, ClassReplacer, NullReplacer},
            combinator::{AlternativeReplacer, SequenceReplacer},
        },
    },
};

use crate::lexc::parse::parse_lexc_line;

mod parse;

pub struct TadpoleLexc;

impl Frontend for TadpoleLexc {
    fn parse_spec<R: std::io::BufRead>(
        &self,
        mut input: R,
    ) -> Result<Vec<RawDirective>, tadpole::SoundChangerError> {
        let mut out = vec![RawDirective::Def(DefDirective::Config(
            "class_as_string".to_string(),
            true,
        ))];
        let mut line_buf = String::new();
        let mut rule_num = 0;
        while input.read_line(&mut line_buf)? > 0 {
            match parse_lexc_line(&line_buf) {
                Ok((_, RawDirective::Transform(_, rule))) => {
                    out.push(RawDirective::Transform(format!("rule_{rule_num:02}"), rule));
                    rule_num += 1;
                }
                Ok((_, res)) => {
                    out.push(res);
                }
                Err(_) => {}
            }
            line_buf.clear();
        }
        Ok(out)
    }
}

#[derive(Debug, Clone)]
enum LexcElem {
    Char(String),
    Seq(Vec<LexcElem>),
    Alt(Vec<LexcElem>),
    RepeatAny(Box<LexcElem>),
    RepeatOne(Box<LexcElem>),
    Optional(Box<LexcElem>),
    Wildcard,
    WordBoundary,
    Invert(Box<LexcElem>),
    Capture,
    Null,
}

impl LexcElem {
    fn resolve_matcher(
        self,
        defs: &Definitions,
        binding_counter: &mut usize,
        is_env: bool,
    ) -> Result<Box<dyn Matcher>, MatchError> {
        match self {
            Self::Char(ch) => {
                if defs.classes.contains_key(&ch) {
                    let mut res = ClassMatcher::new(ch, None);
                    if !is_env {
                        res.add_binding(format!("__{}", binding_counter));
                        *binding_counter += 1;
                    }
                    res.resolve(defs, is_env)
                } else {
                    Ok(Box::new(CharMatcher::from(ch)))
                }
            }
            Self::Seq(inner) => Ok(Box::new(SequenceMatcher::from(
                inner
                    .into_iter()
                    .map(|elem| elem.resolve_matcher(defs, binding_counter, is_env))
                    .collect::<Result<Vec<_>, _>>()?,
            ))),
            Self::Alt(inner) => {
                let mut res = AlternativeMatcher::from(
                    inner
                        .into_iter()
                        .map(|elem| elem.resolve_matcher(defs, binding_counter, is_env))
                        .collect::<Result<Vec<_>, _>>()?,
                );
                if !is_env {
                    res.add_binding(format!("__{}", binding_counter));
                    *binding_counter += 1;
                }
                Ok(Box::new(res))
            }
            Self::RepeatAny(inner) => Ok(Box::new(RepeatMatcher::any(inner.resolve_matcher(
                defs,
                binding_counter,
                is_env,
            )?))),
            Self::RepeatOne(inner) => Ok(Box::new(RepeatMatcher::at_least_one(
                inner.resolve_matcher(defs, binding_counter, is_env)?,
            ))),
            Self::Optional(inner) => Ok(Box::new(RepeatMatcher::optional(inner.resolve_matcher(
                defs,
                binding_counter,
                is_env,
            )?))),
            Self::Wildcard => Ok(Box::new(WildcardMatcher)),
            Self::WordBoundary => Ok(Box::new(WordBoundaryMatcher)),
            Self::Invert(inner) => Ok(Box::new(InverseMatcher::from(inner.resolve_matcher(
                defs,
                binding_counter,
                is_env,
            )?))),
            Self::Capture => Ok(Box::new(NullMatcher)),
            Self::Null => Ok(Box::new(NullMatcher)),
        }
    }

    fn resolve_replacer(
        self,
        defs: &Definitions,
        binding_counter: &mut usize,
    ) -> Result<Box<dyn Replacer>, ReplaceError> {
        match self {
            Self::Char(ch) => {
                if defs.classes.contains_key(&ch) {
                    let res =
                        ClassReplacer::new(ch, format!("__{}", binding_counter)).resolve(defs);
                    *binding_counter += 1;
                    res
                } else {
                    Ok(Box::new(CharReplacer::from(ch)))
                }
            }
            Self::Seq(inner) => Ok(Box::new(SequenceReplacer::from(
                inner
                    .into_iter()
                    .map(|elem| elem.resolve_replacer(defs, binding_counter))
                    .collect::<Result<Vec<_>, _>>()?,
            ))),
            Self::Alt(inner) => {
                let mut res = AlternativeReplacer::from(
                    inner
                        .into_iter()
                        .map(|elem| elem.resolve_replacer(defs, binding_counter))
                        .collect::<Result<Vec<_>, _>>()?,
                );
                res.add_binding(format!("__{}", binding_counter));
                *binding_counter += 1;
                Ok(Box::new(res))
            }
            Self::RepeatAny(_) => Ok(Box::new(NullReplacer)),
            Self::RepeatOne(_) => Ok(Box::new(NullReplacer)),
            Self::Optional(_) => Ok(Box::new(NullReplacer)),
            Self::Wildcard => Ok(Box::new(NullReplacer)),
            Self::WordBoundary => Ok(Box::new(NullReplacer)),
            Self::Invert(_) => Ok(Box::new(NullReplacer)),
            Self::Capture => Ok(Box::new(BindingReplacer::from("__all".to_string()))),
            Self::Null => Ok(Box::new(NullReplacer)),
        }
    }
}

impl MatcherDef for LexcElem {
    fn resolve(&self, defs: &Definitions, is_env: bool) -> Result<Box<dyn Matcher>, MatchError> {
        let mut counter = 0;
        self.clone().resolve_matcher(defs, &mut counter, is_env)
    }
}

impl ReplacerDef for LexcElem {
    fn resolve(&self, defs: &Definitions) -> Result<Box<dyn Replacer>, ReplaceError> {
        let mut counter = 0;
        self.clone().resolve_replacer(defs, &mut counter)
    }
}

#[cfg(test)]
mod tests {
    use tadpole::SoundChanger;

    use super::*;

    #[test]
    fn smoketest() {
        // uses one of my own lexicanter sound changers as a test
        let engine = SoundChanger::parse_string(
            r#"
            C :: p, b, t, d, k, g, m, n, N, B, r, R, H, f, v, s, z, x, X, S, Z, w, l, y, L, Y
            K :: p, b, t, d, k, g, m, n, ŋ, ʙ, r, ʀ, ʜ, ɸ, β, s, z, x, ɣ, ʃ, ʒ, w, l, j, ʟ, ɰ
            V :: ā, ē, ī, ō, ū, ä, ë, ï, ö, ü, a, e, i, o, u
            0 :: Ā, Ē, Ī, Ō, Ū, Ä, Ë, Ï, Ö, Ü, A, E, I, O, U
            F :: ɒ, ʌ, ɨ, ə˞, u̠, ɛ, ɤ, y, ø, ɯ, a, e, i, o, u

            8 :: ́, ̀, ̰ 
            9 :: ˧˦, ˧˨, ̰

            Q :: ₁, ₂, ₃, ₄, ₅, ₆, ₇
            W :: 1, 2, 3, 4, 5, 6, 7
            T :: ̄́, ̄̀, ̄, ́, ̀
            D :: ˦˥, ˦˧, ˦, ˨˧, ˨˩
            $ :: ₄, ₅, ₆, ₇
            % :: 4, 5, 6, 7

            V > 0 / _V$
            V > 0 / _$
            \( > 
            \) > ₎
            Q > W
            > ₍ / V8?8?_W
            > ₍ / V_0
            > · / WT?_0?0?W
            > ₎ / WT?_C
            > ₎ / WT?_V
            > ₎ / WT?_#
            > ˨ / W_· 
            > ˨ / W_₎
            8 > 9 / V0_
            8 > 9 / V_
            T > D / W_
            C > K
            V > F
            0 > F
        "#,
            &TadpoleLexc,
        )
        .unwrap();
        assert_eq!(
            engine.run("Swï₁̀₂̀₃̄́Zfī₁̄₂₃́").unwrap().result,
            "ʃwy₍1˨˩·2˨˩·3˦˥₎ʒɸɨ₍1˦·2˨·3˨˧₎"
        )
    }
}
