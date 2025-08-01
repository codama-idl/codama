//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

pub const CREATE_CONFIG_ACCOUNT_DISCRIMINATOR: [u8; 1] = [14];

/// Accounts.
#[derive(Debug)]
pub struct CreateConfigAccount {
    pub admin: solana_pubkey::Pubkey,

    pub amm_config: solana_pubkey::Pubkey,

    pub owner: solana_pubkey::Pubkey,

    pub system_program: solana_pubkey::Pubkey,

    pub rent: solana_pubkey::Pubkey,
}

impl CreateConfigAccount {
    pub fn instruction(&self) -> solana_instruction::Instruction {
        self.instruction_with_remaining_accounts(&[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        remaining_accounts: &[solana_instruction::AccountMeta],
    ) -> solana_instruction::Instruction {
        let mut accounts = Vec::with_capacity(5 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new(self.admin, true));
        accounts.push(solana_instruction::AccountMeta::new(self.amm_config, false));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.owner, false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.rent, false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let data = borsh::to_vec(&CreateConfigAccountInstructionData::new()).unwrap();

        solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct CreateConfigAccountInstructionData {
    discriminator: [u8; 1],
}

impl CreateConfigAccountInstructionData {
    pub fn new() -> Self {
        Self {
            discriminator: [14],
        }
    }
}

impl Default for CreateConfigAccountInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

/// Instruction builder for `CreateConfigAccount`.
///
/// ### Accounts:
///
///   0. `[writable, signer]` admin
///   1. `[writable]` amm_config
///   2. `[]` owner
///   3. `[optional]` system_program (default to `11111111111111111111111111111111`)
///   4. `[optional]` rent (default to `SysvarRent111111111111111111111111111111111`)
#[derive(Clone, Debug, Default)]
pub struct CreateConfigAccountBuilder {
    admin: Option<solana_pubkey::Pubkey>,
    amm_config: Option<solana_pubkey::Pubkey>,
    owner: Option<solana_pubkey::Pubkey>,
    system_program: Option<solana_pubkey::Pubkey>,
    rent: Option<solana_pubkey::Pubkey>,
    __remaining_accounts: Vec<solana_instruction::AccountMeta>,
}

impl CreateConfigAccountBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: solana_pubkey::Pubkey) -> &mut Self {
        self.admin = Some(admin);
        self
    }
    #[inline(always)]
    pub fn amm_config(&mut self, amm_config: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_config = Some(amm_config);
        self
    }
    #[inline(always)]
    pub fn owner(&mut self, owner: solana_pubkey::Pubkey) -> &mut Self {
        self.owner = Some(owner);
        self
    }
    /// `[optional account, default to '11111111111111111111111111111111']`
    #[inline(always)]
    pub fn system_program(&mut self, system_program: solana_pubkey::Pubkey) -> &mut Self {
        self.system_program = Some(system_program);
        self
    }
    /// `[optional account, default to 'SysvarRent111111111111111111111111111111111']`
    #[inline(always)]
    pub fn rent(&mut self, rent: solana_pubkey::Pubkey) -> &mut Self {
        self.rent = Some(rent);
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
        let accounts = CreateConfigAccount {
            admin: self.admin.expect("admin is not set"),
            amm_config: self.amm_config.expect("amm_config is not set"),
            owner: self.owner.expect("owner is not set"),
            system_program: self
                .system_program
                .unwrap_or(solana_pubkey::pubkey!("11111111111111111111111111111111")),
            rent: self.rent.unwrap_or(solana_pubkey::pubkey!(
                "SysvarRent111111111111111111111111111111111"
            )),
        };

        accounts.instruction_with_remaining_accounts(&self.__remaining_accounts)
    }
}

/// `create_config_account` CPI accounts.
pub struct CreateConfigAccountCpiAccounts<'a, 'b> {
    pub admin: &'b solana_account_info::AccountInfo<'a>,

    pub amm_config: &'b solana_account_info::AccountInfo<'a>,

    pub owner: &'b solana_account_info::AccountInfo<'a>,

    pub system_program: &'b solana_account_info::AccountInfo<'a>,

    pub rent: &'b solana_account_info::AccountInfo<'a>,
}

/// `create_config_account` CPI instruction.
pub struct CreateConfigAccountCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_account_info::AccountInfo<'a>,

    pub admin: &'b solana_account_info::AccountInfo<'a>,

    pub amm_config: &'b solana_account_info::AccountInfo<'a>,

    pub owner: &'b solana_account_info::AccountInfo<'a>,

    pub system_program: &'b solana_account_info::AccountInfo<'a>,

    pub rent: &'b solana_account_info::AccountInfo<'a>,
}

impl<'a, 'b> CreateConfigAccountCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_account_info::AccountInfo<'a>,
        accounts: CreateConfigAccountCpiAccounts<'a, 'b>,
    ) -> Self {
        Self {
            __program: program,
            admin: accounts.admin,
            amm_config: accounts.amm_config,
            owner: accounts.owner,
            system_program: accounts.system_program,
            rent: accounts.rent,
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
        let mut accounts = Vec::with_capacity(5 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new(*self.admin.key, true));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.amm_config.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.owner.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.rent.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let data = borsh::to_vec(&CreateConfigAccountInstructionData::new()).unwrap();

        let instruction = solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(6 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.admin.clone());
        account_infos.push(self.amm_config.clone());
        account_infos.push(self.owner.clone());
        account_infos.push(self.system_program.clone());
        account_infos.push(self.rent.clone());
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

/// Instruction builder for `CreateConfigAccount` via CPI.
///
/// ### Accounts:
///
///   0. `[writable, signer]` admin
///   1. `[writable]` amm_config
///   2. `[]` owner
///   3. `[]` system_program
///   4. `[]` rent
#[derive(Clone, Debug)]
pub struct CreateConfigAccountCpiBuilder<'a, 'b> {
    instruction: Box<CreateConfigAccountCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> CreateConfigAccountCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(CreateConfigAccountCpiBuilderInstruction {
            __program: program,
            admin: None,
            amm_config: None,
            owner: None,
            system_program: None,
            rent: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.admin = Some(admin);
        self
    }
    #[inline(always)]
    pub fn amm_config(
        &mut self,
        amm_config: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_config = Some(amm_config);
        self
    }
    #[inline(always)]
    pub fn owner(&mut self, owner: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.owner = Some(owner);
        self
    }
    #[inline(always)]
    pub fn system_program(
        &mut self,
        system_program: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.system_program = Some(system_program);
        self
    }
    #[inline(always)]
    pub fn rent(&mut self, rent: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.rent = Some(rent);
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
        let instruction = CreateConfigAccountCpi {
            __program: self.instruction.__program,

            admin: self.instruction.admin.expect("admin is not set"),

            amm_config: self.instruction.amm_config.expect("amm_config is not set"),

            owner: self.instruction.owner.expect("owner is not set"),

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            rent: self.instruction.rent.expect("rent is not set"),
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct CreateConfigAccountCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_account_info::AccountInfo<'a>,
    admin: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_config: Option<&'b solana_account_info::AccountInfo<'a>>,
    owner: Option<&'b solana_account_info::AccountInfo<'a>>,
    system_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    rent: Option<&'b solana_account_info::AccountInfo<'a>>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(&'b solana_account_info::AccountInfo<'a>, bool, bool)>,
}
