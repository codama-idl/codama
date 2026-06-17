---
'@codama/dynamic-parsers': patch
---

Decode single-instruction programs that omit a discriminator in `parseInstructionData` / `parseInstruction`

`parseInstructionData` now falls back to decoding the single instruction directly when discriminator-based identification finds nothing and the program declares exactly one instruction with no discriminator (e.g. Memo program).