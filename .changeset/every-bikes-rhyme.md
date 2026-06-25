---
'@codama/dynamic-instructions': minor
'@codama/dynamic-parsers': minor
---

Add clear-signing instruction display text (sRFC 39). `getInstructionDisplay` resolves a concrete instruction into a human-readable intent label, an interpolated sentence, and a structured fallback list of labelled fields, honouring the display metadata on instructions, accounts, arguments, and types (amounts, dates, durations, strings, enum labels, struct flattening, and the provide/inject graph). `@codama/dynamic-parsers` now exports the `ParsedInstruction` type.
