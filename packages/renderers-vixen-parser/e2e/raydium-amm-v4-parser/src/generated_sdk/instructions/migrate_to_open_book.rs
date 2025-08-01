//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

pub const MIGRATE_TO_OPEN_BOOK_DISCRIMINATOR: [u8; 1] = [5];

/// Accounts.
#[derive(Debug)]
pub struct MigrateToOpenBook {
    pub token_program: solana_pubkey::Pubkey,

    pub system_program: solana_pubkey::Pubkey,

    pub rent: solana_pubkey::Pubkey,

    pub amm: solana_pubkey::Pubkey,

    pub amm_authority: solana_pubkey::Pubkey,

    pub amm_open_orders: solana_pubkey::Pubkey,

    pub amm_token_coin: solana_pubkey::Pubkey,

    pub amm_token_pc: solana_pubkey::Pubkey,

    pub amm_target_orders: solana_pubkey::Pubkey,

    pub serum_program: solana_pubkey::Pubkey,

    pub serum_market: solana_pubkey::Pubkey,

    pub serum_bids: solana_pubkey::Pubkey,

    pub serum_asks: solana_pubkey::Pubkey,

    pub serum_event_queue: solana_pubkey::Pubkey,

    pub serum_coin_vault: solana_pubkey::Pubkey,

    pub serum_pc_vault: solana_pubkey::Pubkey,

    pub serum_vault_signer: solana_pubkey::Pubkey,

    pub new_amm_open_orders: solana_pubkey::Pubkey,

    pub new_serum_program: solana_pubkey::Pubkey,

    pub new_serum_market: solana_pubkey::Pubkey,

    pub admin: solana_pubkey::Pubkey,
}

