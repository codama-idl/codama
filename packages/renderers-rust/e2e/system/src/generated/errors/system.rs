//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use num_derive::FromPrimitive;
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum SystemError {
    /// 0 - an account with the same address already exists
    #[error("an account with the same address already exists")]
    AccountAlreadyInUse = 0x0,
    /// 1 - account does not have enough SOL to perform the operation
    #[error("account does not have enough SOL to perform the operation")]
    ResultWithNegativeLamports = 0x1,
    /// 2 - cannot assign account to this program id
    #[error("cannot assign account to this program id")]
    InvalidProgramId = 0x2,
    /// 3 - cannot allocate account data of this length
    #[error("cannot allocate account data of this length")]
    InvalidAccountDataLength = 0x3,
    /// 4 - length of requested seed is too long
    #[error("length of requested seed is too long")]
    MaxSeedLengthExceeded = 0x4,
    /// 5 - provided address does not match addressed derived from seed
    #[error("provided address does not match addressed derived from seed")]
    AddressWithSeedMismatch = 0x5,
    /// 6 - advancing stored nonce requires a populated RecentBlockhashes sysvar
    #[error("advancing stored nonce requires a populated RecentBlockhashes sysvar")]
    NonceNoRecentBlockhashes = 0x6,
    /// 7 - stored nonce is still in recent_blockhashes
    #[error("stored nonce is still in recent_blockhashes")]
    NonceBlockhashNotExpired = 0x7,
    /// 8 - specified nonce does not match stored nonce
    #[error("specified nonce does not match stored nonce")]
    NonceUnexpectedBlockhashValue = 0x8,
}

impl From<SystemError> for solana_program_error::ProgramError {
    fn from(e: SystemError) -> Self {
        solana_program_error::ProgramError::Custom(e as u32)
    }
}
