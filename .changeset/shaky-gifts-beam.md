---
'@codama/renderers-js': patch
---

Use fixed size return types — e.g. `FixedSizeCodec` or `FixedSizeEncoder` — whenever possible. This avoid fixed-size codecs to be wrongly interpreted as variable-size codecs when wrapped in other codecs.
