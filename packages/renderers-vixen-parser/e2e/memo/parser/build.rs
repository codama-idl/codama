//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

fn main() {
    // #[cfg(feature = "proto")]
    prost_build::Config::new()
        .enable_type_names()
        .compile_protos(&["proto/proto_def.proto"], &["proto"])
        .unwrap();
}
