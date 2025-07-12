use std::{
    ffi::{c_char, CStr, CString},
    str::FromStr,
};

/// Function to test that interop is working.
#[no_mangle]
pub unsafe extern "C" fn echo(text: *const c_char) -> *const c_char {
    let text_str = c_char_to_string(text);

    string_to_c_char(text_str)
}

fn string_to_c_char(string: String) -> *const c_char {
    CString::new(string)
        .expect("CString::new failed")
        .into_raw()
}

/// Converts C-like strings into Rust-like strings
fn c_char_to_string(c_str: *const c_char) -> String {
    let c_str = unsafe {
        assert!(!c_str.is_null());
        CStr::from_ptr(c_str)
    };

    let bytes = c_str.to_bytes();
    str::from_utf8(bytes)
        .expect("`c_char_to_string()` should be passed a valid C-like string")
        .to_owned()
}

use graphemy::*;
fn try_grapheming(
    engine: &str,
    input: &str,
    max_width: f32,
    max_height: f32,
) -> Result<String, graphemy::EngineError> {
    let save_file = SaveFile::from_str(&engine)?;

    let typesetter = Engine::try_from(save_file)?;
    let settings = RenderSettings {
        size: OutputSize::MaxRect(max_width, max_height),
        margin: 5.0,
        comment: None,
        color_mode: graphemy::layout::render::RenderColor::Css,
    };

    let svg = typesetter.render(&input, TypesetSettings::CONTAINER, settings)?;
    Ok(svg.to_string())
}

#[no_mangle]
pub unsafe extern "C" fn graphemify(
    engine: *const c_char,
    input: *const c_char,
    max_width: f32,
    max_height: f32,
) -> *const c_char {
    let engine_str = c_char_to_string(engine);
    let input_str = c_char_to_string(input);

    let result = try_grapheming(&engine_str, &input_str, max_width, max_height)
        .unwrap_or("[ Typesetter Error ]".to_string());
    string_to_c_char(result)
}
