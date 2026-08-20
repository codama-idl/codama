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

Documents already on the latest major go through unchanged, minus the version restamp. Documents that predate the 1.0.0 specification throw a `CODAMA_ERROR__UNSUPPORTED_VERSION` error and must be regenerated from their original source; documents from a future major throw a `CODAMA_ERROR__VERSION_MISMATCH` error and require updating your Codama dependencies instead.

### `upgradeFromJson(json)`

This function wraps `upgrade` for JSON-encoded documents, e.g. when reading an IDL from disk or from the chain.

```ts
import { upgradeFromJson } from '@codama/upgrade';
import { createFromRoot } from 'codama';
import { readFileSync } from 'node:fs';

const json = readFileSync('idl.json', 'utf-8');
const codama = createFromRoot(upgradeFromJson(json));
```

### `upgradeToLatestVisitor()`

This function returns a visitor that upgrades the visited document, designed as a preprocessing step at IDL-ingestion boundaries. It is also the package's default export, so it can be used as a `before` visitor in a Codama CLI config using the bare module name, ensuring any older IDL is upgraded before other visitors and scripts run:

```json
{
    "idl": "program/idl.json",
    "before": ["@codama/upgrade"]
}
```

The explicit `"@codama/upgrade#upgradeToLatestVisitor"` form is equivalent.

## How it works

The package maintains an append-only chain of pure, hand-written functions, each upgrading exactly one major to the next. Upgrading detects the document's source major from its `version` attribute, runs every function from that major up to the latest, and restamps the result — so supporting a new major only ever requires one new function, and every older version reaches the latest for free, forever.

The node types of older majors are frozen into this package at the time each major is superseded (generated from a pinned `@codama/spec` of that era and committed). They are exposed as type-only namespaces for anyone writing custom migration logic:

```ts
import type { v1 } from '@codama/upgrade';

function inspectLegacyDocument(root: v1.RootNode) {
    // Typed against the frozen v1 node types.
}
```

Upgrade functions are pure JSON-tree-in, JSON-tree-out transforms with no environment access, which keeps the upgrade chain portable to other implementations of the Codama standard.
