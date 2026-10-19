---
'@codama/upgrade': major
---

Upgrade Codama 1.x IDLs to the v2 standard. `upgrade`, `upgradeFromJson` and `upgradeToLatestVisitor` now run the first step of the upgrade chain, also exported on its own as `upgradeV1ToV2` for tools that only need to go from v1 to v2.

```ts
import { upgradeFromJson } from '@codama/upgrade';
import { createFromRoot } from 'codama';

const codama = createFromRoot(upgradeFromJson(v1Json)); // A v2 IDL.
```

**BREAKING CHANGES**

**1.x IDLs are upgraded to v2.** In 1.x, the upgrade chain was empty, so 1.x IDLs came back unchanged apart from their version. They now come back as v2 IDLs, stamped with the latest 2.x version. Most v1 nodes have a direct v2 counterpart, and information v2 can no longer express in the IDL itself moves into the official `codama.*` plugins:

- Instruction `arguments` become the fields of a struct `data`, `argumentValueNode` becomes `dataValueNode` and `accountFieldValueNode` becomes `accountDataValueNode`. Contextual argument defaults become `injectedValueNode`s provided by the instruction's `provides`.
- `extraArguments` become `codama.extraArgument` plugins on the instruction.
- `resolverValueNode` defaults are removed in favour of `codama.resolver` plugins carrying the resolver's name and dependencies. Defaults that v2 cannot express, e.g. a condition on a resolver or a reference to an extra argument, are replaced by a new resolver for the whole input, e.g. `resolveBurnEdition`. Remaining accounts and byte deltas given by resolvers follow the same approach.
- Wrapper type nodes become `transforms`, number types and values become integers or floats (following links to tell them apart), amounts and SOL amounts become fixed points, date-time and duration displays become `dateTimeTypeNode`s and `durationTypeNode`s where allowed, and the three enum variant nodes become `enumVariantTypeNode`s. Docs are joined into a single string and `programNode.origin` is dropped.

A few presentation-only details cannot be carried over, e.g. date-time or duration displays on integers used as prefixes or sizes, or amount displays on floats, which keep their unit only. Non-integral numbers on integer types become `floatValueNode`s, which v2 validators report, whereas floats in integer-only positions, e.g. a float size prefix, throw.

**Names are validated as v2 identifiers.** Names keep their v1 spelling, except for dashes, which become underscores, e.g. `token-2022` becomes `token_2022`, including where plugins reference them. Any other name that is not a valid v2 identifier, path or namespace throws a `CODAMA_ERROR__INVALID_BRANDED_STRING` error.

**Resolved inputs lose their default value.** Since inputs resolved by a `codama.resolver` plugin have no default value in v2, validators treat them like any other input without a default. For instance, an optional account resolved in v1 and used as a PDA seed is now reported with a `CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE` error. Make such accounts required, or give them a default value, if the program always expects them.
