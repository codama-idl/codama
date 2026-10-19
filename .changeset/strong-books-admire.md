---
'@codama/dynamic-codecs': patch
---

Round-trip map values with non-string keys: integer, boolean and float keys use their string form, variants without data their identifier, and other keys such as structs or tuples a deterministic JSON form, which encoding parses back using the key type. Encoding now also rejects integers out of the range of their format with a `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error carrying the path of the integer.
