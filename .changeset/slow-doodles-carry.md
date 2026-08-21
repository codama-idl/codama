---
'@codama/visitors': minor
---

Add `checkCodamaVersionVisitor`. It checks the version of the visited Codama IDL against the Codama spec version supported by the installed packages, throwing a `CODAMA_ERROR__VERSION_MISMATCH` error when the majors differ. It is mainly useful at IDL-ingestion boundaries that bypass `createFromRoot`, such as a `before` visitor in a Codama CLI config.
