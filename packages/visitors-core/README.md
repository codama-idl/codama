# Kinobi ➤ Visitors ➤ Core

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@kinobi-so/visitors-core.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@kinobi-so/visitors-core.svg?style=flat&label=%40kinobi-so%2Fvisitors-core
[npm-url]: https://www.npmjs.com/package/@kinobi-so/visitors-core

This package provides core interfaces and utilities for creating visitors for Kinobi IDLs.

## Installation

```sh
pnpm install @kinobi-so/visitors-core
```

> [!NOTE]
> This package is included in the [`@kinobi-so/visitors`](../visitors) package and in the main [`kinobi`](../library) library. Meaning, you already have access to its content if you are installing Kinobi in one of these ways.
>
> ```sh
> pnpm install @kinobi-so/visitors
> pnpm install kinobi
> ```

## The `Visitor` type

-   visitor.ts

### Writing your own visitor

TODO

## Core visitors

-   voidVisitor.ts
-   staticVisitor.ts
-   identityVisitor.ts
-   nonNullableIdentityVisitor.ts
-   mergeVisitor.ts
-   singleNodeVisitor.ts

## Composing visitors

-   mapVisitor.ts
-   extendVisitor.ts
-   interceptVisitor.ts
-   tapVisitor.ts
-   pipe.ts

## Recording node stacks

-   NodeStack.ts
-   recordNodeStackVisitor.ts

## Selecting nodes

-   NodeSelector.ts

## Transforming nodes

-   bottomUpTransformerVisitor.ts
-   topDownTransformerVisitor.ts
-   deleteNodesVisitor.ts

## String representations

-   getDebugStringVisitor.ts
-   getUniqueHashStringVisitor.ts
-   consoleLogVisitor.ts

## Resolving link nodes

-   LinkableDictionary.ts
-   recordLinkablesVisitor.ts

## Others useful visitors

-   getByteSizeVisitor.ts
-   getResolvedInstructionInputsVisitor.ts
-   removeDocsVisitor.ts
