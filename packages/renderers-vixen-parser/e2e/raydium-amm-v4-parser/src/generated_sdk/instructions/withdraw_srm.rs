//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

pub const WITHDRAW_SRM_DISCRIMINATOR: [u8; 1] = [8];

/// Accounts.
#[derive(Debug)]
pub struct WithdrawSrm {
    pub token_program: solana_pubkey::Pubkey,

    pub amm: solana_pubkey::Pubkey,

    pub amm_owner_account: solana_pubkey::Pubkey,

    pub amm_authority: solana_pubkey::Pubkey,

    pub srm_token: solana_pubkey::Pubkey,

    pub dest_srm_token: solana_pubkey::Pubkey,
}

impl WithdrawSrm {
    pub fn instruction(&self, args: WithdrawSrmInstructionArgs) -> solana_instruction::Instruction {
        self.instruction_with_remaining_accounts(args, &[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        args: WithdrawSrmInstructionArgs,
        remaining_accounts: &[solana_instruction::AccountMeta],
    ) -> solana_instruction::Instruction {
        let mut accounts = Vec::with_capacity(6 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.token_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.amm, false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.amm_owner_account,
            true,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.amm_authority,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(self.srm_token, false));
        accounts.push(solana_instruction::AccountMeta::new(
            self.dest_srm_token,
            false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let mut data = borsh::to_vec(&WithdrawSrmInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&args).unwrap();
        data.append(&mut args);

        solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WithdrawSrmInstructionData {
    discriminator: [u8; 1],
}

impl WithdrawSrmInstructionData {
    pub fn new() -> Self {
        Self { discriminator: [8] }
    }
}

impl Default for WithdrawSrmInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WithdrawSrmInstructionArgs {
    pub amount: u64,
}

/// Instruction builder for `WithdrawSrm`.
///
/// ### Accounts:
///
///   0. `[optional]` token_program (default to `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
///   1. `[]` amm
///   2. `[signer]` amm_owner_account
///   3. `[]` amm_authority
///   4. `[writable]` srm_token
///   5. `[writable]` dest_srm_token
#[derive(Clone, Debug, Default)]
pub struct WithdrawSrmBuilder {
    token_program: Option<solana_pubkey::Pubkey>,
    amm: Option<solana_pubkey::Pubkey>,
    amm_owner_account: Option<solana_pubkey::Pubkey>,
    amm_authority: Option<solana_pubkey::Pubkey>,
    srm_token: Option<solana_pubkey::Pubkey>,
    dest_srm_token: Option<solana_pubkey::Pubkey>,
    amount: Option<u64>,
    __remaining_accounts: Vec<solana_instruction::AccountMeta>,
}

impl WithdrawSrmBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    /// `[optional account, default to 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']`
    #[inline(always)]
    pub fn token_program(&mut self, token_program: solana_pubkey::Pubkey) -> &mut Self {
        self.token_program = Some(token_program);
        self
    }
    #[inline(always)]
    pub fn amm(&mut self, amm: solana_pubkey::Pubkey) -> &mut Self {
        self.amm = Some(amm);
        self
    }
    #[inline(always)]
    pub fn amm_owner_account(&mut self, amm_owner_account: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_owner_account = Some(amm_owner_account);
        self
    }
    #[inline(always)]
    pub fn amm_authority(&mut self, amm_authority: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_authority = Some(amm_authority);
        self
    }
    #[inline(always)]
    pub fn srm_token(&mut self, srm_token: solana_pubkey::Pubkey) -> &mut Self {
        self.srm_token = Some(srm_token);
        self
    }
    #[inline(always)]
    pub fn dest_srm_token(&mut self, dest_srm_token: solana_pubkey::Pubkey) -> &mut Self {
        self.dest_srm_token = Some(dest_srm_token);
        self
    }
    #[inline(always)]
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.amount = Some(amount);
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
        let accounts = WithdrawSrm {
            token_program: self.token_program.unwrap_or(solana_pubkey::pubkey!(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            )),
            amm: self.amm.expect("amm is not set"),
            amm_owner_account: self
                .amm_owner_account
                .expect("amm_owner_account is not set"),
            amm_authority: self.amm_authority.expect("amm_authority is not set"),
            srm_token: self.srm_token.expect("srm_token is not set"),
            dest_srm_token: self.dest_srm_token.expect("dest_srm_token is not set"),
        };
        let args = WithdrawSrmInstructionArgs {
            amount: self.amount.clone().expect("amount is not set"),
        };

        accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
    }
}

/// `withdraw_srm` CPI accounts.
pub struct WithdrawSrmCpiAccounts<'a, 'b> {
    pub token_program: &'b solana_account_info::AccountInfo<'a>,

    pub amm: &'b solana_account_info::AccountInfo<'a>,

    pub amm_owner_account: &'b solana_account_info::AccountInfo<'a>,

    pub amm_authority: &'b solana_account_info::AccountInfo<'a>,

    pub srm_token: &'b solana_account_info::AccountInfo<'a>,

    pub dest_srm_token: &'b solana_account_info::AccountInfo<'a>,
}

/// `withdraw_srm` CPI instruction.
pub struct WithdrawSrmCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_account_info::AccountInfo<'a>,

    pub token_program: &'b solana_account_info::AccountInfo<'a>,

    pub amm: &'b solana_account_info::AccountInfo<'a>,

    pub amm_owner_account: &'b solana_account_info::AccountInfo<'a>,

    pub amm_authority: &'b solana_account_info::AccountInfo<'a>,

    pub srm_token: &'b solana_account_info::AccountInfo<'a>,

    pub dest_srm_token: &'b solana_account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: WithdrawSrmInstructionArgs,
}

impl<'a, 'b> WithdrawSrmCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_account_info::AccountInfo<'a>,
        accounts: WithdrawSrmCpiAccounts<'a, 'b>,
        args: WithdrawSrmInstructionArgs,
    ) -> Self {
        Self {
            __program: program,
            token_program: accounts.token_program,
            amm: accounts.amm,
            amm_owner_account: accounts.amm_owner_account,
            amm_authority: accounts.amm_authority,
            srm_token: accounts.srm_token,
            dest_srm_token: accounts.dest_srm_token,
            __args: args,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program_entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(&'b solana_account_info::AccountInfo<'a>, bool, bool)],
    ) -> solana_program_entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program_entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(&'b solana_account_info::AccountInfo<'a>, bool, bool)],
    ) -> solana_program_entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(6 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.token_program.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.amm.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.amm_owner_account.key,
            true,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.amm_authority.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.srm_token.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.dest_srm_token.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let mut data = borsh::to_vec(&WithdrawSrmInstructionData::new()).unwrap();
        let mut args = borsh::to_vec(&self.__args).unwrap();
        data.append(&mut args);

        let instruction = solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(7 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.token_program.clone());
        account_infos.push(self.amm.clone());
        account_infos.push(self.amm_owner_account.clone());
        account_infos.push(self.amm_authority.clone());
        account_infos.push(self.srm_token.clone());
        account_infos.push(self.dest_srm_token.clone());
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

/// Instruction builder for `WithdrawSrm` via CPI.
///
/// ### Accounts:
///
///   0. `[]` token_program
///   1. `[]` amm
///   2. `[signer]` amm_owner_account
///   3. `[]` amm_authority
///   4. `[writable]` srm_token
///   5. `[writable]` dest_srm_token
#[derive(Clone, Debug)]
pub struct WithdrawSrmCpiBuilder<'a, 'b> {
    instruction: Box<WithdrawSrmCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> WithdrawSrmCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(WithdrawSrmCpiBuilderInstruction {
            __program: program,
            token_program: None,
            amm: None,
            amm_owner_account: None,
            amm_authority: None,
            srm_token: None,
            dest_srm_token: None,
            amount: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn token_program(
        &mut self,
        token_program: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.token_program = Some(token_program);
        self
    }
    #[inline(always)]
    pub fn amm(&mut self, amm: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.amm = Some(amm);
        self
    }
    #[inline(always)]
    pub fn amm_owner_account(
        &mut self,
        amm_owner_account: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_owner_account = Some(amm_owner_account);
        self
    }
    #[inline(always)]
    pub fn amm_authority(
        &mut self,
        amm_authority: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_authority = Some(amm_authority);
        self
    }
    #[inline(always)]
    pub fn srm_token(&mut self, srm_token: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.srm_token = Some(srm_token);
        self
    }
    #[inline(always)]
    pub fn dest_srm_token(
        &mut self,
        dest_srm_token: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.dest_srm_token = Some(dest_srm_token);
        self
    }
    #[inline(always)]
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.instruction.amount = Some(amount);
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
    pub fn invoke(&self) -> solana_program_entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program_entrypoint::ProgramResult {
        let args = WithdrawSrmInstructionArgs {
            amount: self.instruction.amount.clone().expect("amount is not set"),
        };
        let instruction = WithdrawSrmCpi {
            __program: self.instruction.__program,

            token_program: self
                .instruction
                .token_program
                .expect("token_program is not set"),

            amm: self.instruction.amm.expect("amm is not set"),

            amm_owner_account: self
                .instruction
                .amm_owner_account
                .expect("amm_owner_account is not set"),

            amm_authority: self
                .instruction
                .amm_authority
                .expect("amm_authority is not set"),

            srm_token: self.instruction.srm_token.expect("srm_token is not set"),

            dest_srm_token: self
                .instruction
                .dest_srm_token
                .expect("dest_srm_token is not set"),
            __args: args,
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct WithdrawSrmCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_account_info::AccountInfo<'a>,
    token_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_owner_account: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_authority: Option<&'b solana_account_info::AccountInfo<'a>>,
    srm_token: Option<&'b solana_account_info::AccountInfo<'a>>,
    dest_srm_token: Option<&'b solana_account_info::AccountInfo<'a>>,
    amount: Option<u64>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(&'b solana_account_info::AccountInfo<'a>, bool, bool)>,
}
