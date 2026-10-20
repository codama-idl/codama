---
'@codama/dynamic-codecs': patch
---

Reject integers out of the range of their format when encoding, with a `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error carrying the path of the integer. As a result, `@codama/dynamic-instructions` now reports out-of-range integers as `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` errors instead of `DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` errors.
