---
'@codama/dynamic-parsers': minor
---

Search additional programs when identifying and parsing data. `parseInstruction` now uses the instruction's `programAddress` to restrict the search to the matching program, falling back to all programs when none matches. All `identify*` and `parse*` functions accept an optional `programAddress` option.
