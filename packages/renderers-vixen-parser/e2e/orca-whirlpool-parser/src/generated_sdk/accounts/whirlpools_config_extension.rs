//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WhirlpoolsConfigExtension {
    pub discriminator: [u8; 8],
    #[cfg_attr(
        feature = "serde",
        serde(with = "serde_with::As::<serde_with::DisplayFromStr>")
    )]
    pub whirlpools_config: Pubkey,
    #[cfg_attr(
        feature = "serde",
        serde(with = "serde_with::As::<serde_with::DisplayFromStr>")
    )]
    pub config_extension_authority: Pubkey,
    #[cfg_attr(
        feature = "serde",
        serde(with = "serde_with::As::<serde_with::DisplayFromStr>")
    )]
    pub token_badge_authority: Pubkey,
}

pub const WHIRLPOOLS_CONFIG_EXTENSION_DISCRIMINATOR: [u8; 8] = [2, 99, 215, 163, 240, 26, 153, 58];

impl WhirlpoolsConfigExtension {
    pub const LEN: usize = 104;

    #[inline(always)]
    pub fn from_bytes(data: &[u8]) -> Result<Self, std::io::Error> {
        let mut data = data;
        Self::deserialize(&mut data)
    }
}

impl<'a> TryFrom<&solana_account_info::AccountInfo<'a>> for WhirlpoolsConfigExtension {
    type Error = std::io::Error;

    fn try_from(account_info: &solana_account_info::AccountInfo<'a>) -> Result<Self, Self::Error> {
        let mut data: &[u8] = &(*account_info.data).borrow();
        Self::deserialize(&mut data)
    }
}

#[cfg(feature = "fetch")]
pub fn fetch_whirlpools_config_extension(
    rpc: &solana_client::rpc_client::RpcClient,
    address: &solana_pubkey::Pubkey,
) -> Result<crate::shared::DecodedAccount<WhirlpoolsConfigExtension>, std::io::Error> {
    let accounts = fetch_all_whirlpools_config_extension(rpc, &[*address])?;
    Ok(accounts[0].clone())
}

#[cfg(feature = "fetch")]
pub fn fetch_all_whirlpools_config_extension(
    rpc: &solana_client::rpc_client::RpcClient,
    addresses: &[solana_pubkey::Pubkey],
) -> Result<Vec<crate::shared::DecodedAccount<WhirlpoolsConfigExtension>>, std::io::Error> {
    let accounts = rpc
        .get_multiple_accounts(addresses)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    let mut decoded_accounts: Vec<crate::shared::DecodedAccount<WhirlpoolsConfigExtension>> =
        Vec::new();
    for i in 0..addresses.len() {
        let address = addresses[i];
        let account = accounts[i].as_ref().ok_or(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Account not found: {}", address),
        ))?;
        let data = WhirlpoolsConfigExtension::from_bytes(&account.data)?;
        decoded_accounts.push(crate::shared::DecodedAccount {
            address,
            account: account.clone(),
            data,
        });
    }
    Ok(decoded_accounts)
}

#[cfg(feature = "fetch")]
pub fn fetch_maybe_whirlpools_config_extension(
    rpc: &solana_client::rpc_client::RpcClient,
    address: &solana_pubkey::Pubkey,
) -> Result<crate::shared::MaybeAccount<WhirlpoolsConfigExtension>, std::io::Error> {
    let accounts = fetch_all_maybe_whirlpools_config_extension(rpc, &[*address])?;
    Ok(accounts[0].clone())
}

#[cfg(feature = "fetch")]
pub fn fetch_all_maybe_whirlpools_config_extension(
    rpc: &solana_client::rpc_client::RpcClient,
    addresses: &[solana_pubkey::Pubkey],
) -> Result<Vec<crate::shared::MaybeAccount<WhirlpoolsConfigExtension>>, std::io::Error> {
    let accounts = rpc
        .get_multiple_accounts(addresses)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    let mut decoded_accounts: Vec<crate::shared::MaybeAccount<WhirlpoolsConfigExtension>> =
        Vec::new();
    for i in 0..addresses.len() {
        let address = addresses[i];
        if let Some(account) = accounts[i].as_ref() {
            let data = WhirlpoolsConfigExtension::from_bytes(&account.data)?;
            decoded_accounts.push(crate::shared::MaybeAccount::Exists(
                crate::shared::DecodedAccount {
                    address,
                    account: account.clone(),
                    data,
                },
            ));
        } else {
            decoded_accounts.push(crate::shared::MaybeAccount::NotFound(address));
        }
    }
    Ok(decoded_accounts)
}

#[cfg(feature = "anchor")]
impl anchor_lang::AccountDeserialize for WhirlpoolsConfigExtension {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
        Ok(Self::deserialize(buf)?)
    }
}

#[cfg(feature = "anchor")]
impl anchor_lang::AccountSerialize for WhirlpoolsConfigExtension {}

#[cfg(feature = "anchor")]
impl anchor_lang::Owner for WhirlpoolsConfigExtension {
    fn owner() -> Pubkey {
        crate::WHIRLPOOL_ID
    }
}

#[cfg(feature = "anchor-idl-build")]
impl anchor_lang::IdlBuild for WhirlpoolsConfigExtension {}

#[cfg(feature = "anchor-idl-build")]
impl anchor_lang::Discriminator for WhirlpoolsConfigExtension {
    const DISCRIMINATOR: [u8; 8] = [0; 8];
}
