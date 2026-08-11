---
'@codama/dynamic-instructions': patch
---

Unwrap `Option` values when displaying instructions. Display metadata now applies to the value inside `optionTypeNode`, `zeroableOptionTypeNode` and `remainderOptionTypeNode` wrappers — e.g. a `COption<u64>` lamports amount renders as `1.5 SOL` instead of `{"__option":"Some","value":"1500000000"}` — and absent (`None`) values render as `none`. Flattened option-wrapped structs flatten their inner fields when present and render a single `none` field when absent.
