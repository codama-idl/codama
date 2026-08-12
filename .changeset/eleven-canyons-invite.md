---
'@codama/dynamic-instructions': patch
---

Mark unresolved amount scales instead of degrading silently. When an `amountNumberDisplayNode` is present but its `decimals` cannot be resolved (e.g. no `fetchAccount` for an account-injected scale), the field list now renders the value explicitly marked — `1500000 (raw)` — and any interpolated sentence referencing it returns `null`, falling back to the field list. Previously the bare integer rendered unmarked in both, reading exactly like a scaled amount. Amount displays authored without a `decimals` attribute are unaffected: they remain valid unscaled amounts.
