# @codama/renderers-js

## 1.0.0

### Major Changes

-   [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

-   Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    -   @codama/errors@1.0.0
    -   @codama/nodes@1.0.0
    -   @codama/nodes-from-anchor@1.0.0
    -   @codama/renderers-core@1.0.0
    -   @codama/visitors-core@1.0.0

## 0.22.0

### Minor Changes

-   [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

-   [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

### Patch Changes

-   [#224](https://github.com/codama-idl/codama/pull/224) [`345a145`](https://github.com/codama-idl/codama/commit/345a145bb9a9b181c8db9435a46d35dacbfced41) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add an optional programAddress override to instruction builders

-   Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    -   @codama/visitors-core@0.22.0
    -   @codama/errors@0.22.0
    -   @codama/nodes@0.22.0
    -   @codama/renderers-core@0.22.0
    -   @codama/nodes-from-anchor@0.22.0

## 0.21.9

### Patch Changes

-   [`4f6c8a9`](https://github.com/codama-idl/codama/commit/4f6c8a971e70010d246b2691ccde847f0162b981) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add an optional programAddress override to instruction builders

-   Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    -   @codama/errors@0.21.5
    -   @codama/nodes@0.21.5
    -   @codama/nodes-from-anchor@0.21.3
    -   @codama/renderers-core@0.21.3
    -   @codama/visitors-core@0.21.5

## 0.21.8

### Patch Changes

-   [#200](https://github.com/codama-idl/codama/pull/200) [`6639091`](https://github.com/codama-idl/codama/commit/6639091714ae3b5c4330f0b1f43816fea373d55f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix a bug that reuses the same `ImportMap` within different code fragments

## 0.21.7

### Patch Changes

-   Updated dependencies []:
    -   @codama/errors@0.21.4
    -   @codama/nodes@0.21.4
    -   @codama/visitors-core@0.21.4
    -   @codama/nodes-from-anchor@0.21.2
    -   @codama/renderers-core@0.21.2

## 0.21.6

### Patch Changes

-   [#123](https://github.com/codama-idl/codama/pull/123) [`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update prettier

-   Updated dependencies [[`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    -   @codama/nodes-from-anchor@0.21.1
    -   @codama/visitors-core@0.21.3
    -   @codama/renderers-core@0.21.1
    -   @codama/errors@0.21.3
    -   @codama/nodes@0.21.3

## 0.21.5

### Patch Changes

-   Updated dependencies [[`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2), [`f13abb0`](https://github.com/codama-idl/codama/commit/f13abb01fc4a6fc76fe4566e3f667aab92b43480)]:
    -   @codama/visitors-core@0.21.2
    -   @codama/nodes-from-anchor@0.21.0
    -   @codama/renderers-core@0.21.0
    -   @codama/errors@0.21.2
    -   @codama/nodes@0.21.2

## 0.21.4

### Patch Changes

-   [#168](https://github.com/codama-idl/codama/pull/168) [`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export discriminator constants for instructions and accounts

-   Updated dependencies [[`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    -   @codama/visitors-core@0.21.1
    -   @codama/renderers-core@0.20.8
    -   @codama/nodes-from-anchor@0.20.10
    -   @codama/errors@0.21.1
    -   @codama/nodes@0.21.1

## 0.21.3

### Patch Changes

-   [#161](https://github.com/codama-idl/codama/pull/161) [`524687c`](https://github.com/codama-idl/codama/commit/524687cfe4b1a5e7a64cd133191bc1548f580d5b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Use lamports type/encoder/decoder for SolAmountTypeNode

-   [#160](https://github.com/codama-idl/codama/pull/160) [`87bab8a`](https://github.com/codama-idl/codama/commit/87bab8ad6f2e40903064be9258a741e176eeef77) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Bump to web3js rc

## 0.21.2

### Patch Changes

-   [#138](https://github.com/codama-idl/codama/pull/138) [`af8ac37`](https://github.com/codama-idl/codama/commit/af8ac374192d1c1b6c834c31fa30bc72d4b7da8e) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Use ReadonlyUint8Array for identifying accounts/instructions by data

## 0.21.1

### Patch Changes

-   [#127](https://github.com/codama-idl/codama/pull/127) [`62545be`](https://github.com/codama-idl/codama/commit/62545be66e44747d7fd31f186a7a3c856ea2ad9c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add isProgramError helper

## 0.21.0

### Minor Changes

-   [#110](https://github.com/codama-idl/codama/pull/110) [`2d45383`](https://github.com/codama-idl/codama/commit/2d453830621047da2a18001ab427db9b603ad025) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderers to tp4 of web3.js

-   [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

-   Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    -   @codama/visitors-core@0.21.0
    -   @codama/errors@0.21.0
    -   @codama/nodes@0.21.0
    -   @codama/renderers-core@0.20.7
    -   @codama/nodes-from-anchor@0.20.9

## 0.20.11

### Patch Changes

-   [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

-   [#103](https://github.com/codama-idl/codama/pull/103) [`93942cc`](https://github.com/codama-idl/codama/commit/93942ccb8cb87d4f4ede1ef3e2398e10635dbaf2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in generated code

-   Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f), [`4979b94`](https://github.com/codama-idl/codama/commit/4979b94720465a58538ee61bb1a4a23fd5471511)]:
    -   @codama/renderers-core@0.20.6
    -   @codama/errors@0.20.6
    -   @codama/nodes@0.20.6
    -   @codama/nodes-from-anchor@0.20.8
    -   @codama/visitors-core@0.20.6

## 0.20.10

### Patch Changes

-   Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    -   @codama/nodes-from-anchor@0.20.7
    -   @codama/errors@0.20.5
    -   @codama/nodes@0.20.5
    -   @codama/visitors-core@0.20.5
    -   @codama/renderers-core@0.20.5

## 0.20.9

### Patch Changes

-   [#53](https://github.com/codama-idl/codama/pull/53) [`e3e4099`](https://github.com/codama-idl/codama/commit/e3e4099e33b4d1dd9bc63e9c4997dc00426c8010) Thanks [@febo](https://github.com/febo)! - Filter out type variant on imports

## 0.20.8

### Patch Changes

-   [#52](https://github.com/codama-idl/codama/pull/52) [`baeaf14`](https://github.com/codama-idl/codama/commit/baeaf1495ca592f6fdad7d10e9f0bed6f81888f1) Thanks [@lithdew](https://github.com/lithdew)! - Fix rendering PDA helper functions with a default programId.

-   [#48](https://github.com/codama-idl/codama/pull/48) [`0771b9d`](https://github.com/codama-idl/codama/commit/0771b9d1c6447db85887831f921dbe92a2e0adfc) Thanks [@lithdew](https://github.com/lithdew)! - Have generated TypeScript code for renderers-js support verbatimModuleSyntax

## 0.20.7

### Patch Changes

-   [#46](https://github.com/codama-idl/codama/pull/46) [`bcd5eae`](https://github.com/codama-idl/codama/commit/bcd5eaedf673432106e7cc72273e36f729cc8275) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix unused args variable on sync instruction functions on JS renderer again

## 0.20.6

### Patch Changes

-   [#43](https://github.com/codama-idl/codama/pull/43) [`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

-   Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    -   @codama/nodes@0.20.4
    -   @codama/errors@0.20.4
    -   @codama/renderers-core@0.20.4
    -   @codama/visitors-core@0.20.4

## 0.20.5

### Patch Changes

-   Updated dependencies [[`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    -   @codama/visitors-core@0.20.3
    -   @codama/errors@0.20.3
    -   @codama/renderers-core@0.20.3
    -   @codama/nodes@0.20.3

## 0.20.4

### Patch Changes

-   [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

-   Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    -   @codama/errors@0.20.2
    -   @codama/nodes@0.20.2
    -   @codama/renderers-core@0.20.2
    -   @codama/visitors-core@0.20.2

## 0.20.3

### Patch Changes

-   [#29](https://github.com/codama-idl/codama/pull/29) [`5794385`](https://github.com/codama-idl/codama/commit/57943852a2cf3ba6552942d9787f82657d38fafb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix unused args variable on sync instruction functions

## 0.20.2

### Patch Changes

-   [`2857238`](https://github.com/codama-idl/codama/commit/28572383c1f6f6968df88be61d49b41059475d94) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderer headers and pnpm

-   [#24](https://github.com/codama-idl/codama/pull/24) [`b9cd6b2`](https://github.com/codama-idl/codama/commit/b9cd6b29f4e5229512a7cc3dd28a6f6074dedd98) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix "object is not extensible" in PDA helper function

## 0.20.1

### Patch Changes

-   [#21](https://github.com/codama-idl/codama/pull/21) [`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

-   Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    -   @codama/renderers-core@0.20.1
    -   @codama/errors@0.20.1
    -   @codama/nodes@0.20.1
    -   @codama/visitors-core@0.20.1
