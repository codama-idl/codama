# @codama/visitors-core

## 1.2.6

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.6
    - @codama/nodes@1.2.6

## 1.2.5

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/nodes@1.2.5

## 1.2.4

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/nodes@1.2.4

## 1.2.3

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/nodes@1.2.3

## 1.2.2

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/nodes@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/errors@1.2.1
    - @codama/nodes@1.2.1

## 1.2.0

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- Updated dependencies [[`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b), [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7)]:
    - @codama/nodes@1.2.0
    - @codama/errors@1.2.0

## 1.1.0

### Minor Changes

- [#280](https://github.com/codama-idl/codama/pull/280) [`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `NodePaths` in `NodeSelectors`

- [#270](https://github.com/codama-idl/codama/pull/270) [`81dedc1`](https://github.com/codama-idl/codama/commit/81dedc195feab40bfc3aa676a633a8340ad56e24) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Record and resolve `NodePaths` instead of `Nodes` in `LinkableDictionary`

- [#266](https://github.com/codama-idl/codama/pull/266) [`4799a7f`](https://github.com/codama-idl/codama/commit/4799a7f291677304823aa206bed64baabc20eb5b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `LinkableDictionary`'s inner `NodeStack`

- [#282](https://github.com/codama-idl/codama/pull/282) [`1f52f00`](https://github.com/codama-idl/codama/commit/1f52f00ba2a75a783879abfbaf4397c3e04e4db4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix LinkNode paths for `getByteSizeVisitor`

- [#285](https://github.com/codama-idl/codama/pull/285) [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow passing `NodeStacks` to nested visitors

- [#269](https://github.com/codama-idl/codama/pull/269) [`e95783b`](https://github.com/codama-idl/codama/commit/e95783bf02fd12327ca5b6f1c1c4e50e189dd241) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Introduces the `NodePath` type

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.1.0
    - @codama/nodes@1.1.0

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/nodes@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

- [#180](https://github.com/codama-idl/codama/pull/180) [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add optional `program` attribute to link nodes and namespace linkable nodes under their associated program.

### Patch Changes

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/errors@0.22.0
    - @codama/nodes@0.22.0

## 0.21.5

### Patch Changes

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/nodes@0.21.5

## 0.21.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/nodes@0.21.4

## 0.21.3

### Patch Changes

- [#123](https://github.com/codama-idl/codama/pull/123) [`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update prettier

- Updated dependencies []:
    - @codama/errors@0.21.3
    - @codama/nodes@0.21.3

## 0.21.2

### Patch Changes

- [#173](https://github.com/codama-idl/codama/pull/173) [`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Record linkables before the first visit

- [#172](https://github.com/codama-idl/codama/pull/172) [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `interceptFirstVisitVisitor` helper

- Updated dependencies []:
    - @codama/errors@0.21.2
    - @codama/nodes@0.21.2

## 0.21.1

### Patch Changes

- [#168](https://github.com/codama-idl/codama/pull/168) [`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `find` helper function to the `NodeStack` class

- Updated dependencies []:
    - @codama/errors@0.21.1
    - @codama/nodes@0.21.1

## 0.21.0

### Minor Changes

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/errors@0.21.0
    - @codama/nodes@0.21.0

## 0.20.6

### Patch Changes

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    - @codama/errors@0.20.6
    - @codama/nodes@0.20.6

## 0.20.5

### Patch Changes

- [#94](https://github.com/codama-idl/codama/pull/94) [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix identityVisitor for inlined PdaValueNode

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8)]:
    - @codama/errors@0.20.5
    - @codama/nodes@0.20.5

## 0.20.4

### Patch Changes

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/nodes@0.20.4
    - @codama/errors@0.20.4

## 0.20.3

### Patch Changes

- [#39](https://github.com/codama-idl/codama/pull/39) [`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70) Thanks [@febo](https://github.com/febo)! - Add missing getOrThrow implementation

- Updated dependencies [[`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/errors@0.20.3
    - @codama/nodes@0.20.3

## 0.20.2

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/nodes@0.20.2

## 0.20.1

### Patch Changes

- Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    - @codama/errors@0.20.1
    - @codama/nodes@0.20.1
