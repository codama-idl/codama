# @codama/renderers-rust

## 1.0.2

### Patch Changes

-   [#246](https://github.com/codama-idl/codama/pull/246) [`aa6dcd1`](https://github.com/codama-idl/codama/commit/aa6dcd16fbc734c2647a1a920a224dc90c4c0b18) Thanks [@febo](https://github.com/febo)! - Fix Rust rendering when account list is empty

-   [#245](https://github.com/codama-idl/codama/pull/245) [`e02e2ad`](https://github.com/codama-idl/codama/commit/e02e2ad9c03caacb02c4bf24d6b7d962ba3b80c6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix JS rendering issues for instruction edge cases

-   [#242](https://github.com/codama-idl/codama/pull/242) [`d4736da`](https://github.com/codama-idl/codama/commit/d4736daef236a8c41d53fe1f999f32b9bcbfb8c9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add options to configure how traits are rendered in Rust

## 1.0.1

### Patch Changes

-   [#238](https://github.com/codama-idl/codama/pull/238) [`8dc7092`](https://github.com/codama-idl/codama/commit/8dc70921ba9f37bb8f3f654b82a3b5f3ffbc1339) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix missing semicolon in generated Rust code

## 1.0.0

### Major Changes

-   [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

-   Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    -   @codama/errors@1.0.0
    -   @codama/nodes@1.0.0
    -   @codama/renderers-core@1.0.0
    -   @codama/visitors-core@1.0.0

## 0.22.0

### Minor Changes

-   [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

-   [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

### Patch Changes

-   Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    -   @codama/visitors-core@0.22.0
    -   @codama/errors@0.22.0
    -   @codama/nodes@0.22.0
    -   @codama/renderers-core@0.22.0

## 0.21.8

### Patch Changes

-   [#231](https://github.com/codama-idl/codama/pull/231) [`3c18cee`](https://github.com/codama-idl/codama/commit/3c18ceeffb97922db500138af85d20fce00f80b2) Thanks [@aoikurokawa](https://github.com/aoikurokawa)! - Fix typo in generated comment

## 0.21.7

### Patch Changes

-   Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    -   @codama/errors@0.21.5
    -   @codama/nodes@0.21.5
    -   @codama/renderers-core@0.21.3
    -   @codama/visitors-core@0.21.5

## 0.21.6

### Patch Changes

-   Updated dependencies []:
    -   @codama/errors@0.21.4
    -   @codama/nodes@0.21.4
    -   @codama/visitors-core@0.21.4
    -   @codama/renderers-core@0.21.2

## 0.21.5

### Patch Changes

-   Updated dependencies [[`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    -   @codama/visitors-core@0.21.3
    -   @codama/renderers-core@0.21.1
    -   @codama/errors@0.21.3
    -   @codama/nodes@0.21.3

## 0.21.4

### Patch Changes

-   Updated dependencies [[`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2), [`f13abb0`](https://github.com/codama-idl/codama/commit/f13abb01fc4a6fc76fe4566e3f667aab92b43480)]:
    -   @codama/visitors-core@0.21.2
    -   @codama/renderers-core@0.21.0
    -   @codama/errors@0.21.2
    -   @codama/nodes@0.21.2

## 0.21.3

### Patch Changes

-   Updated dependencies [[`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    -   @codama/visitors-core@0.21.1
    -   @codama/renderers-core@0.20.8
    -   @codama/errors@0.21.1
    -   @codama/nodes@0.21.1

## 0.21.2

### Patch Changes

-   [#160](https://github.com/codama-idl/codama/pull/160) [`87bab8a`](https://github.com/codama-idl/codama/commit/87bab8ad6f2e40903064be9258a741e176eeef77) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Bump to web3js rc

## 0.21.1

### Patch Changes

-   [#152](https://github.com/codama-idl/codama/pull/152) [`33cc3b7`](https://github.com/codama-idl/codama/commit/33cc3b7d29e60f5c0bd746f229187c1747755fbb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Support type aliases from `DefinedTypeNodes`

-   [#144](https://github.com/codama-idl/codama/pull/144) [`dc04203`](https://github.com/codama-idl/codama/commit/dc04203f427502614a6300fd9b7fa7b0a7d61930) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add support for ShortU16 and ShortVec

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

## 0.20.12

### Patch Changes

-   [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

-   Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    -   @codama/renderers-core@0.20.6
    -   @codama/errors@0.20.6
    -   @codama/nodes@0.20.6
    -   @codama/visitors-core@0.20.6

## 0.20.11

### Patch Changes

-   Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    -   @codama/errors@0.20.5
    -   @codama/nodes@0.20.5
    -   @codama/visitors-core@0.20.5
    -   @codama/renderers-core@0.20.5

## 0.20.10

### Patch Changes

-   [#56](https://github.com/codama-idl/codama/pull/56) [`cde409c`](https://github.com/codama-idl/codama/commit/cde409c6132a66a27091bfb7025904e70b7689a4) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Rust Renderer: Add toolchain arg to formatter

## 0.20.9

### Patch Changes

-   [#54](https://github.com/codama-idl/codama/pull/54) [`5b8186f`](https://github.com/codama-idl/codama/commit/5b8186f0231e767bba7fa02a201eb7dcb87591a3) Thanks [@febo](https://github.com/febo)! - Add support to Anchor idl build for account types

## 0.20.8

### Patch Changes

-   [#50](https://github.com/codama-idl/codama/pull/50) [`6a8c6c3`](https://github.com/codama-idl/codama/commit/6a8c6c3b4c8eddbbf126b864fefab104c8758010) Thanks [@febo](https://github.com/febo)! - Add anchor traits impl for accounts

## 0.20.7

### Patch Changes

-   [#45](https://github.com/codama-idl/codama/pull/45) [`378f007`](https://github.com/codama-idl/codama/commit/378f007345bda028e31cdd9d4e34ce8279257485) Thanks [@febo](https://github.com/febo)! - Add copy derive to scalar enums in Rust renderer

-   Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    -   @codama/nodes@0.20.4
    -   @codama/errors@0.20.4
    -   @codama/renderers-core@0.20.4
    -   @codama/visitors-core@0.20.4

## 0.20.6

### Patch Changes

-   Updated dependencies [[`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    -   @codama/visitors-core@0.20.3
    -   @codama/errors@0.20.3
    -   @codama/renderers-core@0.20.3
    -   @codama/nodes@0.20.3

## 0.20.5

### Patch Changes

-   [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

-   Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    -   @codama/errors@0.20.2
    -   @codama/nodes@0.20.2
    -   @codama/renderers-core@0.20.2
    -   @codama/visitors-core@0.20.2

## 0.20.4

### Patch Changes

-   [#27](https://github.com/codama-idl/codama/pull/27) [`46bfc2d`](https://github.com/codama-idl/codama/commit/46bfc2dd3609dc63e7d05e30dd1d196c9e8903cf) Thanks [@samuelvanderwaal](https://github.com/samuelvanderwaal)! - Make rust docs codama link clickable

-   [#32](https://github.com/codama-idl/codama/pull/32) [`3645d92`](https://github.com/codama-idl/codama/commit/3645d92845db3582b801f2a32f1c36e6b478b754) Thanks [@febo](https://github.com/febo)! - Add default impl for instruction data struct in Rust renderer

-   [#31](https://github.com/codama-idl/codama/pull/31) [`e0ea30c`](https://github.com/codama-idl/codama/commit/e0ea30c168bcdc1cb376cf8ca6bd4bb76778acf2) Thanks [@febo](https://github.com/febo)! - Render error codes on Rust renderer

## 0.20.3

### Patch Changes

-   [#25](https://github.com/codama-idl/codama/pull/25) [`2382631`](https://github.com/codama-idl/codama/commit/238263129b61df67f010b47cd9229b2662eaccb2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix generated PDA prefix

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
