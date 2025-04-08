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
        let data_len = data_bytes.len();
        match data_len {
            BinArrayBitmapExtension::LEN => Ok(LbClmmProgramState::BinArrayBitmapExtension(
                BinArrayBitmapExtension::from_bytes(data_bytes)?,
            )),
            BinArray::LEN => Ok(LbClmmProgramState::BinArray(BinArray::from_bytes(
                data_bytes,
            )?)),
            LbPair::LEN => Ok(LbClmmProgramState::LbPair(LbPair::from_bytes(data_bytes)?)),
            Oracle::LEN => Ok(LbClmmProgramState::Oracle(Oracle::from_bytes(data_bytes)?)),
            Position::LEN => Ok(LbClmmProgramState::Position(Position::from_bytes(
                data_bytes,
            )?)),
            PositionV2::LEN => Ok(LbClmmProgramState::PositionV2(PositionV2::from_bytes(
                data_bytes,
            )?)),
            PresetParameter::LEN => Ok(LbClmmProgramState::PresetParameter(
                PresetParameter::from_bytes(data_bytes)?,
            )),
            _ => Err(yellowstone_vixen_core::ParseError::from(
                "Invalid Account data length".to_owned(),
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

// #[cfg(feature = "proto")]
mod proto_parser {
    use super::{AccountParser, LbClmmProgramState};
    use crate::{proto_def, proto_helpers::proto_types_parsers::IntoProto};
    use yellowstone_vixen_core::proto::ParseProto;

    use super::BinArrayBitmapExtension;
    impl IntoProto<proto_def::BinArrayBitmapExtension> for BinArrayBitmapExtension {
        fn into_proto(self) -> proto_def::BinArrayBitmapExtension {
            proto_def::BinArrayBitmapExtension {
                lb_pair: self.lb_pair.to_string(),
                positive_bin_array_bitmap: self
                    .positive_bin_array_bitmap
                    .into_iter()
                    .map(|x| proto_def::RepeatedUint64Row { rows: x.to_vec() })
                    .collect(),
                negative_bin_array_bitmap: self
                    .negative_bin_array_bitmap
                    .into_iter()
                    .map(|x| proto_def::RepeatedUint64Row { rows: x.to_vec() })
                    .collect(),
            }
        }
    }
    use super::BinArray;
    impl IntoProto<proto_def::BinArray> for BinArray {
        fn into_proto(self) -> proto_def::BinArray {
            proto_def::BinArray {
                index: self.index,
                version: self.version.into(),
                padding: self.padding.to_vec(),
                lb_pair: self.lb_pair.to_string(),
                bins: self.bins.into_iter().map(|x| x.into_proto()).collect(),
            }
        }
    }
    use super::LbPair;
    impl IntoProto<proto_def::LbPair> for LbPair {
        fn into_proto(self) -> proto_def::LbPair {
            proto_def::LbPair {
                parameters: Some(self.parameters.into_proto()),
                v_parameters: Some(self.v_parameters.into_proto()),
                bump_seed: self.bump_seed.to_vec(),
                bin_step_seed: self.bin_step_seed.to_vec(),
                pair_type: self.pair_type.into(),
                active_id: self.active_id,
                bin_step: self.bin_step.into(),
                status: self.status.into(),
                require_base_factor_seed: self.require_base_factor_seed.into(),
                base_factor_seed: self.base_factor_seed.to_vec(),
                activation_type: self.activation_type.into(),
                padding0: self.padding0.into(),
                token_x_mint: self.token_x_mint.to_string(),
                token_y_mint: self.token_y_mint.to_string(),
                reserve_x: self.reserve_x.to_string(),
                reserve_y: self.reserve_y.to_string(),
                protocol_fee: Some(self.protocol_fee.into_proto()),
                padding1: self.padding1.to_vec(),
                reward_infos: self
                    .reward_infos
                    .into_iter()
                    .map(|x| x.into_proto())
                    .collect(),
                oracle: self.oracle.to_string(),
                bin_array_bitmap: self.bin_array_bitmap.to_vec(),
                last_updated_at: self.last_updated_at,
                padding2: self.padding2.to_vec(),
                pre_activation_swap_address: self.pre_activation_swap_address.to_string(),
                base_key: self.base_key.to_string(),
                activation_point: self.activation_point,
                pre_activation_duration: self.pre_activation_duration,
                padding3: self.padding3.to_vec(),
                padding4: self.padding4,
                creator: self.creator.to_string(),
                reserved: self.reserved.to_vec(),
            }
        }
    }
    use super::Oracle;
    impl IntoProto<proto_def::Oracle> for Oracle {
        fn into_proto(self) -> proto_def::Oracle {
            proto_def::Oracle {
                idx: self.idx,
                active_size: self.active_size,
                length: self.length,
            }
        }
    }
    use super::Position;
    impl IntoProto<proto_def::Position> for Position {
        fn into_proto(self) -> proto_def::Position {
            proto_def::Position {
                lb_pair: self.lb_pair.to_string(),
                owner: self.owner.to_string(),
                liquidity_shares: self.liquidity_shares.to_vec(),
                reward_infos: self
                    .reward_infos
                    .into_iter()
                    .map(|x| x.into_proto())
                    .collect(),
                fee_infos: self.fee_infos.into_iter().map(|x| x.into_proto()).collect(),
                lower_bin_id: self.lower_bin_id,
                upper_bin_id: self.upper_bin_id,
                last_updated_at: self.last_updated_at,
                total_claimed_fee_x_amount: self.total_claimed_fee_x_amount,
                total_claimed_fee_y_amount: self.total_claimed_fee_y_amount,
                total_claimed_rewards: self.total_claimed_rewards.to_vec(),
                reserved: self.reserved.to_vec(),
            }
        }
    }
    use super::PositionV2;
    impl IntoProto<proto_def::PositionV2> for PositionV2 {
        fn into_proto(self) -> proto_def::PositionV2 {
            proto_def::PositionV2 {
                lb_pair: self.lb_pair.to_string(),
                owner: self.owner.to_string(),
                liquidity_shares: self
                    .liquidity_shares
                    .into_iter()
                    .map(|x| x.to_le_bytes().to_vec())
                    .collect(),
                reward_infos: self
                    .reward_infos
                    .into_iter()
                    .map(|x| x.into_proto())
                    .collect(),
                fee_infos: self.fee_infos.into_iter().map(|x| x.into_proto()).collect(),
                lower_bin_id: self.lower_bin_id,
                upper_bin_id: self.upper_bin_id,
                last_updated_at: self.last_updated_at,
                total_claimed_fee_x_amount: self.total_claimed_fee_x_amount,
                total_claimed_fee_y_amount: self.total_claimed_fee_y_amount,
                total_claimed_rewards: self.total_claimed_rewards.to_vec(),
                operator: self.operator.to_string(),
                lock_release_point: self.lock_release_point,
                padding0: self.padding0.into(),
                fee_owner: self.fee_owner.to_string(),
                reserved: self.reserved.to_vec(),
            }
        }
    }
    use super::PresetParameter;
    impl IntoProto<proto_def::PresetParameter> for PresetParameter {
        fn into_proto(self) -> proto_def::PresetParameter {
            proto_def::PresetParameter {
                bin_step: self.bin_step.into(),
                base_factor: self.base_factor.into(),
                filter_period: self.filter_period.into(),
                decay_period: self.decay_period.into(),
                reduction_factor: self.reduction_factor.into(),
                variable_fee_control: self.variable_fee_control,
                max_volatility_accumulator: self.max_volatility_accumulator,
                min_bin_id: self.min_bin_id,
                max_bin_id: self.max_bin_id,
                protocol_share: self.protocol_share.into(),
            }
        }
    }

    impl IntoProto<proto_def::LbClmmProgramState> for LbClmmProgramState {
        fn into_proto(self) -> proto_def::LbClmmProgramState {
            let state_oneof = match self {
                LbClmmProgramState::BinArrayBitmapExtension(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::BinArrayBitmapExtension(
                        data.into_proto(),
                    )
                }
                LbClmmProgramState::BinArray(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::BinArray(data.into_proto())
                }
                LbClmmProgramState::LbPair(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::LbPair(data.into_proto())
                }
                LbClmmProgramState::Oracle(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::Oracle(data.into_proto())
                }
                LbClmmProgramState::Position(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::Position(data.into_proto())
                }
                LbClmmProgramState::PositionV2(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::PositionV2(data.into_proto())
                }
                LbClmmProgramState::PresetParameter(data) => {
                    proto_def::lb_clmm_program_state::StateOneof::PresetParameter(data.into_proto())
                }
            };

            proto_def::LbClmmProgramState {
                state_oneof: Some(state_oneof),
            }
        }
    }

    impl ParseProto for AccountParser {
        type Message = proto_def::LbClmmProgramState;

        fn output_into_message(value: Self::Output) -> Self::Message {
            value.into_proto()
        }
    }
}
