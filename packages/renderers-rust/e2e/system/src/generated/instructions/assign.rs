//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_pubkey::Pubkey;

pub const ASSIGN_DISCRIMINATOR: u32 = 1;

/// Accounts.
#[derive(Debug)]
pub struct Assign {
    pub account: solana_pubkey::Pubkey,
}

impl Assign {
    pub fn instruction(&self, args: AssignInstructionArgs) -> solana_instruction::Instruction {
        self.instruction_with_remaining_accounts(args, &[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        args: AssignInstructionArgs,
        remaining_accounts: &[solana_instruction::AccountMeta],
    ) -> solana_instruction::Instruction {
        let mut accounts = Vec::with_capacity(1 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new(self.account, true));
        accounts.extend_from_slice(remaining_accounts);
        let mut data = borsh::to_vec(&AssignInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&args).unwrap();
        data.append(&mut args);

        solana_instruction::Instruction {
            program_id: crate::SYSTEM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct AssignInstructionData {
    discriminator: u32,
}

impl AssignInstructionData {
    pub fn new() -> Self {
        Self { discriminator: 1 }
    }
}

impl Default for AssignInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct AssignInstructionArgs {
    pub program_address: Pubkey,
}

/// Instruction builder for `Assign`.
///
/// ### Accounts:
///
///   0. `[writable, signer]` account
#[derive(Clone, Debug, Default)]
pub struct AssignBuilder {
    account: Option<solana_pubkey::Pubkey>,
    program_address: Option<Pubkey>,
    __remaining_accounts: Vec<solana_instruction::AccountMeta>,
}

impl AssignBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn account(&mut self, account: solana_pubkey::Pubkey) -> &mut Self {
        self.account = Some(account);
        self
    }
    #[inline(always)]
    pub fn program_address(&mut self, program_address: Pubkey) -> &mut Self {
        self.program_address = Some(program_address);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(&mut self, account: solana_instruction::AccountMeta) -> &mut Self {
        self.__remaining_accounts.push(account);
        self
    }
    /// Add additional accounts to the instruction.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[solana_instruction::AccountMeta],
    ) -> &mut Self {
        self.__remaining_accounts.extend_from_slice(accounts);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn instruction(&self) -> solana_instruction::Instruction {
        let accounts = Assign {
            account: self.account.expect("account is not set"),
        };
        let args = AssignInstructionArgs {
            program_address: self
                .program_address
                .clone()
                .expect("program_address is not set"),
        };

        accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
    }
}

/// `assign` CPI accounts.
pub struct AssignCpiAccounts<'a, 'b> {
    pub account: &'b solana_account_info::AccountInfo<'a>,
}

/// `assign` CPI instruction.
pub struct AssignCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_account_info::AccountInfo<'a>,

    pub account: &'b solana_account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: AssignInstructionArgs,
}

impl<'a, 'b> AssignCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_account_info::AccountInfo<'a>,
        accounts: AssignCpiAccounts<'a, 'b>,
        args: AssignInstructionArgs,
    ) -> Self {
        Self {
            __program: program,
            account: accounts.account,
            __args: args,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program_error::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(&'b solana_account_info::AccountInfo<'a>, bool, bool)],
    ) -> solana_program_error::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program_error::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(&'b solana_account_info::AccountInfo<'a>, bool, bool)],
    ) -> solana_program_error::ProgramResult {
        let mut accounts = Vec::with_capacity(1 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new(
            *self.account.key,
            true,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let mut data = borsh::to_vec(&AssignInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&self.__args).unwrap();
        data.append(&mut args);

        let instruction = solana_instruction::Instruction {
            program_id: crate::SYSTEM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(2 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.account.clone());
        remaining_accounts
            .iter()
            .for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

        if signers_seeds.is_empty() {
            solana_cpi::invoke(&instruction, &account_infos)
        } else {
            solana_cpi::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// Instruction builder for `Assign` via CPI.
///
/// ### Accounts:
///
///   0. `[writable, signer]` account
#[derive(Clone, Debug)]
pub struct AssignCpiBuilder<'a, 'b> {
    instruction: Box<AssignCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> AssignCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(AssignCpiBuilderInstruction {
            __program: program,
            account: None,
            program_address: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn account(&mut self, account: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.account = Some(account);
        self
    }
    #[inline(always)]
    pub fn program_address(&mut self, program_address: Pubkey) -> &mut Self {
        self.instruction.program_address = Some(program_address);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: &'b solana_account_info::AccountInfo<'a>,
        is_writable: bool,
        is_signer: bool,
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .push((account, is_writable, is_signer));
        self
    }
    /// Add additional accounts to the instruction.
    ///
    /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
    /// and a `bool` indicating whether the account is a signer or not.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[(&'b solana_account_info::AccountInfo<'a>, bool, bool)],
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .extend_from_slice(accounts);
        self
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program_error::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program_error::ProgramResult {
        let args = AssignInstructionArgs {
            program_address: self
                .instruction
                .program_address
                .clone()
                .expect("program_address is not set"),
        };
        let instruction = AssignCpi {
            __program: self.instruction.__program,

            account: self.instruction.account.expect("account is not set"),
            __args: args,
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct AssignCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_account_info::AccountInfo<'a>,
    account: Option<&'b solana_account_info::AccountInfo<'a>>,
    program_address: Option<Pubkey>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(&'b solana_account_info::AccountInfo<'a>, bool, bool)>,
}
