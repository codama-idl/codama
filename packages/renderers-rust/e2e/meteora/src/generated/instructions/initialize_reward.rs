//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_program::pubkey::Pubkey;

/// Accounts.
#[derive(Debug)]
pub struct InitializeReward {
    pub lb_pair: solana_program::pubkey::Pubkey,

    pub reward_vault: solana_program::pubkey::Pubkey,

    pub reward_mint: solana_program::pubkey::Pubkey,

    pub admin: solana_program::pubkey::Pubkey,

    pub token_program: solana_program::pubkey::Pubkey,

    pub system_program: solana_program::pubkey::Pubkey,

    pub rent: solana_program::pubkey::Pubkey,

    pub event_authority: solana_program::pubkey::Pubkey,

    pub program: solana_program::pubkey::Pubkey,
}

impl InitializeReward {
    pub fn instruction(
        &self,
        args: InitializeRewardInstructionArgs,
    ) -> solana_program::instruction::Instruction {
        self.instruction_with_remaining_accounts(args, &[])
    }
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        args: InitializeRewardInstructionArgs,
        remaining_accounts: &[solana_program::instruction::AccountMeta],
    ) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(9 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.lb_pair,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.reward_vault,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_mint,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.admin, true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.token_program,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.rent, false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.event_authority,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.program,
            false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let mut data = InitializeRewardInstructionData::new().try_to_vec().unwrap();
        let mut args = args.try_to_vec().unwrap();
        data.append(&mut args);

        solana_program::instruction::Instruction {
            program_id: crate::LB_CLMM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct InitializeRewardInstructionData {
    discriminator: [u8; 8],
}

impl InitializeRewardInstructionData {
    pub fn new() -> Self {
        Self {
            discriminator: [95, 135, 192, 196, 242, 129, 230, 68],
        }
    }
}

impl Default for InitializeRewardInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct InitializeRewardInstructionArgs {
    pub reward_index: u64,
    pub reward_duration: u64,
    pub funder: Pubkey,
}

/// Instruction builder for `InitializeReward`.
///
/// ### Accounts:
///
///   0. `[writable]` lb_pair
///   1. `[writable]` reward_vault
///   2. `[]` reward_mint
///   3. `[writable, signer]` admin
///   4. `[optional]` token_program (default to `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
///   5. `[optional]` system_program (default to `11111111111111111111111111111111`)
///   6. `[optional]` rent (default to `SysvarRent111111111111111111111111111111111`)
///   7. `[]` event_authority
///   8. `[]` program
#[derive(Clone, Debug, Default)]
pub struct InitializeRewardBuilder {
    lb_pair: Option<solana_program::pubkey::Pubkey>,
    reward_vault: Option<solana_program::pubkey::Pubkey>,
    reward_mint: Option<solana_program::pubkey::Pubkey>,
    admin: Option<solana_program::pubkey::Pubkey>,
    token_program: Option<solana_program::pubkey::Pubkey>,
    system_program: Option<solana_program::pubkey::Pubkey>,
    rent: Option<solana_program::pubkey::Pubkey>,
    event_authority: Option<solana_program::pubkey::Pubkey>,
    program: Option<solana_program::pubkey::Pubkey>,
    reward_index: Option<u64>,
    reward_duration: Option<u64>,
    funder: Option<Pubkey>,
    __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl InitializeRewardBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn lb_pair(&mut self, lb_pair: solana_program::pubkey::Pubkey) -> &mut Self {
        self.lb_pair = Some(lb_pair);
        self
    }
    #[inline(always)]
    pub fn reward_vault(&mut self, reward_vault: solana_program::pubkey::Pubkey) -> &mut Self {
        self.reward_vault = Some(reward_vault);
        self
    }
    #[inline(always)]
    pub fn reward_mint(&mut self, reward_mint: solana_program::pubkey::Pubkey) -> &mut Self {
        self.reward_mint = Some(reward_mint);
        self
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: solana_program::pubkey::Pubkey) -> &mut Self {
        self.admin = Some(admin);
        self
    }
    /// `[optional account, default to 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']`
    #[inline(always)]
    pub fn token_program(&mut self, token_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.token_program = Some(token_program);
        self
    }
    /// `[optional account, default to '11111111111111111111111111111111']`
    #[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.system_program = Some(system_program);
        self
    }
    /// `[optional account, default to 'SysvarRent111111111111111111111111111111111']`
    #[inline(always)]
    pub fn rent(&mut self, rent: solana_program::pubkey::Pubkey) -> &mut Self {
        self.rent = Some(rent);
        self
    }
    #[inline(always)]
    pub fn event_authority(
        &mut self,
        event_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.event_authority = Some(event_authority);
        self
    }
    #[inline(always)]
    pub fn program(&mut self, program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.program = Some(program);
        self
    }
    #[inline(always)]
    pub fn reward_index(&mut self, reward_index: u64) -> &mut Self {
        self.reward_index = Some(reward_index);
        self
    }
    #[inline(always)]
    pub fn reward_duration(&mut self, reward_duration: u64) -> &mut Self {
        self.reward_duration = Some(reward_duration);
        self
    }
    #[inline(always)]
    pub fn funder(&mut self, funder: Pubkey) -> &mut Self {
        self.funder = Some(funder);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: solana_program::instruction::AccountMeta,
    ) -> &mut Self {
        self.__remaining_accounts.push(account);
        self
    }
    /// Add additional accounts to the instruction.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[solana_program::instruction::AccountMeta],
    ) -> &mut Self {
        self.__remaining_accounts.extend_from_slice(accounts);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let accounts = InitializeReward {
            lb_pair: self.lb_pair.expect("lb_pair is not set"),
            reward_vault: self.reward_vault.expect("reward_vault is not set"),
            reward_mint: self.reward_mint.expect("reward_mint is not set"),
            admin: self.admin.expect("admin is not set"),
            token_program: self.token_program.unwrap_or(solana_program::pubkey!(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            )),
            system_program: self
                .system_program
                .unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
            rent: self.rent.unwrap_or(solana_program::pubkey!(
                "SysvarRent111111111111111111111111111111111"
            )),
            event_authority: self.event_authority.expect("event_authority is not set"),
            program: self.program.expect("program is not set"),
        };
        let args = InitializeRewardInstructionArgs {
            reward_index: self.reward_index.clone().expect("reward_index is not set"),
            reward_duration: self
                .reward_duration
                .clone()
                .expect("reward_duration is not set"),
            funder: self.funder.clone().expect("funder is not set"),
        };

        accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
    }
}

