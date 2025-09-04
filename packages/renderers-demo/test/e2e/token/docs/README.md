---
title: Token Program
description: Overview of the Token Program
---

# Token Program

## Information

- Address: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- Version: `3.3.0`

## Accounts

- [Mint](accounts/mint.md)
- [Token](accounts/token.md)
- [Multisig](accounts/multisig.md)

## Instructions

- [Initialize Mint](instructions/initializeMint.md)
- [Initialize Account](instructions/initializeAccount.md)
- [Initialize Multisig](instructions/initializeMultisig.md)
- [Transfer](instructions/transfer.md)
- [Approve](instructions/approve.md)
- [Revoke](instructions/revoke.md)
- [Set Authority](instructions/setAuthority.md)
- [Mint To](instructions/mintTo.md)
- [Burn](instructions/burn.md)
- [Close Account](instructions/closeAccount.md)
- [Freeze Account](instructions/freezeAccount.md)
- [Thaw Account](instructions/thawAccount.md)
- [Transfer Checked](instructions/transferChecked.md)
- [Approve Checked](instructions/approveChecked.md)
- [Mint To Checked](instructions/mintToChecked.md)
- [Burn Checked](instructions/burnChecked.md)
- [Initialize Account2](instructions/initializeAccount2.md)
- [Sync Native](instructions/syncNative.md)
- [Initialize Account3](instructions/initializeAccount3.md)
- [Initialize Multisig2](instructions/initializeMultisig2.md)
- [Initialize Mint2](instructions/initializeMint2.md)
- [Get Account Data Size](instructions/getAccountDataSize.md)
- [Initialize Immutable Owner](instructions/initializeImmutableOwner.md)
- [Amount To Ui Amount](instructions/amountToUiAmount.md)
- [Ui Amount To Amount](instructions/uiAmountToAmount.md)

## PDAs

_This program has no PDAs._

## Defined types

- [Account State](definedTypes/accountState.md)
- [Authority Type](definedTypes/authorityType.md)

## Errors

| Name                               | Code | Message                                                      |
| ---------------------------------- | ---- | ------------------------------------------------------------ |
| Not Rent Exempt                    | `0`  | Lamport balance below rent-exempt threshold                  |
| Insufficient Funds                 | `1`  | Insufficient funds                                           |
| Invalid Mint                       | `2`  | Invalid Mint                                                 |
| Mint Mismatch                      | `3`  | Account not associated with this Mint                        |
| Owner Mismatch                     | `4`  | Owner does not match                                         |
| Fixed Supply                       | `5`  | Fixed supply                                                 |
| Already In Use                     | `6`  | Already in use                                               |
| Invalid Number Of Provided Signers | `7`  | Invalid number of provided signers                           |
| Invalid Number Of Required Signers | `8`  | Invalid number of required signers                           |
| Uninitialized State                | `9`  | State is unititialized                                       |
| Native Not Supported               | `10` | Instruction does not support native tokens                   |
| Non Native Has Balance             | `11` | Non-native account can only be closed if its balance is zero |
| Invalid Instruction                | `12` | Invalid instruction                                          |
| Invalid State                      | `13` | State is invalid for requested operation                     |
| Overflow                           | `14` | Operation overflowed                                         |
| Authority Type Not Supported       | `15` | Account does not support specified authority type            |
| Mint Cannot Freeze                 | `16` | This token mint cannot freeze accounts                       |
| Account Frozen                     | `17` | Account is frozen                                            |
| Mint Decimals Mismatch             | `18` | The provided decimals value different from the Mint decimals |
| Non Native Not Supported           | `19` | Instruction does not support non-native tokens               |