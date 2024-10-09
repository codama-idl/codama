# @kinobi-so/nodes

## 0.22.0

### Minor Changes

-   [#183](https://github.com/kinobi-so/kinobi/pull/183) [`c8c5934`](https://github.com/kinobi-so/kinobi/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

-   [#175](https://github.com/kinobi-so/kinobi/pull/175) [`2b1259b`](https://github.com/kinobi-so/kinobi/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

-   [#180](https://github.com/kinobi-so/kinobi/pull/180) [`93a318a`](https://github.com/kinobi-so/kinobi/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

### Patch Changes

-   Updated dependencies [[`c8c5934`](https://github.com/kinobi-so/kinobi/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/kinobi-so/kinobi/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/kinobi-so/kinobi/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    -   @kinobi-so/node-types@0.22.0
    -   @kinobi-so/errors@0.22.0

## 0.21.5

### Patch Changes

-   Updated dependencies [[`a6849d3`](https://github.com/kinobi-so/kinobi/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    -   @kinobi-so/errors@0.21.5
    -   @kinobi-so/node-types@0.21.5

## 0.21.4

### Patch Changes

-   Updated dependencies []:
    -   @kinobi-so/errors@0.21.4
    -   @kinobi-so/node-types@0.21.4

## 0.21.3

### Patch Changes

-   Updated dependencies []:
    -   @kinobi-so/errors@0.21.3
    -   @kinobi-so/node-types@0.21.3

## 0.21.2

### Patch Changes

-   Updated dependencies []:
    -   @kinobi-so/errors@0.21.2
    -   @kinobi-so/node-types@0.21.2

## 0.21.1

### Patch Changes

-   Updated dependencies []:
    -   @kinobi-so/errors@0.21.1
    -   @kinobi-so/node-types@0.21.1

## 0.21.0

### Minor Changes

-   [#111](https://github.com/kinobi-so/kinobi/pull/111) [`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

-   Updated dependencies [[`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    -   @kinobi-so/node-types@0.21.0
    -   @kinobi-so/errors@0.21.0

## 0.20.6

### Patch Changes

-   [#102](https://github.com/kinobi-so/kinobi/pull/102) [`bcf6a23`](https://github.com/kinobi-so/kinobi/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in Kinobi

-   Updated dependencies [[`bcf6a23`](https://github.com/kinobi-so/kinobi/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    -   @kinobi-so/errors@0.20.6
    -   @kinobi-so/node-types@0.20.6

## 0.20.5

### Patch Changes

-   [#42](https://github.com/kinobi-so/kinobi/pull/42) [`908acba`](https://github.com/kinobi-so/kinobi/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8) Thanks [@kespinola](https://github.com/kespinola)! - set anchor account seed definitions on instructions as defaultValue for the associated instruction account. Removes hoisting PDAs to the program node for the time being.

-   Updated dependencies [[`908acba`](https://github.com/kinobi-so/kinobi/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8)]:
    -   @kinobi-so/errors@0.20.5
    -   @kinobi-so/node-types@0.20.5

## 0.20.4

### Patch Changes

-   [#43](https://github.com/kinobi-so/kinobi/pull/43) [`668b550`](https://github.com/kinobi-so/kinobi/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

-   Updated dependencies [[`668b550`](https://github.com/kinobi-so/kinobi/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    -   @kinobi-so/node-types@0.20.4
    -   @kinobi-so/errors@0.20.4

## 0.20.3

### Patch Changes

-   Updated dependencies [[`4bc5823`](https://github.com/kinobi-so/kinobi/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    -   @kinobi-so/errors@0.20.3
    -   @kinobi-so/node-types@0.20.3

## 0.20.2

### Patch Changes

-   [`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

-   Updated dependencies [[`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    -   @kinobi-so/errors@0.20.2
    -   @kinobi-so/node-types@0.20.2

## 0.20.1

### Patch Changes

-   [#21](https://github.com/kinobi-so/kinobi/pull/21) [`0dec0c8`](https://github.com/kinobi-so/kinobi/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

-   Updated dependencies [[`0dec0c8`](https://github.com/kinobi-so/kinobi/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    -   @kinobi-so/errors@0.20.1
    -   @kinobi-so/node-types@0.20.1
