---
'@codama/errors': major
---

Add, rename and remove error codes for Codama v2. Renamed codes keep their number, and removed codes are never reused.

New codes:

- `CODAMA_ERROR__INVALID_BRANDED_STRING` (13): `{ actual, expected }`.
- `CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED` (14): `{ key, path }`.
- `CODAMA_ERROR__CANNOT_RESOLVE_PATH` (15): `{ path, pathString, segment }`.
- `CODAMA_ERROR__NODE_PATH_PROGRAM_MISSING` (16): `{ path }`.
- `CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE` (17): `{ path }`.
- `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` (18): `{ path, ticksPerSecond }`.
- `CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER` (19): `{ placeholder, template }`.
- `CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE` (1200013): `{ expectedKinds, path }`.
- `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS` (1200014): `{ path }`.
- `CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS` (1200015): `{ allowedKeys, selector, unrecognizedKeys }`.
- `CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND` (1200016): `{ path, pathString }`.
- `CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND` (1200017): `{ accountName, path }`.
- `CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND` (1200018): `{ missingMember, path }`.
- `CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR` (1200019): `{ path, reason }`.
- `CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING` (2500020): `{ path }`.
- `CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM` (2500021): `{ firstIndex, index, path }`.

**BREAKING CHANGES**

**Renamed error codes.** Codama v2 replaces instruction arguments with instruction data, so the codes referring to arguments are renamed after what they now cover (data, account inputs such as remaining accounts, or any value). Their numbers are unchanged.

| Before | After | Code |
| --- | --- | --- |
| `CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND` | `CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND` | 1200009 |
| `CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING` | `CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING` | 2500011 |
| `CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ARGUMENT_INPUT` | `CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT` | 2500013 |
| `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ARGUMENT_TYPE` | `CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` | 2500014 |
| `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT` | `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` | 2500015 |

```diff
- import { CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING } from '@codama/errors';
+ import { CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING } from '@codama/errors';
```

**Removed error codes.** The following codes are not thrown by any Codama v2 package and are removed. Their numbers will not be reused.

- `CODAMA_ERROR__UNEXPECTED_NESTED_NODE_KIND` (3): nested type nodes no longer exist since type wrappers became transforms.
- `CODAMA_ERROR__ANCHOR__TYPE_PATH_MISSING` (2100003).
- `CODAMA_ERROR__ANCHOR__PROGRAM_ID_KIND_UNIMPLEMENTED` (2100005).
- `CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING` (2500012).

**Deprecated resolver error codes.** `CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_RESOLVER_MISSING` (2500007) and `CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER` (2500016) are still exported but deprecated, since Codama v2 removes `resolverValueNode` and they are no longer thrown.
