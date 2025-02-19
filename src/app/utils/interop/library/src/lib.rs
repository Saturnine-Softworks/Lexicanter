extern crate libc;
use libc::c_char;
use std::ffi::CStr;

// converts string type passed from JS to a Rust-acceptable String
macro_rules! r_str {
    ($c_str:ident) => {{
        let c_str: *const c_char = $c_str;
        { unsafe { CStr::from_ptr(c_str) } }
            .to_str()
            .unwrap()
            .to_string()
    }};
}
// converts a String to a C-like string that can be read by JS
macro_rules! j_str {
    {$r_str:expr} => {{
        let r_str: String = $r_str;
        format!("{}\0", r_str).as_ptr()
    }}
}

#[no_mangle]
pub extern "C" fn greet(name: *const c_char) -> *const u8 {
    j_str! { format!("Hello, {}", r_str!(name)) }
}
