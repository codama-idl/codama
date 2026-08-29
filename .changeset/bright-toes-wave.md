---
'@codama/nodes-from-anchor': patch
---

Fix `Vec<u8>` instruction arguments used as PDA seeds to derive from their raw bytes instead of the Borsh size-prefixed encoding. Anchor derives byte-array seeds from the unprefixed bytes, so the generated seed type previously produced a different PDA than the on-chain program for any program using a `Vec<u8>` seed.
