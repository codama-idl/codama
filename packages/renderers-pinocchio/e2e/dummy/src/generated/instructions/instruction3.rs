//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

/// `instruction3` CPI helper.
pub struct Instruction3 {}

impl Instruction3 {
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