impl MigrateToOpenBook {
    pub fn instruction(&self) -> solana_instruction::Instruction {
        self.instruction_with_remaining_accounts(&[])
    }
    #[allow(clippy::arithmetic_side_effects)]
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        remaining_accounts: &[solana_instruction::AccountMeta],
    ) -> solana_instruction::Instruction {
        let mut accounts = Vec::with_capacity(21 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.token_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.rent, false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(self.amm, false));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.amm_authority,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.amm_open_orders,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.amm_token_coin,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.amm_token_pc,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.amm_target_orders,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.serum_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.serum_market,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(self.serum_bids, false));
        accounts.push(solana_instruction::AccountMeta::new(self.serum_asks, false));
        accounts.push(solana_instruction::AccountMeta::new(
            self.serum_event_queue,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.serum_coin_vault,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.serum_pc_vault,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.serum_vault_signer,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            self.new_amm_open_orders,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.new_serum_program,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            self.new_serum_market,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(self.admin, true));
        accounts.extend_from_slice(remaining_accounts);
        let data = borsh::to_vec(&MigrateToOpenBookInstructionData::new()).unwrap();

        solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct MigrateToOpenBookInstructionData {
    discriminator: [u8; 1],
}

impl MigrateToOpenBookInstructionData {
    pub fn new() -> Self {
        Self { discriminator: [5] }
    }
}

impl Default for MigrateToOpenBookInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

/// Instruction builder for `MigrateToOpenBook`.
///
/// ### Accounts:
///
///   0. `[optional]` token_program (default to `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
///   1. `[optional]` system_program (default to `11111111111111111111111111111111`)
///   2. `[optional]` rent (default to `SysvarRent111111111111111111111111111111111`)
///   3. `[writable]` amm
///   4. `[]` amm_authority
///   5. `[writable]` amm_open_orders
///   6. `[writable]` amm_token_coin
///   7. `[writable]` amm_token_pc
///   8. `[writable]` amm_target_orders
///   9. `[]` serum_program
///   10. `[writable]` serum_market
///   11. `[writable]` serum_bids
///   12. `[writable]` serum_asks
///   13. `[writable]` serum_event_queue
///   14. `[writable]` serum_coin_vault
///   15. `[writable]` serum_pc_vault
///   16. `[]` serum_vault_signer
///   17. `[writable]` new_amm_open_orders
///   18. `[]` new_serum_program
///   19. `[]` new_serum_market
///   20. `[writable, signer]` admin
#[derive(Clone, Debug, Default)]
pub struct MigrateToOpenBookBuilder {
    token_program: Option<solana_pubkey::Pubkey>,
    system_program: Option<solana_pubkey::Pubkey>,
    rent: Option<solana_pubkey::Pubkey>,
    amm: Option<solana_pubkey::Pubkey>,
    amm_authority: Option<solana_pubkey::Pubkey>,
    amm_open_orders: Option<solana_pubkey::Pubkey>,
    amm_token_coin: Option<solana_pubkey::Pubkey>,
    amm_token_pc: Option<solana_pubkey::Pubkey>,
    amm_target_orders: Option<solana_pubkey::Pubkey>,
    serum_program: Option<solana_pubkey::Pubkey>,
    serum_market: Option<solana_pubkey::Pubkey>,
    serum_bids: Option<solana_pubkey::Pubkey>,
    serum_asks: Option<solana_pubkey::Pubkey>,
    serum_event_queue: Option<solana_pubkey::Pubkey>,
    serum_coin_vault: Option<solana_pubkey::Pubkey>,
    serum_pc_vault: Option<solana_pubkey::Pubkey>,
    serum_vault_signer: Option<solana_pubkey::Pubkey>,
    new_amm_open_orders: Option<solana_pubkey::Pubkey>,
    new_serum_program: Option<solana_pubkey::Pubkey>,
    new_serum_market: Option<solana_pubkey::Pubkey>,
    admin: Option<solana_pubkey::Pubkey>,
    __remaining_accounts: Vec<solana_instruction::AccountMeta>,
}

impl MigrateToOpenBookBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    /// `[optional account, default to 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']`
    #[inline(always)]
    pub fn token_program(&mut self, token_program: solana_pubkey::Pubkey) -> &mut Self {
        self.token_program = Some(token_program);
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
    #[inline(always)]
    pub fn amm(&mut self, amm: solana_pubkey::Pubkey) -> &mut Self {
        self.amm = Some(amm);
        self
    }
    #[inline(always)]
    pub fn amm_authority(&mut self, amm_authority: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_authority = Some(amm_authority);
        self
    }
    #[inline(always)]
    pub fn amm_open_orders(&mut self, amm_open_orders: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_open_orders = Some(amm_open_orders);
        self
    }
    #[inline(always)]
    pub fn amm_token_coin(&mut self, amm_token_coin: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_token_coin = Some(amm_token_coin);
        self
    }
    #[inline(always)]
    pub fn amm_token_pc(&mut self, amm_token_pc: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_token_pc = Some(amm_token_pc);
        self
    }
    #[inline(always)]
    pub fn amm_target_orders(&mut self, amm_target_orders: solana_pubkey::Pubkey) -> &mut Self {
        self.amm_target_orders = Some(amm_target_orders);
        self
    }
    #[inline(always)]
    pub fn serum_program(&mut self, serum_program: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_program = Some(serum_program);
        self
    }
    #[inline(always)]
    pub fn serum_market(&mut self, serum_market: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_market = Some(serum_market);
        self
    }
    #[inline(always)]
    pub fn serum_bids(&mut self, serum_bids: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_bids = Some(serum_bids);
        self
    }
    #[inline(always)]
    pub fn serum_asks(&mut self, serum_asks: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_asks = Some(serum_asks);
        self
    }
    #[inline(always)]
    pub fn serum_event_queue(&mut self, serum_event_queue: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_event_queue = Some(serum_event_queue);
        self
    }
    #[inline(always)]
    pub fn serum_coin_vault(&mut self, serum_coin_vault: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_coin_vault = Some(serum_coin_vault);
        self
    }
    #[inline(always)]
    pub fn serum_pc_vault(&mut self, serum_pc_vault: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_pc_vault = Some(serum_pc_vault);
        self
    }
    #[inline(always)]
    pub fn serum_vault_signer(&mut self, serum_vault_signer: solana_pubkey::Pubkey) -> &mut Self {
        self.serum_vault_signer = Some(serum_vault_signer);
        self
    }
    #[inline(always)]
    pub fn new_amm_open_orders(&mut self, new_amm_open_orders: solana_pubkey::Pubkey) -> &mut Self {
        self.new_amm_open_orders = Some(new_amm_open_orders);
        self
    }
    #[inline(always)]
    pub fn new_serum_program(&mut self, new_serum_program: solana_pubkey::Pubkey) -> &mut Self {
        self.new_serum_program = Some(new_serum_program);
        self
    }
    #[inline(always)]
    pub fn new_serum_market(&mut self, new_serum_market: solana_pubkey::Pubkey) -> &mut Self {
        self.new_serum_market = Some(new_serum_market);
        self
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: solana_pubkey::Pubkey) -> &mut Self {
        self.admin = Some(admin);
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
        let accounts = MigrateToOpenBook {
            token_program: self.token_program.unwrap_or(solana_pubkey::pubkey!(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            )),
            system_program: self
                .system_program
                .unwrap_or(solana_pubkey::pubkey!("11111111111111111111111111111111")),
            rent: self.rent.unwrap_or(solana_pubkey::pubkey!(
                "SysvarRent111111111111111111111111111111111"
            )),
            amm: self.amm.expect("amm is not set"),
            amm_authority: self.amm_authority.expect("amm_authority is not set"),
            amm_open_orders: self.amm_open_orders.expect("amm_open_orders is not set"),
            amm_token_coin: self.amm_token_coin.expect("amm_token_coin is not set"),
            amm_token_pc: self.amm_token_pc.expect("amm_token_pc is not set"),
            amm_target_orders: self
                .amm_target_orders
                .expect("amm_target_orders is not set"),
            serum_program: self.serum_program.expect("serum_program is not set"),
            serum_market: self.serum_market.expect("serum_market is not set"),
            serum_bids: self.serum_bids.expect("serum_bids is not set"),
            serum_asks: self.serum_asks.expect("serum_asks is not set"),
            serum_event_queue: self
                .serum_event_queue
                .expect("serum_event_queue is not set"),
            serum_coin_vault: self.serum_coin_vault.expect("serum_coin_vault is not set"),
            serum_pc_vault: self.serum_pc_vault.expect("serum_pc_vault is not set"),
            serum_vault_signer: self
                .serum_vault_signer
                .expect("serum_vault_signer is not set"),
            new_amm_open_orders: self
                .new_amm_open_orders
                .expect("new_amm_open_orders is not set"),
            new_serum_program: self
                .new_serum_program
                .expect("new_serum_program is not set"),
            new_serum_market: self.new_serum_market.expect("new_serum_market is not set"),
            admin: self.admin.expect("admin is not set"),
        };

        accounts.instruction_with_remaining_accounts(&self.__remaining_accounts)
    }
}

/// `migrate_to_open_book` CPI accounts.
pub struct MigrateToOpenBookCpiAccounts<'a, 'b> {
    pub token_program: &'b solana_account_info::AccountInfo<'a>,

    pub system_program: &'b solana_account_info::AccountInfo<'a>,

    pub rent: &'b solana_account_info::AccountInfo<'a>,

    pub amm: &'b solana_account_info::AccountInfo<'a>,

    pub amm_authority: &'b solana_account_info::AccountInfo<'a>,

    pub amm_open_orders: &'b solana_account_info::AccountInfo<'a>,

    pub amm_token_coin: &'b solana_account_info::AccountInfo<'a>,

    pub amm_token_pc: &'b solana_account_info::AccountInfo<'a>,

    pub amm_target_orders: &'b solana_account_info::AccountInfo<'a>,

    pub serum_program: &'b solana_account_info::AccountInfo<'a>,

    pub serum_market: &'b solana_account_info::AccountInfo<'a>,

    pub serum_bids: &'b solana_account_info::AccountInfo<'a>,

    pub serum_asks: &'b solana_account_info::AccountInfo<'a>,

    pub serum_event_queue: &'b solana_account_info::AccountInfo<'a>,

    pub serum_coin_vault: &'b solana_account_info::AccountInfo<'a>,

    pub serum_pc_vault: &'b solana_account_info::AccountInfo<'a>,

    pub serum_vault_signer: &'b solana_account_info::AccountInfo<'a>,

    pub new_amm_open_orders: &'b solana_account_info::AccountInfo<'a>,

    pub new_serum_program: &'b solana_account_info::AccountInfo<'a>,

    pub new_serum_market: &'b solana_account_info::AccountInfo<'a>,

    pub admin: &'b solana_account_info::AccountInfo<'a>,
}

/// `migrate_to_open_book` CPI instruction.
pub struct MigrateToOpenBookCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_account_info::AccountInfo<'a>,

    pub token_program: &'b solana_account_info::AccountInfo<'a>,

    pub system_program: &'b solana_account_info::AccountInfo<'a>,

    pub rent: &'b solana_account_info::AccountInfo<'a>,

    pub amm: &'b solana_account_info::AccountInfo<'a>,

    pub amm_authority: &'b solana_account_info::AccountInfo<'a>,

    pub amm_open_orders: &'b solana_account_info::AccountInfo<'a>,

    pub amm_token_coin: &'b solana_account_info::AccountInfo<'a>,

    pub amm_token_pc: &'b solana_account_info::AccountInfo<'a>,

    pub amm_target_orders: &'b solana_account_info::AccountInfo<'a>,

    pub serum_program: &'b solana_account_info::AccountInfo<'a>,

    pub serum_market: &'b solana_account_info::AccountInfo<'a>,

    pub serum_bids: &'b solana_account_info::AccountInfo<'a>,

    pub serum_asks: &'b solana_account_info::AccountInfo<'a>,

    pub serum_event_queue: &'b solana_account_info::AccountInfo<'a>,

    pub serum_coin_vault: &'b solana_account_info::AccountInfo<'a>,

    pub serum_pc_vault: &'b solana_account_info::AccountInfo<'a>,

    pub serum_vault_signer: &'b solana_account_info::AccountInfo<'a>,

    pub new_amm_open_orders: &'b solana_account_info::AccountInfo<'a>,

    pub new_serum_program: &'b solana_account_info::AccountInfo<'a>,

    pub new_serum_market: &'b solana_account_info::AccountInfo<'a>,

    pub admin: &'b solana_account_info::AccountInfo<'a>,
}

