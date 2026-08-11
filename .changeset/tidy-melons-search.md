---
'@codama/dynamic-parsers': minor
---

Search additional programs when identifying and parsing data. `parseInstruction` now uses the instruction's `programAddress` to restrict the search to the matching program, and identifies nothing when no program of the root matches that address. All `identify*` and `parse*` functions accept an optional `programAddress` option.
