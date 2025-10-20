use std::ffi::{CStr, CString, c_char};

/// Converts Rust strings into C-like strings
fn string_to_c_char(string: String) -> *const c_char {
    CString::new(string)
        .expect("CString::new failed")
        .into_raw()
}

/// Converts C-like strings into Rust-like strings
fn c_char_to_string(c_str: *const c_char) -> String {
    let c_str = unsafe {
        if c_str.is_null() {
            return String::from("");
        }
        CStr::from_ptr(c_str)
    };

    let bytes = c_str.to_bytes();
    str::from_utf8(bytes)
        .expect("`c_char_to_string()` should be passed a valid C-like string")
        .to_owned()
}

use tadpole::{SoundChanger, SoundChangerResult};
use tadpole_frontend::TadpoleParser;
use lexc::TadpoleLexc;
mod lexc;

#[unsafe(no_mangle)]
pub unsafe extern "C" fn tadpole(
    parser_c_str: *const c_char,
    input_c_str: *const c_char,
    spec_c_str: *const c_char,
) -> *const c_char {
    let parser_str = c_char_to_string(parser_c_str);
    let input_str = c_char_to_string(input_c_str);
    let spec_str = c_char_to_string(spec_c_str);

    let engine = match parser_str.as_str() {
        "lexc" => SoundChanger::parse_string(&spec_str, &TadpoleLexc),
        "tadpole" => SoundChanger::parse_string(&spec_str, &TadpoleParser::new()),
        _ => return string_to_c_char(String::from("Not a valid parser.")),
    }
    .unwrap();

    let res = engine
        .run(&input_str)
        .unwrap_or(SoundChangerResult {
            result: String::from("[ Parser Error ]"),
            outputs: Vec::new(),
        })
        .result;
    
    println!("Parser: {parser_str}\n\n{spec_str}\n");
    println!("{input_str} -> {res}\n");

    string_to_c_char(res)
}
