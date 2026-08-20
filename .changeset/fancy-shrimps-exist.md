---
'codama': patch
'@codama/errors': patch
---

Fix `validateCodamaVersion` to compare the document's version against the Codama spec version (`CODAMA_VERSION`) instead of the npm package version, which is an unrelated namespace and caused false mismatches whenever the two drifted apart. The function now accepts any string and narrows it to `CodamaVersion` on success, rejects unparsable versions, and no longer special-cases 0.x versions. The `CODAMA_ERROR__VERSION_MISMATCH` message is reworded accordingly.
