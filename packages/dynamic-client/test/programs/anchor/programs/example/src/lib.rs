#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use anchor_spl::{token::{Token, Mint, TokenAccount}, associated_token::AssociatedToken};
mod nested_example;
pub use nested_example::*;

declare_id!("5xjPsgMHuoj4MrAPJVBrTomk5UAZvCxVtAdcWwgheoZs");

#[program]
pub mod example {
    use super::*;

    pub fn pubkey_seed_ix(ctx: Context<PubkeySeedIx>, input: u64) -> Result<()> {
        ctx.accounts.new_account.input = input;
        ctx.accounts.new_account.bump = ctx.bumps.new_account;
        Ok(())
    }

    pub fn update_optional_input(
        ctx: Context<UpdateOptionalInput>,
        input: u64,
        optional_input: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.existing_account.input = input;
        ctx.accounts.existing_account.optional_input = optional_input;
        Ok(())
    }

    pub fn update_optional_account(ctx: Context<UpdateOptionalAccount>, _id: u64) -> Result<()> {
        ctx.accounts.created_optional_acc.optional_acc =
            ctx.accounts.optional_acc_key.as_ref().map(|acc| acc.key());
        Ok(())
    }

    pub fn no_arguments(_ctx: Context<NoArguments>) -> Result<()> {
        Ok(())
    }

    pub fn external_programs_with_pda(_ctx: Context<ExternalProgramsWithPdaIx>) -> Result<()> {
        Ok(())
    }

    pub fn four_level_pda(_ctx: Context<FourLevelPda>) -> Result<()> {
        Ok(())
    }

    pub fn self_reference_pda(_ctx: Context<SelfReferencePda>) -> Result<()> {
        Ok(())
    }

    pub fn two_node_cycle_pda(_ctx: Context<TwoNodeCyclePda>) -> Result<()> {
        Ok(())
    }

    pub fn nested_example(ctx: Context<NestedStructsAndEnums>, input: StructAndEnumsInput) -> Result<()> {
        nested_example::handler(ctx, input)
    }

    pub fn string_seed_pda(ctx: Context<StringSeedPda>, _name: String, id: u64) -> Result<()> {
        ctx.accounts.pda_account.input = id;
        ctx.accounts.pda_account.bump = ctx.bumps.pda_account;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct PubkeySeedIx<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 1 + 32 + 1,
        seeds = [b"seed", signer.key().as_ref()],
        bump
    )]
    pub new_account: Account<'info, DataAccount1>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DataAccount1 {
    input: u64,
    optional_input: Option<Pubkey>,
    bump: u8,
}

#[derive(Accounts)]
pub struct UpdateOptionalInput<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"seed", signer.key().as_ref()],
        bump = existing_account.bump
    )]
    pub existing_account: Account<'info, DataAccount1>,
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct UpdateOptionalAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = [b"optional_acc".as_ref(), &id.to_le_bytes()],
        payer = signer,
        space = 8 + StoreOptionalAccount::INIT_SPACE,
        bump,
    )]
    pub created_optional_acc: Account<'info, StoreOptionalAccount>,
    pub optional_acc_key: Option<UncheckedAccount<'info>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NoArguments<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + StoreOptionalAccount::INIT_SPACE,
    )]
    pub acc: Account<'info, StoreOptionalAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct StoreOptionalAccount {
    optional_acc: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct ExternalProgramsWithPdaIx<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // mint and token_account are to check auto-resolution with external program
    #[account(
        init,
        payer = signer,
        mint::decimals = 9,
        mint::authority = signer,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    // dependent_account to check that auto-resolution and seeds derivation from both:
    // signer (accountInput) and token_account (another auto-derived account)
    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"signer_and_ata", signer.key().as_ref(), token_account.key().as_ref()],
        bump
    )]
    pub dependent_account: Account<'info, DataAccount1>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FourLevelPda<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"level1", signer.key().as_ref()],
        bump
    )]
    pub level1: Account<'info, DataAccount1>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"level2", level1.key().as_ref()],
        bump
    )]
    pub level2: Account<'info, DataAccount1>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"level3", level2.key().as_ref()],
        bump
    )]
    pub level3: Account<'info, DataAccount1>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"level4", level3.key().as_ref()],
        bump
    )]
    pub level4: Account<'info, DataAccount1>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SelfReferencePda<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"recursive", recursive.key().as_ref()],
        bump
    )]
    pub recursive: Account<'info, DataAccount1>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TwoNodeCyclePda<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"pda_a", pda_b.key().as_ref()],
        bump
    )]
    pub pda_a: Account<'info, DataAccount1>,

    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [b"pda_b", pda_a.key().as_ref()],
        bump
    )]
    pub pda_b: Account<'info, DataAccount1>,

    pub system_program: Program<'info, System>,
}

// Reproducer for the PDA seed type mismatch:
// The `name` argument is a Rust `String`, which Borsh serializes with a u32 length prefix
// (sizePrefixTypeNode in Codama). But the PDA seed uses `name.as_bytes()` — raw UTF-8 bytes
// without any prefix (stringTypeNode in Codama). Without the proper seedTypeNode in
// pda-seed-value.ts, the library would encode the seed with the length prefix, deriving
// the wrong PDA address.
#[derive(Accounts)]
#[instruction(name: String, id: u64)]
pub struct StringSeedPda<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + DataAccount1::INIT_SPACE,
        seeds = [&id.to_le_bytes(), name.as_bytes()],
        bump
    )]
    pub pda_account: Account<'info, DataAccount1>,
    pub system_program: Program<'info, System>,
}
