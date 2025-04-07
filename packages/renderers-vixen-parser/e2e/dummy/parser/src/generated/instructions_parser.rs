//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use codama_renderers_rust_e2e_dummy::instructions::{
    Instruction1 as Instruction1IxAccounts, Instruction2 as Instruction2IxAccounts,
    Instruction3 as Instruction3IxAccounts, Instruction4 as Instruction4IxAccounts,
    Instruction4InstructionArgs as Instruction4IxData, Instruction5 as Instruction5IxAccounts,
    Instruction5InstructionArgs as Instruction5IxData, Instruction6 as Instruction6IxAccounts,
    Instruction7 as Instruction7IxAccounts,
};
use codama_renderers_rust_e2e_dummy::ID;

/// Dummy Instructions
#[derive(Debug)]
pub enum DummyProgramIx {
    Instruction1(Instruction1IxAccounts),
    Instruction2(Instruction2IxAccounts),
    Instruction3(Instruction3IxAccounts),
    Instruction4(Instruction4IxAccounts, Instruction4IxData),
    Instruction5(Instruction5IxAccounts, Instruction5IxData),
    Instruction6(Instruction6IxAccounts),
    Instruction7(Instruction7IxAccounts),
}

#[derive(Debug, Copy, Clone)]
pub struct InstructionParser;

impl yellowstone_vixen_core::Parser for InstructionParser {
    type Input = yellowstone_vixen_core::instruction::InstructionUpdate;
    type Output = DummyProgramIx;

    fn id(&self) -> std::borrow::Cow<str> {
        "Dummy::InstructionParser".into()
    }

    fn prefilter(&self) -> yellowstone_vixen_core::Prefilter {
        yellowstone_vixen_core::Prefilter::builder()
            .transaction_accounts([ID])
            .build()
            .unwrap()
    }

    async fn parse(
        &self,
        ix_update: &yellowstone_vixen_core::instruction::InstructionUpdate,
    ) -> yellowstone_vixen_core::ParseResult<Self::Output> {
        if ix_update.program.equals_ref(ID) {
            InstructionParser::parse_impl(ix_update)
        } else {
            Err(yellowstone_vixen_core::ParseError::Filtered)
        }
    }
}

impl yellowstone_vixen_core::ProgramParser for InstructionParser {
    #[inline]
    fn program_id(&self) -> yellowstone_vixen_core::Pubkey {
        ID.to_bytes().into()
    }
}

impl InstructionParser {
    pub(crate) fn parse_impl(
        ix: &yellowstone_vixen_core::instruction::InstructionUpdate,
    ) -> yellowstone_vixen_core::ParseResult<DummyProgramIx> {
        let accounts_len = ix.accounts.len();
        let ix_discriminator: [u8; 1] = ix.data[0..1].try_into()?;
        let mut ix_data = &ix.data[1..];
        match ix_discriminator {
            [42] => {
                check_min_accounts_req(accounts_len, 0)?;
                let ix_accounts = Instruction3IxAccounts {};
                Ok(DummyProgramIx::Instruction3(ix_accounts))
            }
            _ => Err(yellowstone_vixen_core::ParseError::from(
                "Invalid Instruction discriminator".to_owned(),
            )),
        }
    }
}

pub fn check_min_accounts_req(
    actual: usize,
    expected: usize,
) -> yellowstone_vixen_core::ParseResult<()> {
    if actual < expected {
        Err(yellowstone_vixen_core::ParseError::from(format!(
            "Too few accounts provided: expected {expected}, got {actual}"
        )))
    } else {
        Ok(())
    }
}

// #[cfg(feature = "proto")]
mod proto_parser {
    use yellowstone_vixen_core::proto_helper_traits;
    proto_helper_traits!();
    use super::{DummyProgramIx, InstructionParser};
    use crate::proto_def;
    use yellowstone_vixen_core::proto::ParseProto;

    use super::Instruction1IxAccounts;
    impl IntoProto<proto_def::Instruction1IxAccounts> for Instruction1IxAccounts {
        fn into_proto(self) -> proto_def::Instruction1IxAccounts {
            proto_def::Instruction1IxAccounts {}
        }
    }
    use super::Instruction2IxAccounts;
    impl IntoProto<proto_def::Instruction2IxAccounts> for Instruction2IxAccounts {
        fn into_proto(self) -> proto_def::Instruction2IxAccounts {
            proto_def::Instruction2IxAccounts {}
        }
    }
    use super::Instruction3IxAccounts;
    impl IntoProto<proto_def::Instruction3IxAccounts> for Instruction3IxAccounts {
        fn into_proto(self) -> proto_def::Instruction3IxAccounts {
            proto_def::Instruction3IxAccounts {}
        }
    }
    use super::Instruction4IxAccounts;
    impl IntoProto<proto_def::Instruction4IxAccounts> for Instruction4IxAccounts {
        fn into_proto(self) -> proto_def::Instruction4IxAccounts {
            proto_def::Instruction4IxAccounts {}
        }
    }
    use super::Instruction4IxData;
    impl IntoProto<proto_def::Instruction4IxData> for Instruction4IxData {
        fn into_proto(self) -> proto_def::Instruction4IxData {
            proto_def::Instruction4IxData {
                my_argument: self.my_argument.into(),
            }
        }
    }
    use super::Instruction5IxAccounts;
    impl IntoProto<proto_def::Instruction5IxAccounts> for Instruction5IxAccounts {
        fn into_proto(self) -> proto_def::Instruction5IxAccounts {
            proto_def::Instruction5IxAccounts {}
        }
    }
    use super::Instruction5IxData;
    impl IntoProto<proto_def::Instruction5IxData> for Instruction5IxData {
        fn into_proto(self) -> proto_def::Instruction5IxData {
            proto_def::Instruction5IxData {
                my_argument: self.my_argument.into(),
            }
        }
    }
    use super::Instruction6IxAccounts;
    impl IntoProto<proto_def::Instruction6IxAccounts> for Instruction6IxAccounts {
        fn into_proto(self) -> proto_def::Instruction6IxAccounts {
            proto_def::Instruction6IxAccounts {
                my_account: self.my_account.to_string(),
            }
        }
    }
    use super::Instruction7IxAccounts;
    impl IntoProto<proto_def::Instruction7IxAccounts> for Instruction7IxAccounts {
        fn into_proto(self) -> proto_def::Instruction7IxAccounts {
            proto_def::Instruction7IxAccounts {
                my_account: self.my_account.map(|p| p.to_string()),
            }
        }
    }

    impl IntoProto<proto_def::DummyProgramIx> for DummyProgramIx {
        fn into_proto(self) -> proto_def::DummyProgramIx {
            match self {
                DummyProgramIx::Instruction1(acc) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction1(
                        proto_def::Instruction1Ix {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction2(acc) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction2(
                        proto_def::Instruction2Ix {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction3(acc) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction3(
                        proto_def::Instruction3Ix {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction4(acc, data) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction4(
                        proto_def::Instruction4Ix {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction5(acc, data) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction5(
                        proto_def::Instruction5Ix {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction6(acc) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction6(
                        proto_def::Instruction6Ix {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
                DummyProgramIx::Instruction7(acc) => proto_def::DummyProgramIx {
                    ix_oneof: Some(proto_def::dummy_program_ix::IxOneof::Instruction7(
                        proto_def::Instruction7Ix {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
            }
        }
    }

    impl ParseProto for InstructionParser {
        type Message = proto_def::DummyProgramIx;

        fn output_into_message(value: Self::Output) -> Self::Message {
            value.into_proto()
        }
    }
}
