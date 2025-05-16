use std::ffi::{c_char, CStr, CString};
use std::{str};

/// Function to test that interop is working. 
#[no_mangle]
pub unsafe extern "C" fn echo(text: *const c_char) -> *const c_char {
    let text_str = c_char_to_string(text);

    string_to_c_char(text_str)
}

fn string_to_c_char(string: String) -> *const c_char {
    CString::new(string).expect("CString::new failed").into_raw()
}

/// Converts C-like strings into Rust-like strings
fn c_char_to_string(c_str: *const c_char) -> String {
    let c_str = unsafe {
        assert!(!c_str.is_null());
        CStr::from_ptr(c_str)
    };

    let bytes = c_str.to_bytes();
    str::from_utf8(bytes).expect("`c_char_to_string()` should be passed a valid C-like string").to_owned()
}

#[no_mangle]
pub unsafe extern "C" fn graphemify(
    engine_path: *const c_char, 
    input: *const c_char
) -> *const c_char {
    use graphemy::*;
    use std::path::PathBuf;

    let engine_path_str = c_char_to_string(engine_path);
    let input_str = c_char_to_string(input);

    let engine = Engine::try_from(&PathBuf::from(engine_path_str)).unwrap();
    let settings = RenderSettings {
        size: OutputSize::MaxRect(100.0, 100.0),
        margin: 5.0,
        comment: None,
        css_mode: false,
    };
    let svg = engine.render(&input_str, 100.0, settings).unwrap();

    string_to_c_char( svg.to_string() )
}