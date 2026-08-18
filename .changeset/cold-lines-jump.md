---
'@codama/errors': patch
'@codama/dynamic-codecs': patch
'@codama/visitors': patch
---

Correct error context types that could never match their runtime values, surfaced by type-aware linting: validation items and their node paths are now `readonly`, and the `CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY` context types its `dependency` as the dangling `AccountValueNode | ArgumentValueNode` reference it actually receives. The `CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND` context now carries the resolved enum type node instead of the defined type link, and account-field-not-found errors normalise the missing field name to camel case.
