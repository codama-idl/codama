---
'@codama/dynamic-instructions': patch
---

Stop marking the program address as a signer when an optional signer account is left out under the `programId` strategy. `createAccountMetas` gave it the `READONLY_SIGNER` role, so the transaction asked for a signature from the program, e.g. mpl-core's `CreateV1` without an `authority`.