/// `initialize_reward` CPI accounts.
pub struct InitializeRewardCpiAccounts<'a, 'b> {
    pub lb_pair: &'b solana_program::account_info::AccountInfo<'a>,

    pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,

    pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,

    pub admin: &'b solana_program::account_info::AccountInfo<'a>,

    pub token_program: &'b solana_program::account_info::AccountInfo<'a>,

    pub system_program: &'b solana_program::account_info::AccountInfo<'a>,

    pub rent: &'b solana_program::account_info::AccountInfo<'a>,

    pub event_authority: &'b solana_program::account_info::AccountInfo<'a>,

    pub program: &'b solana_program::account_info::AccountInfo<'a>,
}

/// `initialize_reward` CPI instruction.
pub struct InitializeRewardCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_program::account_info::AccountInfo<'a>,

    pub lb_pair: &'b solana_program::account_info::AccountInfo<'a>,

    pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,

    pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,

    pub admin: &'b solana_program::account_info::AccountInfo<'a>,

    pub token_program: &'b solana_program::account_info::AccountInfo<'a>,

    pub system_program: &'b solana_program::account_info::AccountInfo<'a>,

    pub rent: &'b solana_program::account_info::AccountInfo<'a>,

    pub event_authority: &'b solana_program::account_info::AccountInfo<'a>,

    pub program: &'b solana_program::account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: InitializeRewardInstructionArgs,
}

