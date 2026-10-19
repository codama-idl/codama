---
'@codama/fragments': patch
---

Split the items given to the Rust and JavaScript `getDocblockFragment` helpers on line breaks, so multi-line docs (common in Anchor IDLs) no longer leak unprefixed lines into the generated code. A single trailing line break in an item is ignored rather than rendered as an empty doc line.
