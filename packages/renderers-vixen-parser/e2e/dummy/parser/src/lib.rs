mod generated;

pub use generated::*;

pub extern crate prost;

// #[cfg(feature = "proto")]
mod proto_def {
    tonic::include_proto!("proto_def");
}
