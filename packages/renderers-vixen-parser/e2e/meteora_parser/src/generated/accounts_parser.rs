//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use codama_renderers_rust_e2e_meteora::accounts::BinArray;
use codama_renderers_rust_e2e_meteora::accounts::BinArrayBitmapExtension;
use codama_renderers_rust_e2e_meteora::accounts::LbPair;
use codama_renderers_rust_e2e_meteora::accounts::Oracle;
use codama_renderers_rust_e2e_meteora::accounts::Position;
use codama_renderers_rust_e2e_meteora::accounts::PositionV2;
use codama_renderers_rust_e2e_meteora::accounts::PresetParameter;
use codama_renderers_rust_e2e_meteora::ID;

/// LbClmm Program State
#[allow(clippy::large_enum_variant)]
#[derive(Debug)]
pub enum LbClmmProgramState {
    BinArrayBitmapExtension(BinArrayBitmapExtension),
    BinArray(BinArray),
    LbPair(LbPair),
    Oracle(Oracle),
    Position(Position),
    PositionV2(PositionV2),
    PresetParameter(PresetParameter),
}

impl LbClmmProgramState {
    pub fn try_unpack(data_bytes: &[u8]) -> yellowstone_vixen_core::ParseResult<Self> {
        let acc_discriminator: [u8; 8] = data_bytes[0..8].try_into()?;
        match acc_discriminator {
            [80, 111, 124, 113, 55, 237, 18, 5] => Ok(LbClmmProgramState::BinArrayBitmapExtension(
                BinArrayBitmapExtension::from_bytes(data_bytes)?,
            )),
            [92, 142, 92, 220, 5, 148, 70, 181] => Ok(LbClmmProgramState::BinArray(
                BinArray::from_bytes(data_bytes)?,
            )),
            [33, 11, 49, 98, 181, 101, 177, 13] => {
                Ok(LbClmmProgramState::LbPair(LbPair::from_bytes(data_bytes)?))
            }
            [139, 194, 131, 179, 140, 179, 229, 244] => {
                Ok(LbClmmProgramState::Oracle(Oracle::from_bytes(data_bytes)?))
            }
            [170, 188, 143, 228, 122, 64, 247, 208] => Ok(LbClmmProgramState::Position(
                Position::from_bytes(data_bytes)?,
            )),
            [117, 176, 212, 199, 245, 180, 133, 182] => Ok(LbClmmProgramState::PositionV2(
                PositionV2::from_bytes(data_bytes)?,
            )),
            [242, 62, 244, 34, 181, 112, 58, 170] => Ok(LbClmmProgramState::PresetParameter(
                PresetParameter::from_bytes(data_bytes)?,
            )),
            _ => Err(yellowstone_vixen_core::ParseError::from(
                "Invalid Account discriminator".to_owned(),
            )),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct AccountParser;

impl yellowstone_vixen_core::Parser for AccountParser {
    type Input = yellowstone_vixen_core::AccountUpdate;
    type Output = LbClmmProgramState;

    fn id(&self) -> std::borrow::Cow<str> {
        "lb_clmm::AccountParser".into()
    }

    fn prefilter(&self) -> yellowstone_vixen_core::Prefilter {
        yellowstone_vixen_core::Prefilter::builder()
            .account_owners([ID])
            .build()
            .unwrap()
    }

    async fn parse(
        &self,
        acct: &yellowstone_vixen_core::AccountUpdate,
    ) -> yellowstone_vixen_core::ParseResult<Self::Output> {
        let inner = acct
            .account
            .as_ref()
            .ok_or(solana_program::program_error::ProgramError::InvalidArgument)?;
        LbClmmProgramState::try_unpack(&inner.data)
    }
}

impl yellowstone_vixen_core::ProgramParser for AccountParser {
    #[inline]
    fn program_id(&self) -> yellowstone_vixen_core::Pubkey {
        ID.to_bytes().into()
    }
}
