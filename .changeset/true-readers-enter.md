---
'@codama/renderers-js': patch
---

Use type cast on generated encoder and decoder functions when dealing with fixed-size data enums. This is because the `getDiscriminatedUnion(Encoder|Decoder)` functions do not propagate the fixed-size information.