impl<'a, 'b> MigrateToOpenBookCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_account_info::AccountInfo<'a>,
        accounts: MigrateToOpenBookCpiAccounts<'a, 'b>,
    ) -> Self {
        Self {
            __program: program,
            token_program: accounts.token_program,
            system_program: accounts.system_program,
            rent: accounts.rent,
            amm: accounts.amm,
            amm_authority: accounts.amm_authority,
            amm_open_orders: accounts.amm_open_orders,
            amm_token_coin: accounts.amm_token_coin,
            amm_token_pc: accounts.amm_token_pc,
            amm_target_orders: accounts.amm_target_orders,
            serum_program: accounts.serum_program,
            serum_market: accounts.serum_market,
            serum_bids: accounts.serum_bids,
            serum_asks: accounts.serum_asks,
            serum_event_queue: accounts.serum_event_queue,
            serum_coin_vault: accounts.serum_coin_vault,
            serum_pc_vault: accounts.serum_pc_vault,
            serum_vault_signer: accounts.serum_vault_signer,
            new_amm_open_orders: accounts.new_amm_open_orders,
            new_serum_program: accounts.new_serum_program,
            new_serum_market: accounts.new_serum_market,
            admin: accounts.admin,
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
        let mut accounts = Vec::with_capacity(21 + remaining_accounts.len());
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.token_program.key,
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
        accounts.push(solana_instruction::AccountMeta::new(*self.amm.key, false));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.amm_authority.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.amm_open_orders.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.amm_token_coin.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.amm_token_pc.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.amm_target_orders.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.serum_program.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_market.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_bids.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_asks.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_event_queue.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_coin_vault.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.serum_pc_vault.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.serum_vault_signer.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(
            *self.new_amm_open_orders.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.new_serum_program.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new_readonly(
            *self.new_serum_market.key,
            false,
        ));
        accounts.push(solana_instruction::AccountMeta::new(*self.admin.key, true));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let data = borsh::to_vec(&MigrateToOpenBookInstructionData::new()).unwrap();

        let instruction = solana_instruction::Instruction {
            program_id: crate::RAYDIUM_AMM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(22 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.token_program.clone());
        account_infos.push(self.system_program.clone());
        account_infos.push(self.rent.clone());
        account_infos.push(self.amm.clone());
        account_infos.push(self.amm_authority.clone());
        account_infos.push(self.amm_open_orders.clone());
        account_infos.push(self.amm_token_coin.clone());
        account_infos.push(self.amm_token_pc.clone());
        account_infos.push(self.amm_target_orders.clone());
        account_infos.push(self.serum_program.clone());
        account_infos.push(self.serum_market.clone());
        account_infos.push(self.serum_bids.clone());
        account_infos.push(self.serum_asks.clone());
        account_infos.push(self.serum_event_queue.clone());
        account_infos.push(self.serum_coin_vault.clone());
        account_infos.push(self.serum_pc_vault.clone());
        account_infos.push(self.serum_vault_signer.clone());
        account_infos.push(self.new_amm_open_orders.clone());
        account_infos.push(self.new_serum_program.clone());
        account_infos.push(self.new_serum_market.clone());
        account_infos.push(self.admin.clone());
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

/// Instruction builder for `MigrateToOpenBook` via CPI.
///
/// ### Accounts:
///
///   0. `[]` token_program
///   1. `[]` system_program
///   2. `[]` rent
///   3. `[writable]` amm
///   4. `[]` amm_authority
///   5. `[writable]` amm_open_orders
///   6. `[writable]` amm_token_coin
///   7. `[writable]` amm_token_pc
///   8. `[writable]` amm_target_orders
///   9. `[]` serum_program
///   10. `[writable]` serum_market
///   11. `[writable]` serum_bids
///   12. `[writable]` serum_asks
///   13. `[writable]` serum_event_queue
///   14. `[writable]` serum_coin_vault
///   15. `[writable]` serum_pc_vault
///   16. `[]` serum_vault_signer
///   17. `[writable]` new_amm_open_orders
///   18. `[]` new_serum_program
///   19. `[]` new_serum_market
///   20. `[writable, signer]` admin
#[derive(Clone, Debug)]
pub struct MigrateToOpenBookCpiBuilder<'a, 'b> {
    instruction: Box<MigrateToOpenBookCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> MigrateToOpenBookCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(MigrateToOpenBookCpiBuilderInstruction {
            __program: program,
            token_program: None,
            system_program: None,
            rent: None,
            amm: None,
            amm_authority: None,
            amm_open_orders: None,
            amm_token_coin: None,
            amm_token_pc: None,
            amm_target_orders: None,
            serum_program: None,
            serum_market: None,
            serum_bids: None,
            serum_asks: None,
            serum_event_queue: None,
            serum_coin_vault: None,
            serum_pc_vault: None,
            serum_vault_signer: None,
            new_amm_open_orders: None,
            new_serum_program: None,
            new_serum_market: None,
            admin: None,
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
    #[inline(always)]
    pub fn amm(&mut self, amm: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.amm = Some(amm);
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
    pub fn amm_open_orders(
        &mut self,
        amm_open_orders: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_open_orders = Some(amm_open_orders);
        self
    }
    #[inline(always)]
    pub fn amm_token_coin(
        &mut self,
        amm_token_coin: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_token_coin = Some(amm_token_coin);
        self
    }
    #[inline(always)]
    pub fn amm_token_pc(
        &mut self,
        amm_token_pc: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_token_pc = Some(amm_token_pc);
        self
    }
    #[inline(always)]
    pub fn amm_target_orders(
        &mut self,
        amm_target_orders: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.amm_target_orders = Some(amm_target_orders);
        self
    }
    #[inline(always)]
    pub fn serum_program(
        &mut self,
        serum_program: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_program = Some(serum_program);
        self
    }
    #[inline(always)]
    pub fn serum_market(
        &mut self,
        serum_market: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_market = Some(serum_market);
        self
    }
    #[inline(always)]
    pub fn serum_bids(
        &mut self,
        serum_bids: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_bids = Some(serum_bids);
        self
    }
    #[inline(always)]
    pub fn serum_asks(
        &mut self,
        serum_asks: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_asks = Some(serum_asks);
        self
    }
    #[inline(always)]
    pub fn serum_event_queue(
        &mut self,
        serum_event_queue: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_event_queue = Some(serum_event_queue);
        self
    }
    #[inline(always)]
    pub fn serum_coin_vault(
        &mut self,
        serum_coin_vault: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_coin_vault = Some(serum_coin_vault);
        self
    }
    #[inline(always)]
    pub fn serum_pc_vault(
        &mut self,
        serum_pc_vault: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_pc_vault = Some(serum_pc_vault);
        self
    }
    #[inline(always)]
    pub fn serum_vault_signer(
        &mut self,
        serum_vault_signer: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.serum_vault_signer = Some(serum_vault_signer);
        self
    }
    #[inline(always)]
    pub fn new_amm_open_orders(
        &mut self,
        new_amm_open_orders: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_amm_open_orders = Some(new_amm_open_orders);
        self
    }
    #[inline(always)]
    pub fn new_serum_program(
        &mut self,
        new_serum_program: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_serum_program = Some(new_serum_program);
        self
    }
    #[inline(always)]
    pub fn new_serum_market(
        &mut self,
        new_serum_market: &'b solana_account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_serum_market = Some(new_serum_market);
        self
    }
    #[inline(always)]
    pub fn admin(&mut self, admin: &'b solana_account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.admin = Some(admin);
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
        let instruction = MigrateToOpenBookCpi {
            __program: self.instruction.__program,

            token_program: self
                .instruction
                .token_program
                .expect("token_program is not set"),

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            rent: self.instruction.rent.expect("rent is not set"),

            amm: self.instruction.amm.expect("amm is not set"),

            amm_authority: self
                .instruction
                .amm_authority
                .expect("amm_authority is not set"),

            amm_open_orders: self
                .instruction
                .amm_open_orders
                .expect("amm_open_orders is not set"),

            amm_token_coin: self
                .instruction
                .amm_token_coin
                .expect("amm_token_coin is not set"),

            amm_token_pc: self
                .instruction
                .amm_token_pc
                .expect("amm_token_pc is not set"),

            amm_target_orders: self
                .instruction
                .amm_target_orders
                .expect("amm_target_orders is not set"),

            serum_program: self
                .instruction
                .serum_program
                .expect("serum_program is not set"),

            serum_market: self
                .instruction
                .serum_market
                .expect("serum_market is not set"),

            serum_bids: self.instruction.serum_bids.expect("serum_bids is not set"),

            serum_asks: self.instruction.serum_asks.expect("serum_asks is not set"),

            serum_event_queue: self
                .instruction
                .serum_event_queue
                .expect("serum_event_queue is not set"),

            serum_coin_vault: self
                .instruction
                .serum_coin_vault
                .expect("serum_coin_vault is not set"),

            serum_pc_vault: self
                .instruction
                .serum_pc_vault
                .expect("serum_pc_vault is not set"),

            serum_vault_signer: self
                .instruction
                .serum_vault_signer
                .expect("serum_vault_signer is not set"),

            new_amm_open_orders: self
                .instruction
                .new_amm_open_orders
                .expect("new_amm_open_orders is not set"),

            new_serum_program: self
                .instruction
                .new_serum_program
                .expect("new_serum_program is not set"),

            new_serum_market: self
                .instruction
                .new_serum_market
                .expect("new_serum_market is not set"),

            admin: self.instruction.admin.expect("admin is not set"),
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct MigrateToOpenBookCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_account_info::AccountInfo<'a>,
    token_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    system_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    rent: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_authority: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_open_orders: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_token_coin: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_token_pc: Option<&'b solana_account_info::AccountInfo<'a>>,
    amm_target_orders: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_market: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_bids: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_asks: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_event_queue: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_coin_vault: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_pc_vault: Option<&'b solana_account_info::AccountInfo<'a>>,
    serum_vault_signer: Option<&'b solana_account_info::AccountInfo<'a>>,
    new_amm_open_orders: Option<&'b solana_account_info::AccountInfo<'a>>,
    new_serum_program: Option<&'b solana_account_info::AccountInfo<'a>>,
    new_serum_market: Option<&'b solana_account_info::AccountInfo<'a>>,
    admin: Option<&'b solana_account_info::AccountInfo<'a>>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(&'b solana_account_info::AccountInfo<'a>, bool, bool)>,
}
