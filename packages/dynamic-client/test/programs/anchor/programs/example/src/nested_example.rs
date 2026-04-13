
use anchor_lang::prelude::*;
use anchor_lang::Space;

// All arguments are stored in the NestedExampleAccount.input field for testing.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StructAndEnumsInput {
	pub header: InnerHeader,
	pub inner_struct: InnerStruct,
	pub inner_enum: InnerEnum,
    pub seed_enum: SeedEnum,
    pub pubkey: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct NestedExampleAccount {
    pub input: StructAndEnumsInput,
}

// We need to implement Space for all structures for size calculation.
impl Space for StructAndEnumsInput {
	const INIT_SPACE: usize =
		InnerHeader::INIT_SPACE
		+ InnerStruct::INIT_SPACE
		+ InnerEnum::INIT_SPACE
		+ SeedEnum::INIT_SPACE
		+ 32; // Pubkey field
}

// header: InnerHeader
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InnerHeader {
	pub version: u32,
	pub command: Command,
}
impl Space for InnerHeader {
	const INIT_SPACE: usize = 4 + Command::INIT_SPACE;
}
// command: Command
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Command {
	Start(u64),
	Stop,
	Continue { reason: String },
}
impl Space for Command {
	const INIT_SPACE: usize = 1 + 8 + 4 + 64; // discriminant + u64 + String (max 64 for simplicity)
}

// inner_struct: InnerStruct
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InnerStruct {
	pub value: u64,
	pub name: String,
    pub seed_enum: SeedEnum,
    pub bytes: Vec<u8>,
    pub optional_pubkey: Option<Pubkey>,
    pub enums_array: [SeedEnum; 2],
}
impl Space for InnerStruct {
	const INIT_SPACE: usize =
		8 // value: u64
		+ 4 + 32 // name: String (max 32 for simplicity)
		+ SeedEnum::INIT_SPACE
		+ 4 + 32 // bytes: Vec<u8> (max 32 for simplicity)
		+ 1 + 32 // optional_pubkey: Option<Pubkey>
		+ 2 * SeedEnum::INIT_SPACE; // enums_array
}

// inner_enum: InnerEnum
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum InnerEnum {
	TokenTransfer { amount: u64, token_type: TokenType },
	Stake { duration: u64 },
	None,
}
impl Space for InnerEnum {
	const INIT_SPACE: usize = 1 + 8 + TokenType::INIT_SPACE;
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum TokenType {
	SPL,
	NFT { collection: String },
}
impl Space for TokenType {
	const INIT_SPACE: usize = 1 + 4 + 64;
}

// seed_enum: SeedEnum (used as example of nested enum PDA seed)
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum SeedEnum {
	Arm = 0,
	Bar = 1,
	Car = 2,
}
impl SeedEnum {
    pub fn as_seed(&self) -> [u8; 1] {
        [self.clone() as u8]
    }
}
impl Space for SeedEnum {
	const INIT_SPACE: usize = 1;
}

#[derive(Accounts)]
#[instruction(input: StructAndEnumsInput)]
pub struct NestedStructsAndEnums<'info> {
	#[account(mut)]
	pub signer: Signer<'info>,
    // The PDA account is derived using multiple fields from the input arguments, demonstrating complex seed derivation.
    // Dependency from argument doesn't produce pdaAccountNode with seeds in Codama IDL.
	#[account(
		init,
        payer = signer,
        space = 8 + NestedExampleAccount::INIT_SPACE,
		seeds = [
			b"nested_example_account",
			input.pubkey.as_ref(),
			input.seed_enum.as_seed().as_ref(),
			input.inner_struct.seed_enum.as_seed().as_ref(),
		],
		bump
	)]
	pub nested_example_account: Account<'info, NestedExampleAccount>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
	ctx: Context<NestedStructsAndEnums>,
	input: StructAndEnumsInput,
) -> Result<()> {
    let nested_example_account = &mut ctx.accounts.nested_example_account;
	nested_example_account.input = input;
	Ok(())
}
