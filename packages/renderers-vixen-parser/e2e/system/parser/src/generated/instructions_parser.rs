//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use codama_renderers_rust_e2e_system::instructions::{
    AdvanceNonceAccount as AdvanceNonceAccountIxAccounts, Allocate as AllocateIxAccounts,
    AllocateInstructionArgs as AllocateIxData, AllocateWithSeed as AllocateWithSeedIxAccounts,
    AllocateWithSeedInstructionArgs as AllocateWithSeedIxData, Assign as AssignIxAccounts,
    AssignInstructionArgs as AssignIxData, AssignWithSeed as AssignWithSeedIxAccounts,
    AssignWithSeedInstructionArgs as AssignWithSeedIxData,
    AuthorizeNonceAccount as AuthorizeNonceAccountIxAccounts,
    AuthorizeNonceAccountInstructionArgs as AuthorizeNonceAccountIxData,
    CreateAccount as CreateAccountIxAccounts, CreateAccountInstructionArgs as CreateAccountIxData,
    CreateAccountWithSeed as CreateAccountWithSeedIxAccounts,
    CreateAccountWithSeedInstructionArgs as CreateAccountWithSeedIxData,
    InitializeNonceAccount as InitializeNonceAccountIxAccounts,
    InitializeNonceAccountInstructionArgs as InitializeNonceAccountIxData,
    TransferSol as TransferSolIxAccounts, TransferSolInstructionArgs as TransferSolIxData,
    TransferSolWithSeed as TransferSolWithSeedIxAccounts,
    TransferSolWithSeedInstructionArgs as TransferSolWithSeedIxData,
    UpgradeNonceAccount as UpgradeNonceAccountIxAccounts,
    WithdrawNonceAccount as WithdrawNonceAccountIxAccounts,
    WithdrawNonceAccountInstructionArgs as WithdrawNonceAccountIxData,
};
use codama_renderers_rust_e2e_system::ID;

/// System Instructions
#[derive(Debug)]
pub enum SystemProgramIx {
    CreateAccount(CreateAccountIxAccounts, CreateAccountIxData),
    Assign(AssignIxAccounts, AssignIxData),
    TransferSol(TransferSolIxAccounts, TransferSolIxData),
    CreateAccountWithSeed(CreateAccountWithSeedIxAccounts, CreateAccountWithSeedIxData),
    AdvanceNonceAccount(AdvanceNonceAccountIxAccounts),
    WithdrawNonceAccount(WithdrawNonceAccountIxAccounts, WithdrawNonceAccountIxData),
    InitializeNonceAccount(
        InitializeNonceAccountIxAccounts,
        InitializeNonceAccountIxData,
    ),
    AuthorizeNonceAccount(AuthorizeNonceAccountIxAccounts, AuthorizeNonceAccountIxData),
    Allocate(AllocateIxAccounts, AllocateIxData),
    AllocateWithSeed(AllocateWithSeedIxAccounts, AllocateWithSeedIxData),
    AssignWithSeed(AssignWithSeedIxAccounts, AssignWithSeedIxData),
    TransferSolWithSeed(TransferSolWithSeedIxAccounts, TransferSolWithSeedIxData),
    UpgradeNonceAccount(UpgradeNonceAccountIxAccounts),
}

#[derive(Debug, Copy, Clone)]
pub struct InstructionParser;

impl yellowstone_vixen_core::Parser for InstructionParser {
    type Input = yellowstone_vixen_core::instruction::InstructionUpdate;
    type Output = SystemProgramIx;