impl<'a, 'b> InitializeRewardCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_program::account_info::AccountInfo<'a>,
        accounts: InitializeRewardCpiAccounts<'a, 'b>,
        args: InitializeRewardInstructionArgs,
    ) -> Self {
        Self {
            __program: program,
            lb_pair: accounts.lb_pair,
            reward_vault: accounts.reward_vault,
            reward_mint: accounts.reward_mint,
            admin: accounts.admin,
            token_program: accounts.token_program,
            system_program: accounts.system_program,
            rent: accounts.rent,
            event_authority: accounts.event_authority,
            program: accounts.program,
            __args: args,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(9 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.lb_pair.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.reward_vault.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_mint.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.admin.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.token_program.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.rent.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.event_authority.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.program.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_program::instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let mut data = InitializeRewardInstructionData::new().try_to_vec().unwrap();
        let mut args = self.__args.try_to_vec().unwrap();
        data.append(&mut args);

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::LB_CLMM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(10 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.lb_pair.clone());
        account_infos.push(self.reward_vault.clone());
        account_infos.push(self.reward_mint.clone());
        account_infos.push(self.admin.clone());
        account_infos.push(self.token_program.clone());
        account_infos.push(self.system_program.clone());
        account_infos.push(self.rent.clone());
        account_infos.push(self.event_authority.clone());
        account_infos.push(self.program.clone());
        remaining_accounts
            .iter()
            .for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// Instruction builder for `InitializeReward` via CPI.
///
/// ### Accounts:
///
///   0. `[writable]` lb_pair
///   1. `[writable]` reward_vault
///   2. `[]` reward_mint
///   3. `[writable, signer]` admin
///   4. `[]` token_program
///   5. `[]` system_program
///   6. `[]` rent
///   7. `[]` event_authority
///   8. `[]` program
#[derive(Clone, Debug)]
pub struct InitializeRewardCpiBuilder<'a, 'b> {
    instruction: Box<InitializeRewardCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> InitializeRewardCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(InitializeRewardCpiBuilderInstruction {
            __program: program,
            lb_pair: None,
            reward_vault: None,
            reward_mint: None,
            admin: None,
            token_program: None,
            system_program: None,
            rent: None,
            event_authority: None,
            program: None,
            reward_index: None,
            reward_duration: None,
            funder: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn lb_pair(
        &mut self,
        lb_pair: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.lb_pair = Some(lb_pair);
        self
    }
    #[inline(always)]
    pub fn reward_vault(
        &mut self,
        reward_vault: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.reward_vault = Some(reward_vault);
        self
    }
    #[inline(always)]
    pub fn reward_mint(
        &mut self,
        reward_mint: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.reward_mint = Some(reward_mint);
        self
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.admin = Some(admin);
        self
    }
    #[inline(always)]
    pub fn token_program(
        &mut self,
        token_program: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.token_program = Some(token_program);
        self
    }
    #[inline(always)]
    pub fn system_program(
        &mut self,
        system_program: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.system_program = Some(system_program);
        self
    }
    #[inline(always)]
    pub fn rent(&mut self, rent: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.rent = Some(rent);
        self
    }
    #[inline(always)]
    pub fn event_authority(
        &mut self,
        event_authority: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.event_authority = Some(event_authority);
        self
    }
    #[inline(always)]
    pub fn program(
        &mut self,
        program: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.program = Some(program);
        self
    }
    #[inline(always)]
    pub fn reward_index(&mut self, reward_index: u64) -> &mut Self {
        self.instruction.reward_index = Some(reward_index);
        self
    }
    #[inline(always)]
    pub fn reward_duration(&mut self, reward_duration: u64) -> &mut Self {
        self.instruction.reward_duration = Some(reward_duration);
        self
    }
    #[inline(always)]
    pub fn funder(&mut self, funder: Pubkey) -> &mut Self {
        self.instruction.funder = Some(funder);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: &'b solana_program::account_info::AccountInfo<'a>,
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
        accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .extend_from_slice(accounts);
        self
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = InitializeRewardInstructionArgs {
            reward_index: self
                .instruction
                .reward_index
                .clone()
                .expect("reward_index is not set"),
            reward_duration: self
                .instruction
                .reward_duration
                .clone()
                .expect("reward_duration is not set"),
            funder: self.instruction.funder.clone().expect("funder is not set"),
        };
        let instruction = InitializeRewardCpi {
            __program: self.instruction.__program,

            lb_pair: self.instruction.lb_pair.expect("lb_pair is not set"),

            reward_vault: self
                .instruction
                .reward_vault
                .expect("reward_vault is not set"),

            reward_mint: self
                .instruction
                .reward_mint
                .expect("reward_mint is not set"),

            admin: self.instruction.admin.expect("admin is not set"),

            token_program: self
                .instruction
                .token_program
                .expect("token_program is not set"),

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            rent: self.instruction.rent.expect("rent is not set"),

            event_authority: self
                .instruction
                .event_authority
                .expect("event_authority is not set"),

            program: self.instruction.program.expect("program is not set"),
            __args: args,
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct InitializeRewardCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_program::account_info::AccountInfo<'a>,
    lb_pair: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    reward_vault: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    reward_mint: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    admin: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    system_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    rent: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    event_authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    reward_index: Option<u64>,
    reward_duration: Option<u64>,
    funder: Option<Pubkey>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(
        &'b solana_program::account_info::AccountInfo<'a>,
        bool,
        bool,
    )>,
}