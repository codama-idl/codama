---
'@codama/dynamic-instructions': patch
---

Render array values properly in instruction displays. Address arrays expand into one field per element in the fallback list (`New Addresses #1`, `New Addresses #2`, …), matching how named and remaining accounts each get their own individually-verifiable line. All other arrays render as a single comma-joined field whose elements go through their item type's presentation (`1.5 SOL, 0.5 SOL` instead of a JSON blob), with degraded amount elements marked inline and flagging the whole array. The ` (raw)` marker for unresolved amount scales now lives in the formatted text itself.
