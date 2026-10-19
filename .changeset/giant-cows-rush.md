---
'@codama/nodes-from-anchor': patch
---

Fix the instruction discriminators of legacy (v00) IDLs and the error thrown for unknown generic types:

- Instruction names containing acronyms now hash to the name Anchor uses, e.g. `setHTTPConfig` hashes `global:set_http_config` instead of `global:set_h_t_t_p_config`.
- Shank instruction discriminators below 16 are zero-padded to a full byte, e.g. `0a` instead of `a`.
- References to an unknown generic type in current (v01) IDLs throw a `CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING` error instead of a `TypeError`.
