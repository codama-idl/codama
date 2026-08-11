---
'@codama/dynamic-parsers': minor
---

Capture trailing account metas on parsed instructions. `ParsedInstruction` gains an optional `remainingAccounts` attribute carrying the concrete metas beyond the instruction's named accounts (e.g. multisig signers), which `parseInstruction` now always populates.
