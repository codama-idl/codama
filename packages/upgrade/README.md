# Codama ➤ Upgrade

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/upgrade.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/upgrade.svg?style=flat&label=%40codama%2Fupgrade
[npm-url]: https://www.npmjs.com/package/@codama/upgrade

This package upgrades Codama IDLs of any supported major version to the latest major version of the standard.

## Installation

```sh
pnpm install @codama/upgrade
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package, so the core stays lean. Add it at the boundary where your tooling ingests IDLs of unknown or older versions.

## Functions

### `upgrade(rootNode)`

This function takes a `RootNode` of any supported major version and returns a `RootNode` conforming to the latest major, restamped with the latest spec version.

```ts
import { upgrade } from '@codama/upgrade';
import { createFromRoot } from 'codama';

const codama = createFromRoot(upgrade(rootNodeOfAnyVersion));
```

IDLs already on the latest major go through unchanged, minus the version restamp. IDLs that predate the 1.0.0 specification throw a `CODAMA_ERROR__UNSUPPORTED_VERSION` error and must be regenerated from their original source; IDLs from a future major throw a `CODAMA_ERROR__VERSION_MISMATCH` error and require updating your Codama dependencies instead.

### `upgradeFromJson(json)`

This function wraps `upgrade` for JSON-encoded IDLs, e.g. when reading an IDL from disk or from the chain.

```ts
import { upgradeFromJson } from '@codama/upgrade';
import { createFromRoot } from 'codama';
import { readFileSync } from 'node:fs';

const json = readFileSync('idl.json', 'utf-8');
const codama = createFromRoot(upgradeFromJson(json));
```

### `upgradeToLatestVisitor()`

This function returns a visitor that upgrades the visited IDL, designed as a preprocessing step at IDL-ingestion boundaries. It is also the package's default export, so it can be used as a `before` visitor in a Codama CLI config using the bare module name, ensuring any older IDL is upgraded before other visitors and scripts run:

```json
{
    "idl": "program/idl.json",
    "before": ["@codama/upgrade"]
}
```

The explicit `"@codama/upgrade#upgradeToLatestVisitor"` form is equivalent.

### `upgradeV1ToV2(rootNode)`

Each step of the upgrade chain is also exported on its own, for tools that only need to go from one major to the next. Importing a single step only bundles that step. The result is stamped with the latest version of the major it produces.

```ts
import { upgradeV1ToV2 } from '@codama/upgrade';

const v2Root = upgradeV1ToV2(v1Root);
```

## Upgrading from v1

Most v1 nodes have a direct v2 counterpart. Information that v2 can no longer express in the IDL itself moves into the official `codama.*` plugins, so renderers can still act on it:

| v1                                                                              | v2                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Instruction `arguments`                                                         | The fields of a struct `data`                                                                                                                                                                    |
| A contextual argument default, e.g. `accountBumpValueNode('vault')`             | An `injectedValueNode` keyed by the argument, provided by the instruction's `provides`                                                                                                           |
| `argumentValueNode('amount')` / `accountFieldValueNode('mint', 'authority')`    | `dataValueNode('amount')` / `accountDataValueNode('mint', { path: 'authority' })`                                                                                                                |
| `extraArguments`                                                                | `codama.extraArgument` plugins on the instruction. A default v2 cannot express is resolved by a `codama.resolver` plugin nested in the extra argument plugin, which keeps the default's strategy |
| A `resolverValueNode` default                                                   | No default, and a `codama.resolver` plugin with the resolver's name and dependencies                                                                                                             |
| A default relying on a resolver or an extra argument, e.g. a resolved condition | No default, and a new `codama.resolver` plugin, e.g. `resolveBurnEdition`, resolving the whole default. Its dependencies include the seeds a PDA default omits                                   |
| Remaining accounts given as `argumentValueNode('signers')` or by a resolver     | Remaining accounts identified as `signers`, or as `remainingAccounts` (or the first free `remainingAccountsN`) with a `codama.resolver` plugin                                                   |
| A byte delta given by a resolver                                                | A zero byte delta with a `codama.resolver` plugin                                                                                                                                                |

Names keep their v1 spelling, except for dashes in hand-written names, which become underscores, e.g. `token-2022` becomes `token_2022`, including where plugins reference them, such as resolver dependencies. Any other name that is not a valid v2 identifier throws a `CODAMA_ERROR__INVALID_BRANDED_STRING` error. Tuple variants holding a single item stay tuples, so generated APIs are unchanged.

## How it works

The package maintains an append-only chain of pure, hand-written functions, each upgrading exactly one major to the next. Upgrading detects the IDL's source major from its `version` attribute, runs every function from that major up to the latest, and restamps the result — so supporting a new major only ever requires one new function, and every older version reaches the latest for free, forever.

The node types of older majors are pinned at the time each major is superseded: this package depends on the last published `@codama/node-types` release of that major, as a type-only dependency with no runtime cost. They are exposed as type-only namespaces for anyone writing custom migration logic:

```ts
import type { v1 } from '@codama/upgrade';

function inspectLegacyIdl(root: v1.RootNode) {
    // Typed against the v1 node types.
}
```

Upgrade functions are pure JSON-tree-in, JSON-tree-out transforms with no environment access, which keeps the upgrade chain portable to other implementations of the Codama standard.

Maintainers: the playbook for releasing a new major of the Codama standard lives in the repository-root [CONTRIBUTING](https://github.com/codama-idl/codama/blob/main/CONTRIBUTING.md).
