//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use system_program_sdk::instructions::{
    AdvanceNonceAccount as AdvanceNonceAccountIxAccounts,
    AdvanceNonceAccountInstructionArgs as AdvanceNonceAccountIxData,
    Allocate as AllocateIxAccounts, AllocateInstructionArgs as AllocateIxData,
    AllocateWithSeed as AllocateWithSeedIxAccounts,
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
    UpgradeNonceAccountInstructionArgs as UpgradeNonceAccountIxData,
    WithdrawNonceAccount as WithdrawNonceAccountIxAccounts,
    WithdrawNonceAccountInstructionArgs as WithdrawNonceAccountIxData,
};
use system_program_sdk::ID;

/// System Instructions
#[derive(Debug)]
pub enum SystemProgramIx {
    CreateAccount(CreateAccountIxAccounts, CreateAccountIxData),
    Assign(AssignIxAccounts, AssignIxData),
    TransferSol(TransferSolIxAccounts, TransferSolIxData),
    CreateAccountWithSeed(CreateAccountWithSeedIxAccounts, CreateAccountWithSeedIxData),
    AdvanceNonceAccount(AdvanceNonceAccountIxAccounts, AdvanceNonceAccountIxData),
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
    UpgradeNonceAccount(UpgradeNonceAccountIxAccounts, UpgradeNonceAccountIxData),
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
                let de_ix_data: CreateAccountIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = CreateAccountIxAccounts {
                    payer: ix.accounts[0],
                    new_account: ix.accounts[1],
                };
                Ok(SystemProgramIx::CreateAccount(ix_accounts, de_ix_data))
            }
            [1] => {
                check_min_accounts_req(accounts_len, 1)?;
                let de_ix_data: AssignIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AssignIxAccounts {
                    account: ix.accounts[0],
                };
                Ok(SystemProgramIx::Assign(ix_accounts, de_ix_data))
            }
            [2] => {
                check_min_accounts_req(accounts_len, 2)?;
                let de_ix_data: TransferSolIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = TransferSolIxAccounts {
                    source: ix.accounts[0],
                    destination: ix.accounts[1],
                };
                Ok(SystemProgramIx::TransferSol(ix_accounts, de_ix_data))
            }
            [3] => {
                check_min_accounts_req(accounts_len, 3)?;
                let de_ix_data: CreateAccountWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = CreateAccountWithSeedIxAccounts {
                    payer: ix.accounts[0],
                    new_account: ix.accounts[1],
                    base_account: ix.accounts[2],
                };
                Ok(SystemProgramIx::CreateAccountWithSeed(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [4] => {
                check_min_accounts_req(accounts_len, 3)?;
                let de_ix_data: AdvanceNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AdvanceNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0],
                    recent_blockhashes_sysvar: ix.accounts[1],
                    nonce_authority: ix.accounts[2],
                };
                Ok(SystemProgramIx::AdvanceNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [5] => {
                check_min_accounts_req(accounts_len, 5)?;
                let de_ix_data: WithdrawNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = WithdrawNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0],
                    recipient_account: ix.accounts[1],
                    recent_blockhashes_sysvar: ix.accounts[2],
                    rent_sysvar: ix.accounts[3],
                    nonce_authority: ix.accounts[4],
                };
                Ok(SystemProgramIx::WithdrawNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [6] => {
                check_min_accounts_req(accounts_len, 3)?;
                let de_ix_data: InitializeNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = InitializeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0],
                    recent_blockhashes_sysvar: ix.accounts[1],
                    rent_sysvar: ix.accounts[2],
                };
                Ok(SystemProgramIx::InitializeNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [7] => {
                check_min_accounts_req(accounts_len, 2)?;
                let de_ix_data: AuthorizeNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AuthorizeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0],
                    nonce_authority: ix.accounts[1],
                };
                Ok(SystemProgramIx::AuthorizeNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [8] => {
                check_min_accounts_req(accounts_len, 1)?;
                let de_ix_data: AllocateIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AllocateIxAccounts {
                    new_account: ix.accounts[0],
                };
                Ok(SystemProgramIx::Allocate(ix_accounts, de_ix_data))
            }
            [9] => {
                check_min_accounts_req(accounts_len, 2)?;
                let de_ix_data: AllocateWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AllocateWithSeedIxAccounts {
                    new_account: ix.accounts[0],
                    base_account: ix.accounts[1],
                };
                Ok(SystemProgramIx::AllocateWithSeed(ix_accounts, de_ix_data))
            }
            [10] => {
                check_min_accounts_req(accounts_len, 2)?;
                let de_ix_data: AssignWithSeedIxData = BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = AssignWithSeedIxAccounts {
                    account: ix.accounts[0],
                    base_account: ix.accounts[1],
                };
                Ok(SystemProgramIx::AssignWithSeed(ix_accounts, de_ix_data))
            }
            [11] => {
                check_min_accounts_req(accounts_len, 3)?;
                let de_ix_data: TransferSolWithSeedIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = TransferSolWithSeedIxAccounts {
                    source: ix.accounts[0],
                    base_account: ix.accounts[1],
                    destination: ix.accounts[2],
                };
                Ok(SystemProgramIx::TransferSolWithSeed(
                    ix_accounts,
                    de_ix_data,
                ))
            }
            [12] => {
                check_min_accounts_req(accounts_len, 1)?;
                let de_ix_data: UpgradeNonceAccountIxData =
                    BorshDeserialize::deserialize(&mut ix_data)?;
                let ix_accounts = UpgradeNonceAccountIxAccounts {
                    nonce_account: ix.accounts[0],
                };
                Ok(SystemProgramIx::UpgradeNonceAccount(
                    ix_accounts,
                    de_ix_data,
                ))
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
