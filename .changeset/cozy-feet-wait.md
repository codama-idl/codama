---
'@codama/dynamic-parsers': patch
---

Return `undefined` instead of throwing when identified data cannot be decoded. A discriminator can match while the full data does not conform (e.g. truncated or corrupt bytes); the `parse*` functions now treat that as "not parsable", mirroring the `undefined` returned when nothing is identified.