    fn id(&self) -> std::borrow::Cow<str> {
        "System::InstructionParser".into()
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
    ) -> yellowstone_vixen_core::ParseResult<SystemProgramIx> {
        let accounts_len = ix.accounts.len();
        let ix_discriminator: [u8; 1] = ix.data[0..1].try_into()?;
        let mut ix_data = &ix.data[1..];
        match ix_discriminator {
            [0] => {
                check_min_accounts_req(accounts_len, 2)?;
                let ix_accounts = CreateAccountIxAccounts {
                    payer: ix.accounts[0].0.into(),
                    new_account: ix.accounts[1].0.into(),
                };
                let de_ix_data: CreateAccountIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::CreateAccount(ix_accounts, de_ix_data))
            }
            [1] => {
                check_min_accounts_req(accounts_len, 1)?;
                let ix_accounts = AssignIxAccounts {
                    account: ix.accounts[0].0.into(),
                };
                let de_ix_data: AssignIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::Assign(ix_accounts, de_ix_data))
            }
            [2] => {
                check_min_accounts_req(accounts_len, 2)?;
                let ix_accounts = TransferSolIxAccounts {
                    source: ix.accounts[0].0.into(),
                    destination: ix.accounts[1].0.into(),
                };
                let de_ix_data: TransferSolIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::TransferSol(ix_accounts, de_ix_data))
            }
            [3] => {
                check_min_accounts_req(accounts_len, 3)?;
                let ix_accounts = CreateAccountWithSeedIxAccounts {
                    payer: ix.accounts[0].0.into(),
                    new_account: ix.accounts[1].0.into(),
                    base_account: ix.accounts[2].0.into(),
                };
                let de_ix_data: CreateAccountWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::CreateAccountWithSeed(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [4] => {
                check_min_accounts_req(accounts_len, 3)?;
                let ix_accounts = AdvanceNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0].0.into(),
                    recent_blockhashes_sysvar: ix.accounts[1].0.into(),
                    nonce_authority: ix.accounts[2].0.into(),
                };
                Ok(SystemProgramIx::AdvanceNonceAccount(ix_accounts))
            }
            [5] => {
                check_min_accounts_req(accounts_len, 5)?;
                let ix_accounts = WithdrawNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0].0.into(),
                    recipient_account: ix.accounts[1].0.into(),
                    recent_blockhashes_sysvar: ix.accounts[2].0.into(),
                    rent_sysvar: ix.accounts[3].0.into(),
                    nonce_authority: ix.accounts[4].0.into(),
                };
                let de_ix_data: WithdrawNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::WithdrawNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [6] => {
                check_min_accounts_req(accounts_len, 3)?;
                let ix_accounts = InitializeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0].0.into(),
                    recent_blockhashes_sysvar: ix.accounts[1].0.into(),
                    rent_sysvar: ix.accounts[2].0.into(),
                };
                let de_ix_data: InitializeNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::InitializeNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [7] => {
                check_min_accounts_req(accounts_len, 2)?;
                let ix_accounts = AuthorizeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0].0.into(),
                    nonce_authority: ix.accounts[1].0.into(),
                };
                let de_ix_data: AuthorizeNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::AuthorizeNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [8] => {
                check_min_accounts_req(accounts_len, 1)?;
                let ix_accounts = AllocateIxAccounts {
                    new_account: ix.accounts[0].0.into(),
                };
                let de_ix_data: AllocateIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::Allocate(ix_accounts, de_ix_data))
            }
            [9] => {
                check_min_accounts_req(accounts_len, 2)?;
                let ix_accounts = AllocateWithSeedIxAccounts {
                    new_account: ix.accounts[0].0.into(),
                    base_account: ix.accounts[1].0.into(),
                };
                let de_ix_data: AllocateWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::AllocateWithSeed(ix_accounts, de_ix_data))
            }
            [10] => {
                check_min_accounts_req(accounts_len, 2)?;
                let ix_accounts = AssignWithSeedIxAccounts {
                    account: ix.accounts[0].0.into(),
                    base_account: ix.accounts[1].0.into(),
                };
                let de_ix_data: AssignWithSeedIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::AssignWithSeed(ix_accounts, de_ix_data))
            }
            [11] => {
                check_min_accounts_req(accounts_len, 3)?;
                let ix_accounts = TransferSolWithSeedIxAccounts {
                    source: ix.accounts[0].0.into(),
                    base_account: ix.accounts[1].0.into(),
                    destination: ix.accounts[2].0.into(),
                };
                let de_ix_data: TransferSolWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                Ok(SystemProgramIx::TransferSolWithSeed(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [12] => {
                check_min_accounts_req(accounts_len, 1)?;
                let ix_accounts = UpgradeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0].0.into(),
                };
                Ok(SystemProgramIx::UpgradeNonceAccount(ix_accounts))
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
    use super::{InstructionParser, SystemProgramIx};
    use crate::proto_def;
    use yellowstone_vixen_core::proto_helper_traits;
    proto_helper_traits!();
    use yellowstone_vixen_core::proto::ParseProto;

    use super::CreateAccountIxAccounts;
    impl IntoProto<proto_def::CreateAccountIxAccounts> for CreateAccountIxAccounts {
        fn into_proto(self) -> proto_def::CreateAccountIxAccounts {
            proto_def::CreateAccountIxAccounts {
                payer: self.payer.to_string(),
                new_account: self.new_account.to_string(),
            }
        }
    }
    use super::CreateAccountIxData;
    impl IntoProto<proto_def::CreateAccountIxData> for CreateAccountIxData {
        fn into_proto(self) -> proto_def::CreateAccountIxData {
            proto_def::CreateAccountIxData {
                lamports: self.lamports,
                space: self.space,
                program_address: self.program_address.to_string(),
            }
        }
    }
    use super::AssignIxAccounts;
    impl IntoProto<proto_def::AssignIxAccounts> for AssignIxAccounts {
        fn into_proto(self) -> proto_def::AssignIxAccounts {
            proto_def::AssignIxAccounts {
                account: self.account.to_string(),
            }
        }
    }
    use super::AssignIxData;
    impl IntoProto<proto_def::AssignIxData> for AssignIxData {
        fn into_proto(self) -> proto_def::AssignIxData {
            proto_def::AssignIxData {
                program_address: self.program_address.to_string(),
            }
        }
    }
    use super::TransferSolIxAccounts;
    impl IntoProto<proto_def::TransferSolIxAccounts> for TransferSolIxAccounts {
        fn into_proto(self) -> proto_def::TransferSolIxAccounts {
            proto_def::TransferSolIxAccounts {
                source: self.source.to_string(),
                destination: self.destination.to_string(),
            }
        }
    }
    use super::TransferSolIxData;
    impl IntoProto<proto_def::TransferSolIxData> for TransferSolIxData {
        fn into_proto(self) -> proto_def::TransferSolIxData {
            proto_def::TransferSolIxData {
                amount: self.amount,
            }
        }
    }
    use super::CreateAccountWithSeedIxAccounts;
    impl IntoProto<proto_def::CreateAccountWithSeedIxAccounts> for CreateAccountWithSeedIxAccounts {
        fn into_proto(self) -> proto_def::CreateAccountWithSeedIxAccounts {
            proto_def::CreateAccountWithSeedIxAccounts {
                payer: self.payer.to_string(),
                new_account: self.new_account.to_string(),
                base_account: self.base_account.to_string(),
            }
        }
    }
    use super::CreateAccountWithSeedIxData;
    impl IntoProto<proto_def::CreateAccountWithSeedIxData> for CreateAccountWithSeedIxData {
        fn into_proto(self) -> proto_def::CreateAccountWithSeedIxData {
            proto_def::CreateAccountWithSeedIxData {
                base: self.base.to_string(),
                seed: self.seed,
                amount: self.amount,
                space: self.space,
                program_address: self.program_address.to_string(),
            }
        }
    }
    use super::AdvanceNonceAccountIxAccounts;
    impl IntoProto<proto_def::AdvanceNonceAccountIxAccounts> for AdvanceNonceAccountIxAccounts {
        fn into_proto(self) -> proto_def::AdvanceNonceAccountIxAccounts {
            proto_def::AdvanceNonceAccountIxAccounts {
                nonce_account: self.nonce_account.to_string(),
                recent_blockhashes_sysvar: self.recent_blockhashes_sysvar.to_string(),
                nonce_authority: self.nonce_authority.to_string(),
            }
        }
    }
    use super::WithdrawNonceAccountIxAccounts;
    impl IntoProto<proto_def::WithdrawNonceAccountIxAccounts> for WithdrawNonceAccountIxAccounts {
        fn into_proto(self) -> proto_def::WithdrawNonceAccountIxAccounts {
            proto_def::WithdrawNonceAccountIxAccounts {
                nonce_account: self.nonce_account.to_string(),
                recipient_account: self.recipient_account.to_string(),
                recent_blockhashes_sysvar: self.recent_blockhashes_sysvar.to_string(),
                rent_sysvar: self.rent_sysvar.to_string(),
                nonce_authority: self.nonce_authority.to_string(),
            }
        }
    }
    use super::WithdrawNonceAccountIxData;
    impl IntoProto<proto_def::WithdrawNonceAccountIxData> for WithdrawNonceAccountIxData {
        fn into_proto(self) -> proto_def::WithdrawNonceAccountIxData {
            proto_def::WithdrawNonceAccountIxData {
                withdraw_amount: self.withdraw_amount,
            }
        }
    }
    use super::InitializeNonceAccountIxAccounts;
    impl IntoProto<proto_def::InitializeNonceAccountIxAccounts> for InitializeNonceAccountIxAccounts {
        fn into_proto(self) -> proto_def::InitializeNonceAccountIxAccounts {
            proto_def::InitializeNonceAccountIxAccounts {
                nonce_account: self.nonce_account.to_string(),
                recent_blockhashes_sysvar: self.recent_blockhashes_sysvar.to_string(),
                rent_sysvar: self.rent_sysvar.to_string(),
            }
        }
    }
    use super::InitializeNonceAccountIxData;
    impl IntoProto<proto_def::InitializeNonceAccountIxData> for InitializeNonceAccountIxData {
        fn into_proto(self) -> proto_def::InitializeNonceAccountIxData {
            proto_def::InitializeNonceAccountIxData {
                nonce_authority: self.nonce_authority.to_string(),
            }
        }
    }
    use super::AuthorizeNonceAccountIxAccounts;
    impl IntoProto<proto_def::AuthorizeNonceAccountIxAccounts> for AuthorizeNonceAccountIxAccounts {
        fn into_proto(self) -> proto_def::AuthorizeNonceAccountIxAccounts {
            proto_def::AuthorizeNonceAccountIxAccounts {
                nonce_account: self.nonce_account.to_string(),
                nonce_authority: self.nonce_authority.to_string(),
            }
        }
    }
    use super::AuthorizeNonceAccountIxData;
    impl IntoProto<proto_def::AuthorizeNonceAccountIxData> for AuthorizeNonceAccountIxData {
        fn into_proto(self) -> proto_def::AuthorizeNonceAccountIxData {
            proto_def::AuthorizeNonceAccountIxData {
                new_nonce_authority: self.new_nonce_authority.to_string(),
            }
        }
    }
    use super::AllocateIxAccounts;
    impl IntoProto<proto_def::AllocateIxAccounts> for AllocateIxAccounts {
        fn into_proto(self) -> proto_def::AllocateIxAccounts {
            proto_def::AllocateIxAccounts {
                new_account: self.new_account.to_string(),
            }
        }
    }
    use super::AllocateIxData;
    impl IntoProto<proto_def::AllocateIxData> for AllocateIxData {
        fn into_proto(self) -> proto_def::AllocateIxData {
            proto_def::AllocateIxData { space: self.space }
        }
    }
    use super::AllocateWithSeedIxAccounts;
    impl IntoProto<proto_def::AllocateWithSeedIxAccounts> for AllocateWithSeedIxAccounts {
        fn into_proto(self) -> proto_def::AllocateWithSeedIxAccounts {
            proto_def::AllocateWithSeedIxAccounts {
                new_account: self.new_account.to_string(),
                base_account: self.base_account.to_string(),
            }
        }
    }
    use super::AllocateWithSeedIxData;
    impl IntoProto<proto_def::AllocateWithSeedIxData> for AllocateWithSeedIxData {
        fn into_proto(self) -> proto_def::AllocateWithSeedIxData {
            proto_def::AllocateWithSeedIxData {
                base: self.base.to_string(),
                seed: self.seed,
                space: self.space,
                program_address: self.program_address.to_string(),
            }
        }
    }
    use super::AssignWithSeedIxAccounts;
    impl IntoProto<proto_def::AssignWithSeedIxAccounts> for AssignWithSeedIxAccounts {
        fn into_proto(self) -> proto_def::AssignWithSeedIxAccounts {
            proto_def::AssignWithSeedIxAccounts {
                account: self.account.to_string(),
                base_account: self.base_account.to_string(),
            }
        }
    }
    use super::AssignWithSeedIxData;
    impl IntoProto<proto_def::AssignWithSeedIxData> for AssignWithSeedIxData {
        fn into_proto(self) -> proto_def::AssignWithSeedIxData {
            proto_def::AssignWithSeedIxData {
                base: self.base.to_string(),
                seed: self.seed,
                program_address: self.program_address.to_string(),
            }
        }
    }
    use super::TransferSolWithSeedIxAccounts;
    impl IntoProto<proto_def::TransferSolWithSeedIxAccounts> for TransferSolWithSeedIxAccounts {
        fn into_proto(self) -> proto_def::TransferSolWithSeedIxAccounts {
            proto_def::TransferSolWithSeedIxAccounts {
                source: self.source.to_string(),
                base_account: self.base_account.to_string(),
                destination: self.destination.to_string(),
            }
        }
    }
    use super::TransferSolWithSeedIxData;
    impl IntoProto<proto_def::TransferSolWithSeedIxData> for TransferSolWithSeedIxData {
        fn into_proto(self) -> proto_def::TransferSolWithSeedIxData {
            proto_def::TransferSolWithSeedIxData {
                amount: self.amount,
                from_seed: self.from_seed,
                from_owner: self.from_owner.to_string(),
            }
        }
    }
    use super::UpgradeNonceAccountIxAccounts;
    impl IntoProto<proto_def::UpgradeNonceAccountIxAccounts> for UpgradeNonceAccountIxAccounts {
        fn into_proto(self) -> proto_def::UpgradeNonceAccountIxAccounts {
            proto_def::UpgradeNonceAccountIxAccounts {
                nonce_account: self.nonce_account.to_string(),
            }
        }
    }

    impl IntoProto<proto_def::SystemProgramIx> for SystemProgramIx {
        fn into_proto(self) -> proto_def::SystemProgramIx {
            match self {
                SystemProgramIx::CreateAccount(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::CreateAccount(
                        proto_def::CreateAccountIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::Assign(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::Assign(
                        proto_def::AssignIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::TransferSol(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::TransferSol(
                        proto_def::TransferSolIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::CreateAccountWithSeed(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(
                        proto_def::system_program_ix::IxOneof::CreateAccountWithSeed(
                            proto_def::CreateAccountWithSeedIx {
                                accounts: Some(acc.into_proto()),
                                data: Some(data.into_proto()),
                            },
                        ),
                    ),
                },
                SystemProgramIx::AdvanceNonceAccount(acc) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::AdvanceNonceAccount(
                        proto_def::AdvanceNonceAccountIx {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::WithdrawNonceAccount(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::WithdrawNonceAccount(
                        proto_def::WithdrawNonceAccountIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::InitializeNonceAccount(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(
                        proto_def::system_program_ix::IxOneof::InitializeNonceAccount(
                            proto_def::InitializeNonceAccountIx {
                                accounts: Some(acc.into_proto()),
                                data: Some(data.into_proto()),
                            },
                        ),
                    ),
                },
                SystemProgramIx::AuthorizeNonceAccount(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(
                        proto_def::system_program_ix::IxOneof::AuthorizeNonceAccount(
                            proto_def::AuthorizeNonceAccountIx {
                                accounts: Some(acc.into_proto()),
                                data: Some(data.into_proto()),
                            },
                        ),
                    ),
                },
                SystemProgramIx::Allocate(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::Allocate(
                        proto_def::AllocateIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::AllocateWithSeed(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::AllocateWithSeed(
                        proto_def::AllocateWithSeedIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::AssignWithSeed(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::AssignWithSeed(
                        proto_def::AssignWithSeedIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::TransferSolWithSeed(acc, data) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::TransferSolWithSeed(
                        proto_def::TransferSolWithSeedIx {
                            accounts: Some(acc.into_proto()),
                            data: Some(data.into_proto()),
                        },
                    )),
                },
                SystemProgramIx::UpgradeNonceAccount(acc) => proto_def::SystemProgramIx {
                    ix_oneof: Some(proto_def::system_program_ix::IxOneof::UpgradeNonceAccount(
                        proto_def::UpgradeNonceAccountIx {
                            accounts: Some(acc.into_proto()),
                        },
                    )),
                },
            }
        }
    }

    impl ParseProto for InstructionParser {
        type Message = proto_def::SystemProgramIx;

        fn output_into_message(value: Self::Output) -> Self::Message {
            value.into_proto()
        }
    }
}
