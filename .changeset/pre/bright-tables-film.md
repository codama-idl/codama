---
'@codama/errors': minor
'@codama/upgrade': patch
---

Reject v1 instructions whose upgrade would provide clashing values under the same key, instead of producing conflicting `provides` entries. Providing a contextual argument default under a key already provided with a different value, or under the key of a v1 injection it would then resolve, now throws the new `CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY` error, while identical values are provided once.
