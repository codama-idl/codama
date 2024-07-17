# @kinobi-so/errors

## 0.21.0

### Minor Changes

- [#111](https://github.com/kinobi-so/kinobi/pull/111) [`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

  A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
  - @kinobi-so/node-types@0.21.0

## 0.20.6

### Patch Changes

- [#102](https://github.com/kinobi-so/kinobi/pull/102) [`bcf6a23`](https://github.com/kinobi-so/kinobi/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in Kinobi

- Updated dependencies []:
  - @kinobi-so/node-types@0.20.6

## 0.20.5

### Patch Changes

- [#42](https://github.com/kinobi-so/kinobi/pull/42) [`908acba`](https://github.com/kinobi-so/kinobi/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8) Thanks [@kespinola](https://github.com/kespinola)! - set anchor account seed definitions on instructions as defaultValue for the associated instruction account. Removes hoisting PDAs to the program node for the time being.

- Updated dependencies []:
  - @kinobi-so/node-types@0.20.5

## 0.20.4

### Patch Changes

- Updated dependencies [[`668b550`](https://github.com/kinobi-so/kinobi/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
  - @kinobi-so/node-types@0.20.4

## 0.20.3

### Patch Changes

- [#40](https://github.com/kinobi-so/kinobi/pull/40) [`4bc5823`](https://github.com/kinobi-so/kinobi/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c) Thanks [@febo](https://github.com/febo)! - Fix typo in error message

- Updated dependencies []:
  - @kinobi-so/node-types@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e)]:
  - @kinobi-so/node-types@0.20.2

## 0.20.1

### Patch Changes

- [#21](https://github.com/kinobi-so/kinobi/pull/21) [`0dec0c8`](https://github.com/kinobi-so/kinobi/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

- Updated dependencies []:
  - @kinobi-so/node-types@0.20.1
