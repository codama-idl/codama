#![deny(
    clippy::disallowed_methods,
    clippy::suspicious,
    clippy::style,
    clippy::clone_on_ref_ptr
)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

use std::path::PathBuf;

use clap::Parser as _;
use codama_renderers_vixen_parser_e2e_meteora::{
    accounts_parser::AccountParser as MeteoraProgramAccParser,
    instructions_parser::InstructionParser as MeteoraProgramIxParser,
};
use codama_renderers_vixen_parser_e2e_system::{
    accounts_parser::AccountParser as SystemProgramAccParser,
    instructions_parser::InstructionParser as SystemProgramIxParser,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use yellowstone_vixen::{self as vixen, Pipeline};

#[derive(Debug)]
pub struct Handler;

impl<V: std::fmt::Debug + Sync> vixen::Handler<V> for Handler {
    async fn handle(&self, value: &V) -> vixen::HandlerResult<()> {
        tracing::info!(?value);
        Ok(())
    }
}

#[derive(clap::Parser)]
#[command(version, author, about)]
pub struct Opts {
    #[arg(long, short)]
    config: PathBuf,
}

fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    let Opts { config } = Opts::parse();
    let config = std::fs::read_to_string(config).expect("Error reading config file");
    let config = toml::from_str(&config).expect("Error parsing config");

    vixen::Runtime::builder()
        .account(Pipeline::new(SystemProgramAccParser, [Handler]))
        .instruction(Pipeline::new(SystemProgramIxParser, [Handler]))
        .account(Pipeline::new(MeteoraProgramAccParser, [Handler]))
        .instruction(Pipeline::new(MeteoraProgramIxParser, [Handler]))
        .build(config)
        .run();
}
