//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use pinocchio::pubkey::Pubkey;

/// `assign` CPI helper.
pub struct Assign<'a> {
    pub account: &'a pinocchio::account_info::AccountInfo,
    pub program_address: Pubkey,
}

impl<'a> Assign<'a> {
    #[inline(always)]
    pub fn invoke(&self) -> pinocchio::ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(
        &self,
        _signers: &[pinocchio::instruction::Signer],
    ) -> pinocchio::ProgramResult {
        Ok(())
    }
}
